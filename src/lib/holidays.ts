/**
 * 대한민국 공휴일 데이터 (2024–2027)
 * 음력 기반 공휴일(설날·추석·부처님오신날)은 연도별 양력 환산 날짜를 직접 기입.
 * 대체공휴일(일요일 겹침)도 포함.
 */

// MM-DD → 공휴일명 (매년 고정 양력 공휴일)
const FIXED: Record<string, string> = {
  "01-01": "신정",
  "03-01": "삼일절",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "성탄절",
};

// YYYY-MM-DD → 공휴일명 (음력 기반 + 대체공휴일)
const DATED: Record<string, string> = {
  // 2024
  "2024-02-09": "설날 전날",
  "2024-02-10": "설날",
  "2024-02-11": "설날 다음날",
  "2024-02-12": "대체공휴일",
  "2024-05-06": "대체공휴일",    // 어린이날 일요일
  "2024-05-15": "부처님오신날",
  "2024-09-16": "추석 전날",
  "2024-09-17": "추석",
  "2024-09-18": "추석 다음날",

  // 2025
  "2025-01-28": "설날 전날",
  "2025-01-29": "설날",
  "2025-01-30": "설날 다음날",
  "2025-03-03": "대체공휴일",    // 삼일절 토요일
  "2025-05-05": "어린이날·부처님오신날",
  "2025-10-05": "추석 전날",
  "2025-10-06": "추석",
  "2025-10-07": "추석 다음날",
  "2025-10-08": "대체공휴일",    // 추석 전날 일요일

  // 2026
  "2026-02-16": "설날 전날",
  "2026-02-17": "설날",
  "2026-02-18": "설날 다음날",
  "2026-03-02": "대체공휴일",    // 삼일절 일요일
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",    // 부처님오신날 일요일
  "2026-09-24": "추석 전날",
  "2026-09-25": "추석",
  "2026-09-26": "추석 다음날",
  "2026-09-28": "대체공휴일",    // 추석 다음날 토요일

  // 2027
  "2027-02-06": "설날 전날",
  "2027-02-07": "설날",
  "2027-02-08": "설날 다음날",
  "2027-05-13": "부처님오신날",
  "2027-09-14": "추석 전날",
  "2027-09-15": "추석",
  "2027-09-16": "추석 다음날",
};

/**
 * 주어진 날짜(YYYY-MM-DD)의 공휴일명을 반환. 공휴일이 아니면 undefined.
 * 날짜별 항목(설날·추석 등)이 고정 항목(어린이날 등)보다 우선.
 */
export function getHoliday(dateStr: string): string | undefined {
  if (DATED[dateStr]) return DATED[dateStr];
  return FIXED[dateStr.slice(5)];
}

/**
 * 해당 날짜가 공휴일(법정 휴일)인지 여부.
 * 토요일·일요일은 포함하지 않음 (영업일 계산용으로 별도 판단할 것).
 */
export function isPublicHoliday(dateStr: string): boolean {
  return !!getHoliday(dateStr);
}

/**
 * 특정 연월의 n번째 영업일(월~금 & 공휴일 제외)에 해당하는 날짜(YYYY-MM-DD) 반환.
 * 해당 월의 영업일이 n보다 적으면 마지막 영업일을 반환.
 */
export function getNthWorkday(year: number, month: number, n: number): string {
  const pad = (v: number) => String(v).padStart(2, "0");
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    const dow = new Date(dateStr).getDay(); // 0=일, 6=토
    if (dow === 0 || dow === 6) continue;
    if (isPublicHoliday(dateStr)) continue;
    count++;
    if (count === n) return dateStr;
  }
  // n보다 영업일이 적으면 마지막 영업일 반환
  let last = `${year}-${pad(month)}-01`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    const dow = new Date(dateStr).getDay();
    if (dow === 0 || dow === 6) continue;
    if (isPublicHoliday(dateStr)) continue;
    last = dateStr;
  }
  return last;
}
