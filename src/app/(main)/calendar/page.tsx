"use client";

import { useState } from "react";
import { useTaskStore } from "@/store/tasks";
import { useBoostingStore } from "@/store/boosting";
import { useMeetingStore } from "@/store/meetings";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { key: "task",     label: "업무",   className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "boosting", label: "부스팅", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300" },
  { key: "meeting",  label: "회의",   className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300" },
];

export default function CalendarPage() {
  const { tasks }     = useTaskStore();
  const { boostings } = useBoostingStore();
  const { meetings }  = useMeetingStore();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filterValues, setFilterValues] = useState<Set<string>>(
    new Set(["task", "boosting", "meeting"])
  );

  function toggleFilter(key: string) {
    setFilterValues(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const prefix = `${year}-${pad(month)}`;

  // 기간 업무(startDate~dueDate)가 이번 달에 걸치면 포함
  const monthTasks     = tasks.filter(t =>
    t.dueDate && (t.startDate ?? t.dueDate) <= `${prefix}-31` && t.dueDate >= `${prefix}-01`
  );
  const monthBoostings = boostings.filter(b => b.startDate <= `${prefix}-31` && b.endDate >= `${prefix}-01`);
  const monthMeetings  = meetings.filter(m => m.date.startsWith(prefix));

  return (
    <div className="space-y-4">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {year}년 {month}월
          </h1>
          <Button
            variant="outline"
            size="xs"
            className="rounded-full"
            onClick={goToday}
          >
            오늘
          </Button>
          <div className="flex">
            <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* 필터 배지 */}
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map(f => {
            const active = filterValues.has(f.key);
            return (
              <Badge
                key={f.key}
                variant="outline"
                className={cn(
                  "cursor-pointer select-none transition-opacity",
                  active ? f.className : "opacity-40"
                )}
                onClick={() => toggleFilter(f.key)}
              >
                {f.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* ── 요약 ── */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>업무 {monthTasks.filter(t => t.status !== "cancelled").length}개</span>
        <span>·</span>
        <span>부스팅 {monthBoostings.length}개</span>
        <span>·</span>
        <span>회의 {monthMeetings.length}개</span>
      </div>

      {/* ── 캘린더 그리드 ── */}
      <CalendarGrid
        year={year}
        month={month}
        tasks={monthTasks}
        boostings={monthBoostings}
        meetings={monthMeetings}
        filters={filterValues}
      />
    </div>
  );
}
