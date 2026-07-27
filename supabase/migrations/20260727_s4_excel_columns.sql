-- excel_columns: 관리자별 Excel 컬럼 설정 테이블
CREATE TABLE excel_columns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  column_key text NOT NULL,
  label text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  sort_order int NOT NULL,
  UNIQUE(manager_id, column_key)
);

ALTER TABLE excel_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own excel columns"
  ON excel_columns FOR ALL TO authenticated
  USING (manager_id = auth.uid());
