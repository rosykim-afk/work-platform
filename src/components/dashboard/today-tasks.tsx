"use client";

import { useState } from "react";
import Link from "next/link";
import { Task } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { useProjectStore } from "@/store/projects";
import { useUndoStore } from "@/store/undo";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, ChevronRight } from "lucide-react";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function TaskRow({ task, overdue, onOpen }: { task: Task; overdue?: boolean; onOpen: (t: Task) => void }) {
  const { setStatus } = useTaskStore();
  const { projects } = useProjectStore();
  const { push: pushUndo } = useUndoStore();

  const isDone = task.status === "done";
  const project = projects.find(p => p.id === task.projectId);

  function handleCheck(checked: boolean) {
    const prev = task.status ?? "todo";
    setStatus(task.id, checked ? "done" : "todo");
    if (checked) {
      pushUndo({ label: `"${task.title}" 완료 취소`, undo: () => setStatus(task.id, prev) });
      toast.success("완료했어요 🎉", { description: "⌘Z로 되돌리기" });
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent/40",
        isDone && "opacity-60",
        overdue && !isDone && "border-red-200 bg-red-50/40"
      )}
    >
      <Checkbox checked={isDone} onCheckedChange={v => handleCheck(!!v)} />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(task)}>
        <p className={cn("text-sm font-medium leading-snug", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs">
          {overdue && !isDone && task.dueDate && (
            <span className="text-red-500 font-medium">⚠ {task.dueDate.slice(5).replace("-", "/")} 마감</span>
          )}
          {task.dueTime && <span className="text-muted-foreground">{task.dueTime}</span>}
          {task.priority && (
            <span className={cn("font-medium", PRIORITY_COLOR[task.priority])}>{PRIORITY_LABEL[task.priority]}</span>
          )}
          {project && (
            <span className="flex items-center gap-1 text-muted-foreground truncate">
              <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
              {project.title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TodayTasks() {
  const { getDueToday, getOverdue } = useTaskStore();
  const [selected, setSelected] = useState<Task | null>(null);

  const overdue = getOverdue();
  // 미완료 먼저, 완료는 아래로
  const dueToday = [...getDueToday()].sort((a, b) =>
    Number(a.status === "done") - Number(b.status === "done")
  );

  const remaining = dueToday.filter(t => t.status !== "done").length + overdue.length;
  const isEmpty = overdue.length === 0 && dueToday.length === 0;

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">오늘 할 일</span>
            {remaining > 0 && <span className="text-xs text-muted-foreground">{remaining}개 남음</span>}
          </div>
          <Link href="/projects" className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            전체 보기 <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="p-3 space-y-2">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground text-center py-6">오늘 마감인 업무가 없어요</p>
          ) : (
            <>
              {overdue.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">마감 지남 {overdue.length}</p>
                  {overdue.map(t => <TaskRow key={t.id} task={t} overdue onOpen={setSelected} />)}
                </div>
              )}
              {dueToday.length > 0 && (
                <div className="space-y-2">
                  {overdue.length > 0 && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3">오늘 마감</p>
                  )}
                  {dueToday.map(t => <TaskRow key={t.id} task={t} onOpen={setSelected} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <TaskDetailModal task={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
