"use client";

import { useState } from "react";
import { useRoutineStore } from "@/store/routines";
import { RoutineForm } from "@/components/routines/routine-form";
import { RoutineItem } from "@/components/routines/routine-item";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SelectionBar } from "@/components/ui/selection-bar";
import { useSelection } from "@/hooks/use-selection";
import { Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RoutinesPage() {
  const { routines, getTodayRoutines, complete, deleteRoutine } = useRoutineStore();
  const [creating, setCreating] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const sel = useSelection(routines.map(r => r.id));

  function handleDeleteSelected() {
    sel.selected.forEach(id => deleteRoutine(id));
    toast.error(`${sel.count}개 루틴이 삭제됐어요`);
    sel.clear();
  }

  const todayRoutines = getTodayRoutines();
  const allRoutines = routines;
  const activeCount = routines.filter(r => r.isActive).length;

  const todayDoneCount = checked.size;
  const todayRate = todayRoutines.length > 0
    ? Math.round((todayDoneCount / todayRoutines.length) * 100)
    : 0;

  function handleCheck(id: string, isChecked: boolean) {
    setChecked(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(id);
        complete(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">루틴</h1>
          <p className="text-sm text-muted-foreground mt-0.5">활성 루틴 {activeCount}개</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4 mr-1.5" /> 새 루틴
        </Button>
      </div>

      {/* 오늘의 루틴 */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">오늘의 루틴</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {todayDoneCount}/{todayRoutines.length} 완료
            </span>
            <Progress value={todayRate} className="w-24 h-1.5" />
            <span className="text-xs font-semibold text-green-600">{todayRate}%</span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {todayRoutines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              오늘 예정된 루틴이 없어요
            </p>
          ) : (
            todayRoutines.map((r) => {
              const isDone = checked.has(r.id);
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                    isDone ? "bg-green-50 border-green-200" : "bg-card hover:bg-accent/40"
                  )}
                >
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={(v) => handleCheck(r.id, !!v)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      isDone && "line-through text-muted-foreground"
                    )}>
                      {r.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.frequency === "daily" ? "매일" :
                       r.frequency === "weekly" ? "매주" : "매월"}
                    </p>
                  </div>
                  {isDone && (
                    <span className="text-xs text-green-600 font-medium">완료 ✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Separator />

      {/* 전체 루틴 관리 — 주기별 그룹 */}
      <div className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">전체 루틴 관리</p>
        {allRoutines.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <RefreshCw className="size-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">루틴이 없어요</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreating(true)}>
              <Plus className="size-4 mr-1" /> 첫 루틴 만들기
            </Button>
          </div>
        ) : (
          <>
            {(["daily", "weekly", "monthly"] as const).map(freq => {
              const group = allRoutines.filter(r => r.frequency === freq);
              if (group.length === 0) return null;
              const label = freq === "daily" ? "일일 루틴" : freq === "weekly" ? "주별 루틴" : "월별 루틴";
              return (
                <div key={freq}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                  <div className="space-y-2">
                    {group.map(r => (
                      <RoutineItem
                        key={r.id}
                        routine={r}
                        isSelected={sel.isSelected(r.id)}
                        onToggleSelect={sel.toggle}
                        selectionMode={sel.hasSelection}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <RoutineForm open={creating} onClose={() => setCreating(false)} />

      <SelectionBar
        count={sel.count}
        total={routines.length}
        onSelectAll={sel.selectAll}
        onClear={sel.clear}
        onDelete={handleDeleteSelected}
      />
    </div>
  );
}
