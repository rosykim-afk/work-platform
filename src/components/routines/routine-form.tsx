"use client";

import { useState, useEffect } from "react";
import { Routine, Frequency, MonthlyType } from "@/types";
import { useRoutineStore } from "@/store/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const FREQ_LABEL: Record<Frequency, string> = { daily: "매일", weekly: "매주", monthly: "매월" };

interface Props {
  open: boolean;
  onClose: () => void;
  routine?: Routine;
}

export function RoutineForm({ open, onClose, routine }: Props) {
  const { addRoutine, updateRoutine } = useRoutineStore();

  const [title, setTitle] = useState(routine?.title ?? "");
  const [frequency, setFrequency] = useState<Frequency>(routine?.frequency ?? "daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(routine?.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(routine?.dayOfMonth ?? 1);
  const [monthlyType, setMonthlyType] = useState<MonthlyType>(routine?.monthlyType ?? "date");
  const [workdayIndex, setWorkdayIndex] = useState<number>(routine?.workdayIndex ?? 1);
  const [time, setTime] = useState(routine?.time ?? "");
  const [endDate, setEndDate] = useState(routine?.endDate ?? "");

  useEffect(() => {
    if (!open) return;
    setTitle(routine?.title ?? "");
    setFrequency(routine?.frequency ?? "daily");
    setDaysOfWeek(routine?.daysOfWeek ?? [1, 2, 3, 4, 5]);
    setDayOfMonth(routine?.dayOfMonth ?? 1);
    setMonthlyType(routine?.monthlyType ?? "date");
    setWorkdayIndex(routine?.workdayIndex ?? 1);
    setTime(routine?.time ?? "");
    setEndDate(routine?.endDate ?? "");
  }, [open, routine]);

  function toggleDay(day: number) {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function handleSubmit() {
    if (!title.trim()) return;
    const data = {
      title,
      frequency,
      isActive: true,
      daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
      monthlyType: frequency === "monthly" ? monthlyType : undefined,
      dayOfMonth: frequency === "monthly" && monthlyType === "date" ? dayOfMonth : undefined,
      workdayIndex: frequency === "monthly" && monthlyType === "workday" ? workdayIndex : undefined,
      time: time || undefined,
      endDate: endDate || undefined,
    };
    if (routine) {
      updateRoutine(routine.id, data);
    } else {
      addRoutine(data);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{routine ? "루틴 수정" : "새 루틴"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">루틴 이름 *</label>
            <Input
              placeholder="예: 일일 보고서 작성"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">반복 주기</label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger>
                <SelectValue>
                  <span>{FREQ_LABEL[frequency]}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">매일</SelectItem>
                <SelectItem value="weekly">매주</SelectItem>
                <SelectItem value="monthly">매월</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === "weekly" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">반복 요일</label>
              <div className="flex gap-2">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "size-9 rounded-full text-sm font-medium border transition-colors",
                      daysOfWeek.includes(i)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card border-border hover:bg-accent"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === "monthly" && (
            <div className="space-y-3">
              {/* 기준 선택 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">반복 기준</label>
                <div className="flex gap-2">
                  {(["date", "lastDay", "workday"] as MonthlyType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMonthlyType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                        monthlyType === type
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card border-border hover:bg-accent"
                      )}
                    >
                      {type === "date" ? "특정일" : type === "lastDay" ? "말일" : "영업일"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 특정일: 일자 선택 */}
              {monthlyType === "date" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">반복 일자</label>
                  <Select
                    value={String(dayOfMonth)}
                    onValueChange={(v) => setDayOfMonth(Number(v ?? "1"))}
                  >
                    <SelectTrigger>
                      <SelectValue><span>{dayOfMonth}일</span></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <SelectItem key={d} value={String(d)}>{d}일</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 영업일: 순번 선택 */}
              {monthlyType === "workday" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">몇 번째 영업일</label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(workdayIndex)}
                      onValueChange={(v) => setWorkdayIndex(Number(v ?? "1"))}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue><span>{workdayIndex}번째</span></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 22 }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>{n}번째</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">영업일 (공휴일 제외)</span>
                  </div>
                </div>
              )}

              {/* 말일: 별도 선택 불필요 */}
              {monthlyType === "lastDay" && (
                <p className="text-xs text-muted-foreground">매월 마지막 날에 반복돼요.</p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">실행 시간 <span className="text-muted-foreground font-normal">(선택)</span></label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-fit"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">종료일 <span className="text-muted-foreground font-normal">(선택)</span></label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-fit"
                />
                {endDate && (
                  <button type="button" onClick={() => setEndDate("")} className="text-xs text-muted-foreground hover:text-foreground px-1">✕</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {routine ? "저장" : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
