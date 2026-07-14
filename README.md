# 비교과 포털 (Next.js migration)

## 실행 및 점검

Next.js 개발 서버는 다음 명령으로 실행합니다.

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run test:unit
npm run test:e2e
```

`npm run start`는 먼저 `npm run build`를 완료한 뒤 사용합니다. 단위 테스트와 E2E 테스트는 각각 `test:unit`, `test:e2e` 스크립트가 실행합니다.

## 라우트

- **포털**: `/`, `/login`, `/integrated`, `/submit`, `/form`, `/dept`, `/toeic`, `/volunteer`, `/stats`, `/settings`는 Next App Router의 포털 페이지가 소유합니다.
- **Workflow Lab**: `/workflow-lab/`, `/workflow-lab/dept`, `/workflow-lab/form`, `/workflow-lab/toeic`, `/workflow-lab/volunteer`는 별도의 Workflow Lab 라우트가 소유합니다.
- 기존 링크 호환을 위해 `/workflow-lab/index.html`, `dept.html`, `form.html`, `toeic.html`, `volunteer.html` 요청은 각각 대응하는 위의 Next 경로로 리디렉션됩니다.

## 데이터와 인증

인증과 업무 데이터는 시드 데이터와 브라우저 `localStorage`를 사용하는 목업입니다. 서버 저장소나 실제 인증이 아니며 보안 경계가 아니므로 실제 개인정보·비밀번호를 사용하면 안 됩니다.

## HWPX 및 배포

HWPX 내보내기는 `POST /api/export-hwp` Node.js 런타임 route에서 처리합니다. 운영 배포 전 Vercel의 Node-runtime 패키징과 Preview 환경에서의 동작(특히 HWPX export 및 레거시 리디렉션)을 별도로 검증해야 합니다. 이 저장소 README에는 해당 배포 검증 결과를 주장하지 않습니다.