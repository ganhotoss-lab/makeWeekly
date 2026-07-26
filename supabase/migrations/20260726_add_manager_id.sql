-- 관리자별 파트원 구성: manager_id 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.users(id);
