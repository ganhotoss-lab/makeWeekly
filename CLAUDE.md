@AGENTS.md

---

# Weekly Report 프로젝트 지침

## 프로젝트 개요

팀 Weekly 보고서를 웹 기반으로 작성·취합·발송하는 시스템이다.
구성원이 업무 항목을 한 번 등록하면 매주 This Week / Next Week만 갱신하는 **누적 업데이트 구조**로 운영한다.
관리자는 작성 현황을 확인하고, AI 요약 + Excel 파일을 이메일로 발송한다.

## 기술 스택

- **Framework**: Next.js 16 App Router (TypeScript, Tailwind CSS)
- **DB / Auth**: Supabase (PostgreSQL + RLS + Auth)
- **AI**: Claude API (`claude-sonnet-5`) — `/lib/ai.ts`
- **Excel**: ExcelJS — `/lib/excel.ts`
- **Email**: Resend API — `/lib/email.ts`
- **Supabase 클라이언트**: `@supabase/ssr`
  - 서버용: `lib/supabase/server.ts` (`createClient`, `createAdminClient`)
  - 클라이언트용: `lib/supabase/client.ts` (`createBrowserClient`)

## 라우트 구조

```
app/
├── (auth)/login/          → /login
├── (user)/
│   ├── layout.tsx         → 일반 사용자 레이아웃 (파란 헤더)
│   ├── weekly/            → /weekly  (이번 주 Weekly 메인)
│   ├── history/           → /history (이력 조회)
│   └── tasks/
│       ├── new/           → /tasks/new  (신규 업무 등록)
│       └── [id]/          → /tasks/[id] (업무 수정)
├── (admin)/
│   ├── layout.tsx         → 관리자 레이아웃 (보라 헤더)
│   └── admin/
│       ├── dashboard/     → /admin/dashboard  (작성 현황)
│       ├── users/         → /admin/users      (사용자 관리)
│       ├── users/[id]/    → /admin/users/[id] (사용자 업무 조회)
│       ├── summary/       → /admin/summary    (취합 / AI 요약 / 발송)
│       └── email-logs/    → /admin/email-logs (발송 이력)
└── api/
    ├── admin/users/       → POST: 사용자 생성
    ├── summary/           → POST: AI 요약 생성
    └── email/             → POST: Excel 생성 + 이메일 발송
```

> **주의**: `(admin)` 폴더명은 URL에서 제거된다. 실제 `/admin/*` URL은 `(admin)/admin/` 하위에 위치한다.

## DB 스키마

### users
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | Supabase Auth UID |
| email | text | 로그인 이메일 |
| name | text | 사용자명 |
| team | text | 소속 팀 |
| role | text | `user` 또는 `admin` |
| is_active | boolean | 작성 대상 여부 |
| created_at | timestamp | - |

### tasks (업무 항목 원장)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | - |
| user_id | uuid | users.id 참조 |
| category | text | Biz사업 / 내부개선 / 상품 / 기타 |
| content | text | 업무 내용(목적/개요) |
| analysis_status / _start_date / _end_date | text/date | 분석/설계 |
| development_status / _start_date / _end_date | text/date | 개발 |
| uat_status / _start_date / _end_date | text/date | UAT |
| open_status / open_date | text/date | OPEN |
| note | text | 비고(이슈·리스크) |
| is_completed | boolean | 완료 처리 여부 |

상태 선택값: `미시작` / `진행중` / `완료` (OPEN은 `미오픈` / `오픈완료`)

### weekly_entries (주간 업데이트 이력)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | - |
| task_id | uuid | tasks.id 참조 |
| user_id | uuid | users.id 참조 (조회 편의) |
| week_start_date | date | 주 시작일(월요일) |
| week_label | text | 예: "07/21~07/25" |
| this_week | text | 이번 주 수행 내용 |
| next_week | text | 다음 주 예정 내용 |

### email_logs
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | - |
| week_start_date | date | 대상 주차 |
| recipient_email | text | 수신자 |
| file_name | text | 첨부 파일명 |
| ai_summary | text | AI 요약 원문 |
| status | text | `success` / `failed` |
| error_message | text | 실패 사유 |
| sent_at | timestamp | 발송일 |

## RLS 핵심 규칙

- `is_admin()` 함수(`SECURITY DEFINER`)로 admin 여부 확인 — 재귀 RLS 방지
- 일반 사용자: 본인 데이터만 SELECT/INSERT/UPDATE
- 관리자: 전체 데이터 조회 가능
- `createAdminClient()` (service role key)는 서버 컴포넌트/API 라우트에서만 사용

## 주요 비즈니스 규칙

1. **주차 계산**: 월요일 기준 (`lib/week.ts` — `getWeekStartDate`, `getWeekLabel`)
2. **누적 업데이트**: tasks는 완료 전까지 유지, weekly_entries에 주차별 이력 기록
3. **완료 처리**: `tasks.is_completed = true` → 이번 주 Weekly 목록에서 숨김
4. **Excel**: 사용자별 시트 + AI 요약 시트 구성
5. **이메일 발신자**: `onboarding@resend.dev` (Resend 무료 플랜 기본 도메인)
6. **비활성 사용자**: `is_active = false` → 로그인 차단 + 취합 대상 제외

## 환경변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
ADMIN_EMAIL=
```

## 개발 서버

```bash
npm run dev   # http://localhost:3000
```

`.claude/launch.json`에 등록되어 있어 Browser 도구로 바로 실행 가능하다.
