self.addEventListener('install', (event) => {
  // 새 워커를 바로 대기 상태로 넘기지 않고 즉시 활성화 후보로 올립니다.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // 이미 열린 페이지도 새 워커가 바로 제어할 수 있게 합니다.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const separator = '__ALERTER_SPLIT__';

  function decodeBase64Utf8(value) {
    // 서버에서 base64로 감싼 한글 payload를 원래 UTF-8 문자열로 되돌립니다.
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  event.waitUntil((async () => {
    let title = 'ALBERT';
    let body = '새 알림이 도착했습니다.';

    if (event.data) {
      const rawText = event.data.text();

      try {
        const parsed = JSON.parse(rawText);
        if (parsed.encoding === 'base64') {
          // 한글 깨짐을 피하려고 title/body를 base64 문자열로 받아 복호화합니다.
          title = parsed.titleBase64 !== undefined ? decodeBase64Utf8(parsed.titleBase64) : title;
          body = parsed.bodyBase64 !== undefined ? decodeBase64Utf8(parsed.bodyBase64) : body;
        } else {
          title = parsed.title || title;
          body = parsed.body || body;
        }
      } catch {
        const [textTitle, ...rest] = rawText.split(separator);
        if (rest.length > 0) {
          title = textTitle || title;
          body = rest.join(separator) || body;
        } else {
          body = rawText || body;
        }
      }
    }

    const notificationTag = `push-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    await self.registration.showNotification(title, {
      body,
      tag: notificationTag,
      icon: './icon.svg',
      badge: './icon.svg',
    });
  })());
});
