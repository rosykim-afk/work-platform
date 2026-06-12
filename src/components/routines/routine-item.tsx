"use client";

import { useState } from "react";
import { Routine } from "@/types";
import { useRoutineStore } from "@/store/routines";
import { RoutineForm } from "./routine-form";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Power } from "lucide-react";
import { RoutineDetailModal } from "./routine-detail-modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  routine: Routine;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function RoutineItem({ routine, isSelected, onToggleSelect, selectionMode }: Props) {
  const { toggle, deleteRoutine } = useRoutineStore();
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  function getScheduleLabel() {
    let base = "";
    if (routine.frequency === "daily") base = "매일";
    else if (routine.frequency === "weekly") {
      const days = (routine.daysOfWeek ?? []).sort().map(d => DAY_LABELS[d]).join(", ");
      base = `매주 ${days}`;
    } else if (routine.frequency === "monthly") {
      const type = routine.monthlyType ?? "date";
      if (type === "lastDay") base = "매월 말일";
      else if (type === "workday") base = `매월 ${routine.workdayIndex ?? 1}번째 영업일`;
      else base = `매월 ${routine.dayOfMonth ?? 1}일`;
    }
    if (routine.endDate) base += ` · ~${routine.endDate.slice(5)}까지`;
    return base;
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border px-4 py-3 transition-colors group cursor-pointer",
          isSelected
            ? "bg-accent/60 border-accent-foreground/20"
            : routine.isActive
            ? "bg-card hover:bg-accent/40"
            : "bg-muted/30 opacity-60"
        )}
        onClick={() => {
          if (selectionMode) { onToggleSelect?.(routine.id); return; }
          setDetailOpen(true);
        }}
      >
        {/* 선택 체크박스 — 상시 노출 */}
        <input
          type="checkbox"
          checked={isSelected ?? false}
          onChange={() => onToggleSelect?.(routine.id)}
          onClick={e => e.stopPropagation()}
          className="size-4 rounded cursor-pointer accent-primary shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", !routine.isActive && "line-through text-muted-foreground")}>
            {routine.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getScheduleLabel()}{routine.time ? ` · ${routine.time}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            routine.isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-muted text-muted-foreground border-border"
          )}>
            {routine.isActive ? "활성" : "비활성"}
          </span>

          {/* 인라인 액션 버튼 — 선택 모드 아닐 때만 */}
          {!selectionMode && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost" size="icon-xs"
                title={routine.isActive ? "비활성화" : "활성화"}
                onClick={e => { e.stopPropagation(); toggle(routine.id); }}
              >
                <Power className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon-xs"
                title="수정"
                onClick={e => { e.stopPropagation(); setEditing(true); }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon-xs"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                title="삭제"
                onClick={e => { e.stopPropagation(); deleteRoutine(routine.id); toast.error("루틴이 삭제됐어요"); }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <RoutineForm open={editing} onClose={() => setEditing(false)} routine={routine} />
      <RoutineDetailModal routine={routine} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
