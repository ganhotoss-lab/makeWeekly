-- groups: 팀/부서 그룹 테이블
CREATE TABLE groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- group_members: 그룹 구성원 테이블
CREATE TABLE group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own groups"
  ON groups FOR ALL TO authenticated
  USING (manager_id = auth.uid());

CREATE POLICY "Admins manage own group members"
  ON group_members FOR ALL TO authenticated
  USING (
    group_id IN (SELECT id FROM groups WHERE manager_id = auth.uid())
  );
