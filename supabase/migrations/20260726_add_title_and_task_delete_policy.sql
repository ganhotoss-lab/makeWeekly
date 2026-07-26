-- tasks 테이블에 title 컬럼 추가 (nullable, 기존 데이터 호환)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title text;

-- tasks 테이블에 DELETE RLS 정책 추가
-- (weekly_entries와 동일하게 본인 데이터만 삭제 가능)
CREATE POLICY "Users can delete own tasks"
ON public.tasks
FOR DELETE
USING (auth.uid() = user_id);
