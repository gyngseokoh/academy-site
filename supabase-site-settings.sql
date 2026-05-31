-- site_settings 테이블 (학원 소개 페이지 관리용)
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read site_settings"
  ON site_settings FOR SELECT USING (true);

CREATE POLICY "authenticated can manage site_settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 기본값 삽입
INSERT INTO site_settings (key, value) VALUES
  ('about_hero_desc',       '단순한 수업이 아닙니다. 학교별 내신 분석부터 입시 전략, 월간 리포트까지—학생 한 명 한 명의 성장을 책임지는 교육을 실천합니다.'),
  ('about_philosophy_1_title', '개념 중심'),
  ('about_philosophy_1_desc',  '암기보다 이해를 먼저. 개념이 탄탄해야 어떤 문제도 풀 수 있습니다.'),
  ('about_philosophy_2_title', '데이터 기반'),
  ('about_philosophy_2_desc',  '출결, 테스트, 과제 데이터를 분석해 학생별 취약점을 정확히 파악합니다.'),
  ('about_philosophy_3_title', '소통과 신뢰'),
  ('about_philosophy_3_desc',  '선생님·학생·학부모 삼자가 함께 소통하며 목표를 향해 나아갑니다.'),
  ('contact_address',          '서울시 영등포구 당산동'),
  ('contact_phone',            '010-5606-3041'),
  ('contact_hours_weekday',    '평일 14:00 ~ 22:00'),
  ('contact_hours_saturday',   '토요일 10:00 ~ 18:00')
ON CONFLICT (key) DO NOTHING;
