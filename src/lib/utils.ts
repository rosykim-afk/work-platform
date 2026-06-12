import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 날짜 구간을 "MM-DD ~ MM-DD" 형태로 표시.
 * - 시작일 == 종료일(당일)이면 "~" 없이 "MM-DD" 한 번만 표기
 * - 시간이 있으면 날짜 뒤에 붙여 표기 (당일이면 "MM-DD HH:MM ~ HH:MM")
 * 일정은 선택 사항이라 비어 있을 수 있으므로 안전하게 처리한다.
 */
export function formatDateRange(
  start?: string,
  end?: string,
  startTime?: string,
  endTime?: string,
): string {
  const s = start ? start.slice(5) : ""
  const e = end ? end.slice(5) : ""
  const st = startTime ?? ""
  const et = endTime ?? ""
  // 당일 일정
  if (start && end && start === end) {
    if (st && et) return `${s} ${st} ~ ${et}`
    if (st) return `${s} ${st}`
    return s
  }
  const sPart = s ? `${s}${st ? ` ${st}` : ""}` : ""
  const ePart = e ? `${e}${et ? ` ${et}` : ""}` : ""
  if (sPart && ePart) return `${sPart} ~ ${ePart}`
  if (sPart) return `${sPart} ~`
  if (ePart) return `~ ${ePart}`
  return "일정 미정"
}
