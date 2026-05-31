-- =============================================
-- 콘텐츠 관리 테이블 (reviews, success_stories, columns, seminars)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 학부모 후기
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author       text NOT NULL,
  content      text NOT NULL,
  category     text,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "authenticated can manage reviews" ON reviews FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 합격 사례
CREATE TABLE IF NOT EXISTS success_stories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_label text NOT NULL,
  subject       text,
  school_before text,
  school_after  text,
  content       text,
  result        text,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read success_stories" ON success_stories FOR SELECT USING (true);
CREATE POLICY "authenticated can manage success_stories" ON success_stories FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 입시 칼럼
CREATE TABLE IF NOT EXISTS columns (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  category     text,
  summary      text,
  content      text,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read columns" ON columns FOR SELECT USING (true);
CREATE POLICY "authenticated can manage columns" ON columns FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 설명회
CREATE TABLE IF NOT EXISTS seminars (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  scheduled_at     timestamptz,
  location         text,
  max_participants integer,
  is_published     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read seminars" ON seminars FOR SELECT USING (true);
CREATE POLICY "authenticated can manage seminars" ON seminars FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 설명회 신청
CREATE TABLE IF NOT EXISTS seminar_applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id     uuid NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  phone          text,
  school         text,
  grade          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seminar_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can insert seminar_applications" ON seminar_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "authenticated can manage seminar_applications" ON seminar_applications FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 학교별 콘텐츠
CREATE TABLE IF NOT EXISTS school_contents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_slug       text NOT NULL UNIQUE,
  school_name       text,
  characteristics   text,
  difficulty        text,
  math_tendency     text,
  science_tendency  text,
  entrance          text,
  strategy          text,
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE school_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read school_contents" ON school_contents FOR SELECT USING (true);
CREATE POLICY "authenticated can manage school_contents" ON school_contents FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
