-- user_summaries: 사용자별 AI 요약 저장 테이블
CREATE TABLE user_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  summary_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE user_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own summaries"
  ON user_summaries FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all summaries"
  ON user_summaries FOR ALL TO authenticated
  USING (is_admin());
