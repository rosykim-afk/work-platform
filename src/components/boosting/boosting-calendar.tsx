"use client";

/**
 * BoostingCalendar
 * ────────────────
 * 시각 컴포넌트(바, 레인, 헤더)는 calendar-shared.tsx에서 가져온다.
 * → calendar-shared.tsx만 수정하면 월별 캘린더와 이 캘린더가 동시에 변경된다.
 */

import React, { useMemo } from "react";
import { Boosting } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { siteColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getHoliday } from "@/lib/holidays";
import {
  BAR_H, BAR_GAP, MIN_LANE_HEIGHT,
  BarEvent, buildWeeks, assignLanes,
  CalendarDayHeader, CalendarBarVisual, CalendarBarsArea,
} from "@/components/calendar/calendar-shared";

interface Props {
  boostings: Boosting[];
  year: number;
  month: number;
  onSelect?: (b: Boosting) => void;
  selectedId?: string | null;
}

export function BoostingCalendar({
  boostings,
  year,
  month,
  onSelect,
  selectedId,
}: Props) {
  const { tasks } = useTaskStore();

  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  // 부스팅 → BarEvent 변환 + 레인 계산
  const weekData = useMemo(() => {
    return weeks.map(week => {
      const firstValidIdx = week.findIndex(Boolean);
      const reversedValid = [...week].reverse().findIndex(Boolean);
      const lastValidIdx  = reversedValid === -1 ? 6 : 6 - reversedValid;
      const full7         = week.map((d, i) =>
        d ?? (i < firstValidIdx ? week[firstValidIdx]! : week[lastValidIdx]!),
      );
      const weekStart = full7[0];
      const weekEnd   = full7[6];

      const raw: BarEvent[] = boostings
        .filter(b => b.startDate && b.endDate && b.startDate <= weekEnd && b.endDate >= weekStart)
        .map(b => {
          let startIdx = full7.findIndex(d => d >= b.startDate);
          if (startIdx === -1) startIdx = 0;
          const revEnd = [...full7].reverse().findIndex(d => d <= b.endDate);
          const endIdx = revEnd === -1 ? 0 : 6 - revEnd;
          const label  = b.taskId
            ? tasks.find(t => t.id === b.taskId)?.title ?? b.title
            : b.title;
          return {
            kind: "boosting" as const,
            id:   `boosting-${b.id}`,
            label,
            sub:  b.exposureSite,
            color: siteColor(b.exposureSite),
            startIdx, endIdx, lane: 0,
            draggable: false,
            continuesLeft:  b.startDate < weekStart,
            continuesRight: b.endDate   > weekEnd,
            selDay: parseInt(full7[startIdx].slice(8)),
          };
        });

      raw.sort(
        (a, b) =>
          a.startIdx - b.startIdx ||
          (b.endIdx - b.startIdx) - (a.endIdx - a.startIdx),
      );

      const events     = assignLanes(raw);
      const maxLane    = events.length ? Math.max(...events.map(e => e.lane)) : -1;
      const laneHeight = Math.max(
        maxLane >= 0 ? (maxLane + 1) * (BAR_H + BAR_GAP) + 4 : 0,
        MIN_LANE_HEIGHT,
      );

      return { week, laneHeight, events };
    });
  }, [boostings, weeks, tasks]);

  return (
    <div className="select-none">
      {/* ── 공유 요일 헤더 ── */}
      <CalendarDayHeader />

      {/* ── 날짜 그리드 ── */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden shadow-sm">
        {weekData.map(({ week, laneHeight, events }, wi) => (
          // 주 전체를 col-span-7 flex 블록으로 — 날짜 행과 바 영역 사이 수평선 제거
          <div key={wi} className="col-span-7 flex flex-col">
            {/* 날짜 행 — gap-x-px 로 세로 구분선만 유지 */}
            <div className="grid grid-cols-7 gap-x-px bg-border">
              {week.map((d, di) => {
                const day     = d ? parseInt(d.slice(8)) : null;
                const isToday = d === todayStr;
                return (
                  <div
                    key={di}
                    className={cn(
                      "min-h-9 flex items-start justify-end px-2 pt-1.5 pb-1",
                      !d ? "bg-muted/20" : "bg-background",
                    )}
                  >
                    {day !== null && d && (
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={cn(
                            "text-xs font-semibold size-6 flex items-center justify-center rounded-full transition-colors",
                            isToday
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : getHoliday(d)
                              ? "text-red-500"
                              : di === 0 ? "text-red-400"
                              : di === 6 ? "text-blue-400"
                              : "text-foreground",
                          )}
                        >
                          {day}
                        </span>
                        {getHoliday(d) && (
                          <span className="text-[9px] leading-tight text-red-400 max-w-14 text-right truncate">
                            {getHoliday(d)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── 공유 바 레인 영역 ── */}
            <CalendarBarsArea
              laneHeight={laneHeight}
              nullCols={week.map((d, i) => d ? -1 : i).filter(i => i >= 0)}
            >
              {events.map(ev => {
                const boostingId = ev.id.slice("boosting-".length);
                const b          = boostings.find(b => b.id === boostingId);
                return (
                  <CalendarBarVisual
                    key={ev.id}
                    ev={ev}
                    isSelected={boostingId === selectedId}
                    onClick={() => b && onSelect?.(b)}
                  />
                );
              })}
            </CalendarBarsArea>
          </div>
        ))}
      </div>
    </div>
  );
}
