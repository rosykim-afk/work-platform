"use client";

import Link from "next/link";
import { useRoutineStore } from "@/store/routines";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TodayRoutines() {
  const { getTodayRoutines, complete, updateRoutine } = useRoutineStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayRoutines = getTodayRoutines();

  const isDoneToday = (history?: string[]) => history?.includes(today) ?? false;
  const doneCount = todayRoutines.filter(r => isDoneToday(r.completionHistory)).length;
  const rate = todayRoutines.length > 0 ? Math.round((doneCount / todayRoutines.length) * 100) : 0;

  function handleCheck(id: string, checked: boolean) {
    if (checked) {
      complete(id);
    } else {
      // 완료 취소 — 오늘 기록 제거
      const routine = todayRoutines.find(r => r.id === id);
      if (!routine) return;
      updateRoutine(id, {
        completionHistory: (routine.completionHistory ?? []).filter(d => d !== today),
      });
    }
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">오늘 루틴</span>
        </div>
        <div className="flex items-center gap-2.5">
          {todayRoutines.length > 0 && (
            <>
              <Progress value={rate} className="w-20 h-1.5" />
              <span className="text-xs font-semibold text-green-600">{doneCount}/{todayRoutines.length}</span>
            </>
          )}
          <Link href="/routines" className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            전체 보기 <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {todayRoutines.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">오늘 예정된 루틴이 없어요</p>
        ) : (
          todayRoutines.map(r => {
            const isDone = isDoneToday(r.completionHistory);
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                  isDone ? "bg-green-50 border-green-200" : "bg-card hover:bg-accent/40"
                )}
              >
                <Checkbox checked={isDone} onCheckedChange={v => handleCheck(r.id, !!v)} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isDone && "line-through text-muted-foreground")}>
                    {r.title}
                  </p>
                </div>
                {r.time && <span className="text-xs text-muted-foreground shrink-0">{r.time}</span>}
                {isDone && <span className="text-xs text-green-600 font-medium shrink-0">완료 ✓</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
