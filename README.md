# StorySeed AI

AI 어린이 그림책 생성 플랫폼 — 30초만에 스토리, 삽화, 음성낭독, PDF까지 자동 생성.

## Tech Stack

- **Next.js 15+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth, PostgreSQL, Storage)
- **OpenAI** (Responses API, Image Generation, TTS)
- **pdf-lib** (PDF 생성)

## Quick Start

```bash
cp .env.example .env.local
# .env.local에 Supabase 및 OpenAI 키 입력

npm install
npm run dev
```

## Features

1. **사용자 인증** — Supabase Email Auth
2. **그림책 생성** — 20페이지 맞춤 스토리
3. **삽화 생성** — 페이지별 AI 일러스트
4. **음성 낭독** — OpenAI TTS
5. **PDF 출력** — 그림책 다운로드
6. **내 서재** — 생성된 책 관리
7. **AI Hub 연동** — aihubshell 데이터셋 조회/다운로드

## Project Structure

```
src/
├── app/
│   ├── (app)/          # 인증 필요 페이지
│   ├── (auth)/         # 로그인/회원가입
│   ├── api/book/       # REST API
│   └── auth/callback/  # OAuth 콜백
├── components/         # React UI
├── lib/
│   ├── actions/        # Server Actions
│   ├── openai/         # AI 파이프라인
│   ├── pdf/            # PDF 생성
│   ├── pipeline/       # 책 생성 오케스트레이션
│   └── supabase/       # DB 클라이언트
supabase/
└── migrations/         # DB 스키마
```

## API

```bash
POST /api/book/generate
{
  "name": "민준",
  "age": 7,
  "favorite": "공룡",
  "lesson": "용기"
}
```

## Deployment

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

## License

Private — All rights reserved.
