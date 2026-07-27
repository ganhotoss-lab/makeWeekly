-- categories: 업무 구분 관리 테이블
CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 기존 4가지 구분값 초기 데이터
INSERT INTO categories (name, sort_order) VALUES
  ('Biz사업', 1),
  ('내부개선', 2),
  ('상품', 3),
  ('기타', 4);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL TO authenticated USING (is_admin());
