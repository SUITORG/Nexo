-- 007_feedback_widget.sql
-- Widget de feedback de usuarios

CREATE TABLE IF NOT EXISTS sh_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  screen TEXT DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sh_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_own"
  ON sh_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "feedback_read_own"
  ON sh_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "feedback_admin_all"
  ON sh_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sh_technicians t
      WHERE t.email = (auth.jwt() ->> 'email') AND t.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_sh_feedback_created ON sh_feedback(created_at DESC);
