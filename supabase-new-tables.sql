-- =============================================
-- 학생 관리 + 학생 일지 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. students 테이블
CREATE TABLE IF NOT EXISTS students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  school      text,
  grade       text,
  phone       text,
  parent_name text,
  teacher_id  uuid REFERENCES teachers(id) ON DELETE SET NULL,
  subjects    text,
  memo        text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- students RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- anon: 읽기만 허용 (선생님 페이지에서 참조)
CREATE POLICY "anon can read students"
  ON students FOR SELECT USING (true);

-- authenticated: 전체 CRUD
CREATE POLICY "authenticated can manage students"
  ON students FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 2. student_logs 테이블
CREATE TABLE IF NOT EXISTS student_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id  uuid REFERENCES teachers(id) ON DELETE SET NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- student_logs RLS
ALTER TABLE student_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read student_logs"
  ON student_logs FOR SELECT USING (true);

CREATE POLICY "authenticated can manage student_logs"
  ON student_logs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 3. current_student_consultations에 status 컬럼 없으면 추가
--    (이미 있으면 오류 발생 → 무시해도 됨)
ALTER TABLE current_student_consultations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT '대기';

-- current_student_consultations RLS (authenticated도 읽을 수 있도록)
-- 아래는 기존 정책 이름과 겹치면 오류 날 수 있음 → 오류 시 무시하세요
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'current_student_consultations'
      AND policyname = 'authenticated can manage current consultations'
  ) THEN
    EXECUTE '
      CREATE POLICY "authenticated can manage current consultations"
        ON current_student_consultations FOR ALL
        USING (auth.role() = ''authenticated'')
        WITH CHECK (auth.role() = ''authenticated'')
    ';
  END IF;
END $$;
