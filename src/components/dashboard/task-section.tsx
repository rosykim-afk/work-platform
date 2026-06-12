"use client";

import { Task } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { TaskItem } from "@/components/tasks/task-item";
import { SelectionBar } from "@/components/ui/selection-bar";
import { useSelection } from "@/hooks/use-selection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  title: string;
  tasks: Task[];
  emptyText?: string;
  accent?: "default" | "red" | "blue";
}

const ACCENT_MAP = {
  default: "bg-muted/50 text-muted-foreground",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

export function TaskSection({ title, tasks, emptyText = "없어요", accent = "default" }: Props) {
  const { deleteTask } = useTaskStore();
  const ids = tasks.map(t => t.id);
  const sel = useSelection(ids);

  function handleDelete() {
    sel.selected.forEach(id => deleteTask(id));
    toast.error(`${sel.count}개 업무가 삭제됐어요`);
    sel.clear();
  }

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className={cn("px-4 py-2.5 flex items-center justify-between", ACCENT_MAP[accent])}>
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs font-semibold rounded-full bg-white/60 px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <div className="p-3 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
          ) : (
            tasks.map(t => (
              <TaskItem
                key={t.id}
                task={t}
                isSelected={sel.isSelected(t.id)}
                onToggleSelect={sel.toggle}
                selectionMode={sel.hasSelection}
              />
            ))
          )}
        </div>
      </div>

      <SelectionBar
        count={sel.count}
        total={ids.length}
        onSelectAll={sel.selectAll}
        onClear={sel.clear}
        onDelete={handleDelete}
      />
    </>
  );
}
