"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Project, Task, Boosting, SubTask } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { useProjectStore } from "@/store/projects";
import { useBoostingStore } from "@/store/boosting";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskForm } from "@/components/tasks/task-form";
import { ProjectForm } from "./project-form";
import { BoostingDetailModal } from "@/components/boosting/boosting-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Zap, X, Check } from "lucide-react";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, BOOSTING_STATUS_COLOR, BOOSTING_STATUS_LABEL, siteColor } from "@/lib/constants";
import { cn, formatDateRange } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  project: Project;
  onDeleted: () => void;
}

// 공통 서브 행 레이아웃 래퍼
function SubRowWrap({ children, onClick, groupClass = "group/sub" }: {
  children: React.ReactNode; onClick?: () => void; groupClass?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0 pl-4", groupClass)} onClick={onClick}>
      {/* 꺽쇠 연결선 */}
      <div className="flex items-end shrink-0 self-stretch pb-[9px] pr-1">
        <div className="w-3 h-3 border-b border-l border-dashed border-muted-foreground/25 rounded-bl-sm" />
      </div>
      {children}
    </div>
  );
}

/** 업무 하위 부스팅 서브 행 */
function BoostingSubRow({ boosting }: { boosting: Boosting }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const color = siteColor(boosting.exposureSite);

  return (
    <>
      <SubRowWrap groupClass="group/boosting cursor-pointer hover:bg-accent/30 rounded transition-colors pr-2 py-0" onClick={() => setDetailOpen(true)}>
        <div className="flex items-center gap-2 flex-1 min-w-0 py-1.5">
          {/* 지면명 박스 */}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0"
            style={{ color, backgroundColor: color + "18", borderColor: color + "50" }}
          >
            {boosting.exposureSite}
          </span>
          {/* 일정 — 당일이면 "MM-DD" 한 번만, 시간 있으면 같이 표기 */}
          {(boosting.startDate || boosting.endDate) && (
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {formatDateRange(boosting.startDate, boosting.endDate, boosting.startTime, boosting.endTime)}
            </span>
          )}
          {/* 상태 */}
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 opacity-0 group-hover/boosting:opacity-100 transition-opacity",
              BOOSTING_STATUS_COLOR[boosting.status]
            )}
          >
            {BOOSTING_STATUS_LABEL[boosting.status]}
          </span>
        </div>
      </SubRowWrap>

      <BoostingDetailModal
        boosting={boosting}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}

/** 세부업무 인라인 행 */
function SubTaskRow({ taskId, sub }: { taskId: string; sub: SubTask }) {
  const { updateSubTask, deleteSubTask } = useTaskStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(sub.title);
  const [dueDate, setDueDate] = useState(sub.dueDate ?? "");
  const [notes, setNotes] = useState(sub.notes ?? "");

  function commit() {
    if (title.trim()) updateSubTask(taskId, sub.id, { title: title.trim(), dueDate: dueDate || undefined, notes: notes || undefined });
    setEditing(false);
  }

  if (editing) {
    return (
      <SubRowWrap groupClass="group/sub pr-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 py-1.5">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setTitle(sub.title); setEditing(false); }
            }}
            className="flex-1 min-w-0 text-xs border-b border-primary bg-transparent outline-none py-0.5"
            placeholder="세부업무 제목"
          />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="text-[10px] border-b border-border bg-transparent outline-none py-0.5 text-muted-foreground w-24 shrink-0"
          />
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") commit(); }}
            className="w-24 text-[10px] border-b border-border bg-transparent outline-none py-0.5 text-muted-foreground shrink-0"
            placeholder="내용"
          />
          <button type="button" onClick={commit}
            className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">저장</button>
        </div>
      </SubRowWrap>
    );
  }

  return (
    <SubRowWrap
      groupClass="group/sub cursor-pointer hover:bg-accent/30 rounded transition-colors pr-2 py-0"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 py-1.5">
        {/* 완료 체크 */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); updateSubTask(taskId, sub.id, { done: !sub.done }); }}
          className={cn(
            "size-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
            sub.done ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {sub.done && <Check className="size-2.5 text-primary-foreground" />}
        </button>
        {/* 제목 — 내용 폭만큼만 차지 (공간 부족 시 말줄임) */}
        <span className={cn("text-[11px] truncate min-w-0", sub.done && "line-through text-muted-foreground")}>
          {sub.title}
        </span>
        {/* 일정 — 제목 바로 오른쪽 */}
        {sub.dueDate && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{sub.dueDate.slice(5)}</span>
        )}
        {/* 내용 힌트 — 날짜 오른쪽, 남은 공간 차지 (없어도 spacer 역할) */}
        <span className="text-[10px] text-muted-foreground/60 truncate flex-1 min-w-0">{sub.notes}</span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); deleteSubTask(taskId, sub.id); }}
          className="opacity-0 group-hover/sub:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 shrink-0"
        >
          <X className="size-3 text-red-400" />
        </button>
      </div>
    </SubRowWrap>
  );
}

