// ─── 폴더 (Folder) ───────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// ─── 공통 ───────────────────────────────────────────────────────────────────

export type Status = "todo" | "in_progress" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high";

// ─── 업무 (Task) ─────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  body: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  dueDate?: string;
  notes?: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: Status;        // 선택 (미입력 시 "todo" 로 표기)
  priority?: Priority;    // 선택 (미입력 시 표기 안 함)
  startDate?: string;     // 시작일 (선택) — 있으면 startDate~dueDate 기간 업무
  dueDate?: string;       // ISO date string (YYYY-MM-DD)
  dueTime?: string;       // HH:MM (선택)
  projectId?: string;
  routineId?: string;     // 루틴에서 생성된 경우
  checklist?: ChecklistItem[];
  notes?: string;
  comments?: TaskComment[];
  subtasks?: SubTask[];
  createdAt: string;
  updatedAt: string;
}

// ─── 프로젝트 (Project) ──────────────────────────────────────────────────────

export type ProjectStatus = "active" | "completed" | "on_hold" | "cancelled";

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  color: string;          // 캘린더 표시용 색상 (hex)
  taskIds: string[];
  folderId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── 부스팅 (Boosting) ───────────────────────────────────────────────────────

export type BoostingStatus = "planned" | "active" | "completed" | "cancelled";

export interface Boosting {
  id: string;
  title: string;
  exposureSite: string;   // 노출지면 (메인 홈, 추천 영역 등)
  startDate: string;
  endDate: string;
  startTime?: string;     // HH:MM (선택)
  endTime?: string;       // HH:MM (선택)
  status: BoostingStatus;
  taskId?: string;        // 연결된 업무 (업무 하위 부스팅)
  projectId?: string;     // 연결된 프로젝트 (taskId로부터 자동 파생 또는 직접 지정)
  budget?: number;        // 예산
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── 루틴 (Routine) ──────────────────────────────────────────────────────────

export type Frequency = "daily" | "weekly" | "monthly";
export type MonthlyType = "date" | "lastDay" | "workday";

export interface Routine {
  id: string;
  title: string;
  frequency: Frequency;
  daysOfWeek?: number[];  // 0=일, 1=월, ..., 6=토 (weekly용)
  dayOfMonth?: number;    // 1-31 (monthly/date용)
  monthlyType?: MonthlyType; // monthly 기준: 특정일 | 말일 | 영업일
  workdayIndex?: number;     // 영업일 기준: 몇 번째 영업일 (1~22)
  time?: string;          // "HH:MM" (선택) — 루틴 실행 시간
  endDate?: string;       // 종료일 (선택) — YYYY-MM-DD, 이 날까지 반복
  isActive: boolean;
  lastCompletedAt?: string;
  completionHistory?: string[]; // YYYY-MM-DD 배열
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── 회의/미팅 (Meeting) ─────────────────────────────────────────────────────

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime?: string;     // "HH:MM" (선택)
  endTime?: string;
  location?: string;
  attendees: string[];
  notes?: string;         // 회의록
  projectId?: string;
  routineId?: string;     // 연결된 루틴 ID (정기 회의 시리즈)
  createdAt: string;
  updatedAt: string;
}

// ─── 캘린더 이벤트 (통합 뷰용) ──────────────────────────────────────────────

export type CalendarEventType = "task" | "boosting" | "meeting" | "routine";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  endDate?: string;
  color: string;
  sourceId: string;       // 원본 데이터 id
}
