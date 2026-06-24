# StorySeed AI 배포 가이드

AI 어린이 그림책 생성 플랫폼의 프로덕션 배포 절차입니다.

## 사전 요구사항

- [Node.js](https://nodejs.org/) 20+
- [Supabase](https://supabase.com/) 프로젝트
- [OpenAI](https://platform.openai.com/) API 키
- [Vercel](https://vercel.com/) 계정 (권장)

## 1. Supabase 설정

### 1-1. 프로젝트 생성

1. Supabase 대시보드에서 새 프로젝트를 생성합니다.
2. **Settings → API**에서 다음 값을 확인합니다:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 1-2. 데이터베이스 마이그레이션

Supabase SQL Editor에서 아래 파일을 순서대로 실행합니다:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_storage_buckets.sql`

또는 Supabase CLI 사용:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### 1-3. 인증 설정

1. **Authentication → Providers → Email** 활성화
2. **Authentication → URL Configuration**:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`

### 1-4. Storage 확인

마이그레이션 후 다음 버킷이 생성되었는지 확인합니다:

- `book-images` (public)
- `book-audio` (public)
- `book-pdfs` (public)

## 2. OpenAI 설정

1. [OpenAI Platform](https://platform.openai.com/)에서 API 키를 발급합니다.
2. 다음 모델에 대한 접근 권한이 필요합니다:
   - `gpt-4.1` (스토리 생성 — Responses API)
   - `gpt-image-1` (삽화 생성)
   - `gpt-4o-mini-tts` (음성 낭독)

3. 사용량 한도를 설정합니다 (20페이지 책 1권당 약 $2~5 예상).

## 3. 로컬 개발

```bash
cd storyseed-ai
cp .env.example .env.local
# .env.local 파일에 실제 키 값 입력

npm install
npm run dev
```

`http://localhost:3000`에서 확인합니다.

> `.env.local`은 반드시 `.gitignore`에 포함되어야 합니다.

## 4. Vercel 배포

### 4-1. GitHub 연동

```bash
git init
git add .
git commit -m "Initial StorySeed AI setup"
git remote add origin <your-repo-url>
git push -u origin main
```

### 4-2. Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/new)에서 GitHub 저장소를 import
2. **Root Directory**: `storyseed-ai`
3. **Framework Preset**: Next.js

### 4-3. 환경 변수 설정

Vercel → Settings → Environment Variables:

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (서버 전용) |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `AIHUB_API_KEY` | AI Hub aihubshell API 키 ([aihub.or.kr](https://aihub.or.kr) 발급) |
| `AIHUB_SHELL_PATH` | (선택) aihubshell 바이너리 경로 |
| `NEXT_PUBLIC_APP_URL` | 배포 URL (예: `https://storyseed.vercel.app`) |

### 4-4. 함수 타임아웃

그림책 생성은 백그라운드(`after()`)에서 실행됩니다. Vercel Pro 플랜에서는 `maxDuration: 300`이 적용됩니다.

**Hobby 플랜**의 경우 10초 제한으로 생성이 중단될 수 있습니다. Pro 플랜 사용을 권장합니다.

## 5. 아키텍처 개요

```
사용자 입력 (이름, 나이, 관심사, 교육주제)
        ↓
POST /api/book/generate
        ↓
DB에 book 레코드 생성 (status: pending)
        ↓
after() 백그라운드 파이프라인
  ├── GPT Responses API → 20페이지 스토리
  ├── gpt-image-1 → 페이지별 삽화 → Supabase Storage
  ├── TTS → 페이지별 음성 → Supabase Storage
  └── pdf-lib → PDF 생성 → Supabase Storage
        ↓
status: completed (클라이언트 폴링)
```

## 6. API 엔드포인트

### POST `/api/book/generate`

```json
{
  "name": "민준",
  "age": 7,
  "favorite": "공룡",
  "lesson": "용기"
}
```

응답:

```json
{
  "bookId": "uuid",
  "status": "pending",
  "message": "그림책 생성이 시작되었습니다."
}
```

### GET `/api/book/[id]/status`

생성 진행 상태를 반환합니다.

### GET `/api/book/[id]/pdf`

완성된 PDF를 다운로드합니다.

### GET `/api/aihub/datasets`

AI Hub 데이터셋/패키지 목록 조회 (`mode=l|pl`, `datasetkey`, `datapckagekey`, `q`).

### POST `/api/aihub/download`

AI Hub 데이터 다운로드 (`mode=d|pd`, `datasetkey` 또는 `datapckagekey`, `filekeys`).

## 7. AI Hub (aihubshell) 설정

### 7-1. API 키

1. [aihub.or.kr](https://aihub.or.kr)에서 API key를 발급받습니다.
2. `.env.local`에 `AIHUB_API_KEY`로 설정합니다 (Git에 커밋하지 마세요).
3. Vercel 배포 시 Environment Variables에 동일하게 등록합니다.

### 7-2. aihubshell 설치

**Windows (PowerShell):**

```powershell
.\scripts\download-aihubshell.ps1
```

**Linux / macOS / Git Bash:**

```bash
chmod +x scripts/download-aihubshell.sh
./scripts/download-aihubshell.sh
```

설치 후 `.env.local`에 선택적으로 설정:

```
AIHUB_SHELL_PATH=./tools/aihubshell
```

### 7-3. CLI 직접 사용 예시

```bash
# 데이터셋 목록
aihubshell -mode l -aihubapikey "$AIHUB_API_KEY"

# 데이터셋 파일 목록
aihubshell -mode l -datasetkey 593 -aihubapikey "$AIHUB_API_KEY"

# 데이터셋 다운로드 (승인 완료 필요)
aihubshell -mode d -datasetkey 593 -aihubapikey "$AIHUB_API_KEY"
```

> API key에 특수문자가 있으면 홑따옴표로 감싸세요: `'your-key-here'`

## 8. 보안 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경 변수에만 설정
- [ ] `.env.local`이 `.gitignore`에 포함
- [ ] Supabase RLS 정책이 활성화됨
- [ ] Storage 정책으로 사용자별 폴더 접근 제한
- [ ] `AIHUB_API_KEY`는 서버 환경 변수에만 설정 (코드/문서에 하드코딩 금지)
- [ ] OpenAI API 키에 사용량 한도 설정
- [ ] 프로덕션에서 이메일 인증 활성화 권장

## 9. 모니터링

- **Vercel**: Functions 로그에서 생성 파이프라인 오류 확인
- **Supabase**: Table Editor에서 `books.status`, `error_message` 모니터링
- **OpenAI**: Usage 대시보드에서 API 비용 추적

## 10. 문제 해결

| 증상 | 해결 |
|------|------|
| 생성이 `failed`로 끝남 | Vercel Functions 로그 및 `books.error_message` 확인 |
| 이미지가 표시되지 않음 | Storage 버킷 public 설정 및 `next.config.ts` remotePatterns 확인 |
| 인증 리다이렉트 실패 | Supabase Redirect URL 설정 확인 |
| PDF 다운로드 실패 | `book-pdfs` 버킷 및 `pdf_url` 값 확인 |
| AI Hub 조회 실패 | `AIHUB_API_KEY` 설정, aihubshell 설치, Git Bash/WSL 확인 |

## 11. 비용 예상 (월간)

| 서비스 | 예상 비용 |
|--------|----------|
| Vercel Pro | $20/월 |
| Supabase Free/Pro | $0~25/월 |
| OpenAI API | 책 1권당 $2~5 (사용량 기반) |

---

문의: 프로젝트 이슈 트래커를 이용해 주세요.
