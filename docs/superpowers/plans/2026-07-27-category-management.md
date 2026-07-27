# Category Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to add/delete task categories (구분) from the admin panel instead of using hardcoded values.

**Architecture:** Add a `categories` table in Supabase. Admin page lists/adds/deletes entries. TaskForm fetches categories from DB at mount. AI prompt derives category list dynamically from task data.

**Tech Stack:** Next.js App Router, Supabase (RLS), TypeScript

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260727_add_categories.sql`

- [x] Create categories table with id, name (unique), sort_order, created_at
- [x] Insert initial data: Biz사업, 내부개선, 상품, 기타
- [x] Enable RLS: authenticated read, admin-only write (via is_admin())
- [x] Run SQL in Supabase dashboard

### Task 2: Type update

**Files:**
- Modify: `types/index.ts`

- [x] Change `Category` from union type to `string`

### Task 3: AI prompt update

**Files:**
- Modify: `lib/ai.ts`

- [x] Replace hardcoded category list in prompt with dynamic extraction from usersData

### Task 4: TaskForm update

**Files:**
- Modify: `components/tasks/TaskForm.tsx`

- [x] Import useEffect and createClient (browser)
- [x] Add categories state, fetch from `categories` table on mount
- [x] Remove hardcoded CATEGORIES array
- [x] Default category: first from DB (set after load), or existing initialData value

### Task 5: Category API routes

**Files:**
- Create: `app/api/admin/categories/route.ts` (GET, POST)
- Create: `app/api/admin/categories/[id]/route.ts` (DELETE)

- [x] GET: return all categories ordered by sort_order (authenticated)
- [x] POST: create new category (admin only, 23505 duplicate guard)
- [x] DELETE: remove by id (admin only)

### Task 6: Admin categories page

**Files:**
- Create: `app/(admin)/admin/categories/page.tsx`

- [x] List all categories with delete button per row
- [x] Confirm dialog on delete with note that existing task data is unaffected
- [x] Add form: text input + submit button
- [x] Error display for duplicate / server errors

### Task 7: Admin nav link

**Files:**
- Modify: `app/(admin)/layout.tsx`

- [x] Add "구분 관리" NavLink → `/admin/categories`

### Task 8: Deploy

- [x] Commit on branch feat/category-management
- [x] Push, create PR, squash merge to main
- [x] Verify Vercel deployment success
