-- weekly_entries 테이블에 DELETE RLS 정책 추가
-- 기존 정책이 SELECT/INSERT/UPDATE만 있고 DELETE가 누락되어 있어
-- 클라이언트에서 삭제 시 에러 없이 0행 삭제(무음 실패)가 발생함

CREATE POLICY "Users can delete own weekly entries"
ON public.weekly_entries
FOR DELETE
USING (auth.uid() = user_id);
