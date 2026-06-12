"use client";

import { useState } from "react";
import { Routine, Frequency } from "@/types";
import { useRoutineStore } from "@/store/routines";
import { useMeetingStore } from "@/store/meetings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, CalendarDays, RefreshCw } from "lucide-react";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { DAY_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  routine: Routine;
  open: boolean;
  onClose: () => void;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function RoutineDetailModal({ routine, open, onClose }: Props) {
  const { updateRoutine, deleteRoutine, toggle } = useRoutineStore();
  const { meetings } = useMeetingStore();
  const [notes, setNotes] = useState(routine.notes ?? "");
  const [addingMeeting, setAddingMeeting] = useState(false);

  // 이 루틴에 연결된 회의 (최신순)
  const linkedMeetings = meetings
    .filter(m => m.routineId === routine.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const lastMeeting = linkedMeetings[0];
  const today = new Date().toISOString().slice(0, 10);

  const completionSet = new Set(routine.completionHistory ?? []);
  const last30 = getLast30Days();
  const recentCount = last30.filter(d => completionSet.has(d)).length;

  function handleSave() {
    updateRoutine(routine.id, { notes: notes || undefined });
    toast.success("저장됐어요");
    onClose();
  }

  function handleDelete() {
    deleteRoutine(routine.id);
    toast.error("루틴이 삭제됐어요");
    onClose();
  }

  function getScheduleLabel() {
    let base = "";
    if (routine.frequency === "daily") base = "매일";
    else if (routine.frequency === "weekly") {
      const days = (routine.daysOfWeek ?? []).sort().map(d => DAY_LABELS[d]).join(", ");
      base = `매주 ${days}요일`;
    } else if (routine.frequency === "monthly") {
      const type = routine.monthlyType ?? "date";
      if (type === "lastDay") base = "매월 말일";
      else if (type === "workday") base = `매월 ${routine.workdayIndex ?? 1}번째 영업일`;
      else base = `매월 ${routine.dayOfMonth ?? 1}일`;
    }
    if (routine.endDate) base += ` · ~${routine.endDate.slice(5)}까지`;
    return base;
  }

  // 30일을 주 단위로 그룹핑 (달력처럼)
  const weeks: string[][] = [];
  let week: string[] = [];
  last30.forEach((day, i) => {
    week.push(day);
    if (week.length === 7 || i === last30.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <RefreshCw className="size-3.5" />
            <span>루틴</span>
          </div>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <span>{routine.title}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full border font-normal",
                routine.isActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-muted text-muted-foreground border-border"
              )}>
                {routine.isActive ? "활성" : "비활성"}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 기본 정보 */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{getScheduleLabel()}</span>
            {routine.time && (
              <>
                <span>·</span>
                <span>{routine.time}</span>
              </>
            )}
            {routine.lastCompletedAt && (
              <>
                <span>·</span>
                <span>최근 완료: {routine.lastCompletedAt.slice(0, 10)}</span>
              </>
            )}
          </div>

          <Separator />

          {/* 완료 이력 — 최근 30일 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">최근 30일 완료 이력</label>
              <span className="text-xs text-muted-foreground">{recentCount}/30일 완료</span>
            </div>

            <div className="space-y-1.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex gap-1">
                  {week.map(day => {
                    const done = completionSet.has(day);
                    const isToday = day === new Date().toISOString().slice(0, 10);
                    return (
                      <div
                        key={day}
                        title={day}
                        className={cn(
                          "size-6 rounded flex items-center justify-center text-[10px] font-medium transition-colors",
                          done
                            ? "bg-green-500 text-white"
                            : isToday
                              ? "border-2 border-blue-400 text-blue-500"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {new Date(day + "T00:00:00").getDate()}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-green-500 inline-block" /> 완료</span>
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-muted inline-block border" /> 미완료</span>
              <span className="flex items-center gap-1"><span className="size-3 rounded inline-block border-2 border-blue-400" /> 오늘</span>
            </div>
          </div>

          <Separator />

          {/* 연결된 회의 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                연결된 회의 기록 {linkedMeetings.length > 0 && `(${linkedMeetings.length})`}
              </label>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => setAddingMeeting(true)}
              >
                <Plus className="size-3" />
                이번 회의 만들기
              </Button>
            </div>

            {linkedMeetings.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">아직 연결된 회의가 없어요.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                {linkedMeetings.map(m => (
                  <div key={m.id} className="rounded-md border px-3 py-2 bg-muted/20 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{m.date.slice(5).replace("-", "/")} {m.startTime ?? ""}</span>
                      {m.attendees.length > 0 && (
                        <span className="text-muted-foreground shrink-0">{m.attendees.join(", ")}</span>
                      )}
                    </div>
                    {m.notes && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{m.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 메모 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">메모</label>
            <Textarea
              placeholder="루틴에 대한 메모를 남기세요"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-20 text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5 mr-1.5" /> 삭제
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggle(routine.id)}
            >
              {routine.isActive ? "비활성화" : "활성화"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
            <Button size="sm" onClick={handleSave}>저장</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 이번 회의 만들기 — 이전 회의 안건 이어받음 */}
    <MeetingForm
      open={addingMeeting}
      onClose={() => setAddingMeeting(false)}
      defaultRoutineId={routine.id}
      defaultTitle={routine.title}
      defaultDate={today}
      defaultNotes={lastMeeting?.notes}
    />
    </>
  );
}