/** 세부업무 인라인 추가 행 */
function AddSubTaskRow({ taskId }: { taskId: string }) {
  const { addSubTask } = useTaskStore();
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    if (title.trim()) addSubTask(taskId, { title: title.trim(), dueDate: dueDate || undefined, notes: notes || undefined, done: false });
    setTitle(""); setDueDate(""); setNotes(""); setActive(false);
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 20); }}
        className="flex items-center gap-1.5 pl-8 pr-3 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-accent/20 w-full text-left"
      >
        <Plus className="size-3" /> 세부업무 추가
      </button>
    );
  }

  return (
    <SubRowWrap groupClass="pr-2">
      <div className="flex items-center gap-1.5 flex-1 min-w-0 py-1.5">
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setTitle(""); setActive(false); }
          }}
          className="flex-1 min-w-0 text-xs border-b border-primary bg-transparent outline-none py-0.5"
          placeholder="세부업무 제목 입력..."
        />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="text-[10px] border-b border-border bg-transparent outline-none py-0.5 text-muted-foreground w-24 shrink-0" />
        <input value={notes} onChange={e => setNotes(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") commit(); }}
          className="w-24 text-[10px] border-b border-border bg-transparent outline-none py-0.5 text-muted-foreground shrink-0"
          placeholder="내용" />
        <button type="button" onClick={commit}
          className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">추가</button>
        <button type="button" onClick={() => { setTitle(""); setActive(false); }}
          className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="size-3" />
        </button>
      </div>
    </SubRowWrap>
  );
}

/** 업무 + 하위 부스팅 + 세부업무 묶음 */
function TaskWithBoostings({ task, boostings }: { task: Task; boostings: Boosting[] }) {
  const linked = boostings.filter(b => b.taskId === task.id);
  const subtasks = task.subtasks ?? [];

  return (
    <div className="rounded-md overflow-hidden">
      <TaskItem task={task} />
      {(linked.length > 0 || subtasks.length > 0) && (
        <div className="mt-0.5 border-l-2 border-dashed border-muted-foreground/20 ml-3">
          {linked.map(b => (
            <BoostingSubRow key={b.id} boosting={b} />
          ))}
          {subtasks.map(s => (
            <SubTaskRow key={s.id} taskId={task.id} sub={s} />
          ))}
        </div>
      )}
      <AddSubTaskRow taskId={task.id} />
    </div>
  );
}

export function ProjectDetail({ project, onDeleted }: Props) {
  const { tasks } = useTaskStore();
  const { boostings } = useBoostingStore();
  const { deleteProject, setStatus } = useProjectStore();
  const [addingTask, setAddingTask] = useState(false);
  const [editing, setEditing] = useState(false);

  const projectTasks    = tasks.filter((t) => t.projectId === project.id);
  const projectBoostings = boostings.filter(b => b.projectId === project.id);
  const activeTasks     = projectTasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const doneTasks       = projectTasks.filter((t) => t.status === "done");
  const doneRatio       = projectTasks.length > 0
    ? Math.round((doneTasks.length / projectTasks.length) * 100)
    : 0;

  function handleDelete() {
    deleteProject(project.id);
    onDeleted();
    toast.error(`"${project.title}" 프로젝트가 삭제됐어요`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-4 rounded-full mt-1 shrink-0" style={{ backgroundColor: project.color }} />
            <div>
              <h2 className="text-lg font-semibold leading-tight">{project.title}</h2>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={cn("text-xs", PROJECT_STATUS_COLOR[project.status])}>
                  {PROJECT_STATUS_LABEL[project.status]}
                </Badge>
                {project.startDate && (
                  <span className="text-xs text-muted-foreground">
                    {project.startDate}{project.endDate ? ` ~ ${project.endDate}` : ""}
                  </span>
                )}
                {projectBoostings.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="size-3" />
                    부스팅 {projectBoostings.length}개
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 shrink-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="size-4 mr-2" /> 수정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setStatus(project.id, "completed"); toast.success("완료 처리됐어요"); }}>
                → 완료 처리
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setStatus(project.id, "on_hold"); toast.info("보류 처리됐어요"); }}>
                → 보류 처리
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="size-4 mr-2" /> 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 진행률 */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>업무 달성률</span>
            <span>{doneTasks.length}/{projectTasks.length} 완료 ({doneRatio}%)</span>
          </div>
          <Progress value={doneRatio} className="h-1.5" style={{ "--color": project.color } as React.CSSProperties} />
        </div>
      </div>

      {/* 업무 목록 */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">진행 업무 ({activeTasks.length})</span>
            <Button size="sm" variant="outline" onClick={() => setAddingTask(true)}>
              <Plus className="size-3.5 mr-1" /> 업무 추가
            </Button>
          </div>

          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">업무가 없어요</p>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((t) => (
                <TaskWithBoostings key={t.id} task={t} boostings={projectBoostings} />
              ))}
            </div>
          )}

          {doneTasks.length > 0 && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">완료 ({doneTasks.length})</p>
              <div className="space-y-2">
                {doneTasks.map((t) => (
                  <TaskWithBoostings key={t.id} task={t} boostings={projectBoostings} />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <TaskForm open={addingTask} onClose={() => setAddingTask(false)} defaultProjectId={project.id} />
      <ProjectForm open={editing} onClose={() => setEditing(false)} project={project} />
    </div>
  );
}
