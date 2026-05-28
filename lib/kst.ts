/**
 * KST(한국시간) 변환 유틸리티
 * ⚠️ 모든 파일에서 이 함수만 사용할 것 — 파일마다 직접 변환 금지
 */

/**
 * Supabase 반환 타임스탬프 → 안전한 UTC Date 객체
 * PostgreSQL 형식("2026-05-31 00:00:00+00") 및 ISO 형식 모두 처리
 */
function parseSupabaseTime(slotTime: string): Date {
  // PostgreSQL 형식: 공백을 T로 교체 → ISO 8601로 변환
  const normalized = slotTime.replace(' ', 'T');
  return new Date(normalized);
}

/**
 * UTC timestamptz 문자열을 KST 날짜/시간으로 분해
 * @returns { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
export function toKST(slotTime: string): { date: string; time: string } {
  const d = parseSupabaseTime(slotTime);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return {
    date: kst.toISOString().slice(0, 10),  // 'YYYY-MM-DD'
    time: kst.toISOString().slice(11, 16), // 'HH:MM'
  };
}

/**
 * UTC timestamptz → "M/D HH:MM" 형식 KST 표시
 * 예: "2026-05-28T01:00:00Z" → "5/28 10:00"
 */
export function formatKST(slotTime: string): string {
  const { date, time } = toKST(slotTime);
  const [, month, day] = date.split('-');
  return `${parseInt(month)}/${parseInt(day)} ${time}`;
}

/**
 * KST 날짜+시간 → UTC ISO 문자열
 * 저장된 슬롯과 직접 비교할 때 사용 (가장 정확한 방법)
 * 예: ('2026-05-31', '09:00') → '2026-05-31T00:00:00.000Z'
 */
export function kstToUTC(dateStr: string, time: string): string {
  return new Date(`${dateStr}T${time}:00+09:00`).toISOString();
}

/**
 * 저장된 슬롯이 특정 KST 날짜+시간과 같은지 확인 (UTC 직접 비교)
 * isAlreadySaved 대신 이 함수 사용 → Supabase 반환 형식에 무관하게 정확
 */
export function slotMatchesKST(slotTime: string, dateStr: string, time: string): boolean {
  const slotUTC = parseSupabaseTime(slotTime).toISOString();
  const targetUTC = kstToUTC(dateStr, time);
  return slotUTC === targetUTC;
}
