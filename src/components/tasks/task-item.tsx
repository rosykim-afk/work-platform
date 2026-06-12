"use client";

import { useState } from "react";
import { Task, Status } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { useUndoStore } from "@/store/undo";
import { TaskForm } from "./task-form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR, PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/constants";
import { TaskDetailModal } from "./task-detail-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function TaskItem({ task, isSelected, onToggleSelect, selectionMode }: Props) {
  const { setStatus, deleteTask, restoreTask } = useTaskStore();
  const { push: pushUndo } = useUndoStore();
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const isDone = task.status === "done";

  function handleCheck(checked: boolean) {
    const prev = task.status ?? "todo";
    setStatus(task.id, checked ? "done" : "todo");
    if (checked) {
      pushUndo({ label: `"${task.title}" 완료 취소`, undo: () => setStatus(task.id, prev) });
      toast.success("완료했어요 🎉", { description: "⌘Z로 되돌리기" });
    }
  }

  function handleDelete() {
    const snapshot = { ...task };
    deleteTask(task.id);
    pushUndo({ label: `"${task.title}" 삭제 취소`, undo: () => restoreTask(snapshot) });
    toast.error("삭제됐어요", { description: "⌘Z로 되돌리기" });
  }

  const isOverdue =
    task.dueDate &&
    task.dueDate < new Date().toISOString().slice(0, 10) &&
    !isDone &&
    task.status !== "cancelled" &&
    task.status !== undefined;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 hover:bg-accent/40 transition-colors group",
          isSelected && "bg-accent/60 border-accent-foreground/20",
          isDone && "opacity-60"
        )}
      >
        {/* 선택 체크박스 — 상시 노출 */}
        <input
          type="checkbox"
          checked={isSelected ?? false}
          onChange={() => onToggleSelect?.(task.id)}
          onClick={e => e.stopPropagation()}
          className="size-4 rounded cursor-pointer accent-primary shrink-0"
        />

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium leading-snug cursor-pointer hover:underline underline-offset-2",
              isDone && "line-through text-muted-foreground"
            )}
            onClick={() => !selectionMode && setDetailOpen(true)}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.status && (
              <Badge variant="secondary" className={cn("text-xs px-1.5 py-0", TASK_STATUS_COLOR[task.status])}>
                {TASK_STATUS_LABEL[task.status]}
              </Badge>
            )}
            {task.priority && (
              <span className={cn("text-xs font-medium", PRIORITY_COLOR[task.priority])}>
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
            {task.dueDate && (
              <span className={cn("text-xs", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                {isOverdue ? "⚠ " : ""}{task.startDate ? `${task.startDate} ~ ` : ""}{task.dueDate}
              </span>
            )}
          </div>
        </div>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 인라인 수정/삭제 버튼 — hover 시 */}
          {!selectionMode && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost" size="icon-xs"
                onClick={e => { e.stopPropagation(); setEditing(true); }}
                title="수정"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon-xs"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={e => { e.stopPropagation(); handleDelete(); }}
                title="삭제"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}

          {/* 완료 체크박스 — 우측, 선택 모드 아닐 때만 */}
          {!selectionMode && (
            <Checkbox
              checked={isDone}
              onCheckedChange={handleCheck}
              title={isDone ? "완료 취소" : "완료 처리"}
            />
          )}
        </div>
      </div>

      <TaskForm open={editing} onClose={() => setEditing(false)} task={task} />
      <TaskDetailModal task={task} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
