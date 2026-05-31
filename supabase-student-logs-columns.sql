-- =============================================
-- ⚠️ 실행 불필요 (참고/검증용)
-- 라이브 DB 확인 결과 student_logs 테이블은 이미 아래 컬럼을 갖고 있습니다:
--   id, student_id, log_date, content, progress, notes, created_at
-- → progress / notes 컬럼이 이미 존재하므로 추가 마이그레이션이 필요 없습니다.
-- → 날짜 컬럼명은 date 가 아니라 log_date 이며, teacher_id 컬럼은 없습니다.
--   (코드는 이 실제 스키마에 맞게 수정되었습니다.)
--
-- 아래는 상태 확인용 조회 쿼리입니다. 실행해도 데이터에 영향이 없습니다.
-- =============================================

-- 1) 현재 컬럼 확인
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'student_logs'
order by ordinal_position;

-- 2) 최근 일지 확인 (진도/메모 분리 저장 여부)
select log_date, content, progress, notes, created_at
from student_logs
order by created_at desc
limit 10;
