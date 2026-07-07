# Alerter — 구독 등록용 PWA
# 별잋 알벌트.. 알버트 집사의 이름

이 폴더는 **웹푸시 구독을 만들고 그 정보를 파일로 내려받기 위한 PWA**입니다.
푸시 발송과 일정 데이터 처리는 별도의 발송 프로젝트(메일 프로젝트)로 옮겼고,
여기에는 상시 서버가 없습니다.

## 하는 일

1. 브라우저에서 알림 권한을 허용합니다.
2. 브라우저가 `PushSubscription`(endpoint + keys)을 생성합니다.
3. 임의의 `subscriberId`를 만들어 구독 정보와 함께 **`subscription.json` 파일로 자동 다운로드**합니다.
4. 이 파일을 발송 프로젝트에 넣으면, 발송 쪽에서 이 구독자에게 푸시를 보낼 수 있습니다.

서버로 구독을 전송하지 않으므로 이 프로젝트에는 켜둘 프로세스가 없습니다.
`serve`로 정적 호스팅만 하면 됩니다.

## 폴더 구성

- `index.html` — 구독 생성 + 구독 파일 다운로드 화면
- `sw.js` — service worker. 푸시를 받아 알림을 표시(한글 base64 payload 복호화 포함)
- `style.css`, `icon.svg`, `manifest.json` — PWA 리소스

## 실행 방법

정적 호스팅만 하면 됩니다. localhost 또는 HTTPS여야 푸시 구독이 동작합니다.

```powershell
cd C:\Dev\rpa\alerter\pwa
npx --yes serve . -l 4173
```

브라우저에서 접속:

```text
http://localhost:4173
```

`on` 버튼을 누르면 권한 요청 → 구독 생성 → `subscription.json` 다운로드가 이어집니다.
필요하면 `구독 파일 다시 받기` 버튼으로 같은 파일을 다시 받을 수 있습니다.

## subscription.json 형식

발송 프로젝트가 그대로 읽을 수 있도록 배열 형태로 내려받습니다.

```json
[
  {
    "subscriberId": "생성된-UUID",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "expirationTime": null,
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "createdAt": "ISO 시각",
    "updatedAt": "ISO 시각"
  }
]
```

여러 기기를 구독하면 각 기기에서 받은 파일의 항목을 하나의 배열에 합쳐 관리하면 됩니다.

## VAPID 키

`index.html`의 `VAPID_PUBLIC_KEY`는 발송 프로젝트가 쓰는 **공개키와 반드시 같아야** 합니다.
공개키가 구독을 특정 발송자에게 묶으므로, 값이 다르면 발송이 거부됩니다.
개인키는 발송 프로젝트에만 두고 이 PWA에는 넣지 않습니다.

## 발송 쪽 (이 프로젝트 밖)

푸시 발송은 발송 프로젝트의 일회성 스크립트가 담당합니다.
대략 다음을 수행합니다.

- `webpush.setVapidDetails(...)`로 발송자 신분 설정
- `subscription.json` 읽기
- `webpush.sendNotification(subscription, payload)` 호출 후 종료

상시 서버 없이 "필요할 때 실행되고 끝나는" 구조입니다.
