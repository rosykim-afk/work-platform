import { Status, Priority, ProjectStatus, BoostingStatus } from "@/types";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "진행 중",
  completed: "완료",
  on_hold: "보류",
  cancelled: "취소",
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

export const TASK_STATUS_LABEL: Record<Status, string> = {
  todo: "할 일",
  in_progress: "진행 중",
  done: "완료",
  cancelled: "취소",
};

export const TASK_STATUS_COLOR: Record<Status, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: "text-slate-400",
  medium: "text-yellow-500",
  high: "text-red-500",
};

export const BOOSTING_STATUS_LABEL: Record<BoostingStatus, string> = {
  planned: "예정",
  active: "진행 중",
  completed: "완료",
  cancelled: "취소",
};

export const BOOSTING_STATUS_COLOR: Record<BoostingStatus, string> = {
  planned: "bg-purple-100 text-purple-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// ─── 노출지면 색상 (전 화면 공통) ──────────────────────────────────────────
// 캘린더·타임라인·사이드리스트·프로젝트 상세 등 모든 부스팅 표시에서 동일하게 사용
export const SITE_COLORS: Record<string, string> = {
  "메인 홈":   "#F5A524",
  "추천 영역": "#17C964",
  "검색 결과": "#F31260",
  "기획전":    "#7828C8",
  "팝업":      "#0072F5",
  "기타":      "#889096",
};

export const SITE_COLOR_FALLBACK = "#889096";

export function siteColor(site: string): string {
  return SITE_COLORS[site] ?? SITE_COLOR_FALLBACK;
}
