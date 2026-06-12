"use client";

/**
 * calendar-shared.tsx
 * ───────────────────
 * 월별 캘린더(calendar-grid.tsx)와 부스팅 캘린더(boosting-calendar.tsx)가
 * 공유하는 시각 컴포넌트 & 유틸리티.
 *
 * ✅ 이 파일만 수정하면 두 캘린더 모두 자동으로 반영된다.
 */

import React from "react";
import { cn } from "@/lib/utils";

// ─── 상수 ────────────────────────────────────────────────────────────────────
export const BAR_H           = 20;  // 막대 높이(px)
export const BAR_GAP         = 2;   // 레인 간격(px)
export const MIN_LANE_HEIGHT = 72;  // 바 영역 최소 높이(px) — 빈 주도 동일 높이

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// ─── 타입 ────────────────────────────────────────────────────────────────────
export interface BarEvent {
  kind: "task" | "meeting" | "boosting";
  id: string;
  label: string;
  sub?: string;           // 부스팅 노출지면
  color: string;
  startIdx: number;
  endIdx: number;
  lane: number;
  draggable: boolean;
  continuesLeft: boolean;
  continuesRight: boolean;
  done?: boolean;
  selDay: number;         // 클릭 시 선택할 날짜(일)
}

// ─── 유틸리티 ─────────────────────────────────────────────────────────────────
export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildWeeks(year: number, month: number): (string | null)[][] {
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function assignLanes<T extends { startIdx: number; endIdx: number }>(
  items: T[],
): (T & { lane: number })[] {
  const laneEnds: number[] = [];
  return items.map(item => {
    let lane = laneEnds.findIndex(end => end < item.startIdx);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.endIdx;
    return { ...item, lane };
  });
}

// ─── 요일 헤더 (일~토) ────────────────────────────────────────────────────────
export function CalendarDayHeader() {
  return (
    <div className="grid grid-cols-7 mb-1">
      {DAY_LABELS.map((d, i) => (
        <div
          key={d}
          className={cn(
            "text-center text-xs font-semibold py-2 tracking-wider",
            i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground",
          )}
        >
          {d}
        </div>
      ))}
    </div>
  );
}

// ─── 순수 시각 막대 (DnD 훅 없음) ────────────────────────────────────────────
// CalendarGrid에서는 useDraggable 래퍼를 씌워 사용한다.
// BoostingCalendar에서는 그대로 사용한다.
export interface CalendarBarVisualProps {
  ev: BarEvent;
  isDragging?: boolean;
  isSelected?: boolean;   // 부스팅 캘린더의 선택 강조
  innerRef?: (el: HTMLElement | null) => void;
  extraProps?: React.HTMLAttributes<HTMLDivElement>;
  onClick?: () => void;
}

export function CalendarBarVisual({
  ev,
  isDragging  = false,
  isSelected  = false,
  innerRef,
  extraProps,
  onClick,
}: CalendarBarVisualProps) {
  const color      = ev.color;
  const isBoosting = ev.kind === "boosting";
  const left       = `calc(${(ev.startIdx / 7) * 100}% + 3px)`;
  const width      = `calc(${((ev.endIdx - ev.startIdx + 1) / 7) * 100}% - 6px)`;
  const top        = ev.lane * (BAR_H + BAR_GAP) + 2;

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={innerRef as any}
      onClick={onClick}
      title={ev.label + (ev.sub ? ` · ${ev.sub}` : "")}
      className={cn(
        "absolute flex items-center px-2 text-xs font-medium overflow-hidden transition-opacity",
        isBoosting ? "" : "rounded-full",
        ev.draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging  ? "opacity-40"
        : isSelected ? "opacity-100 ring-2 ring-offset-1"
        : "opacity-90 hover:opacity-100",
      )}
      style={{
        left,
        width,
        top,
        height:          BAR_H,
        backgroundColor: color + (isBoosting ? "2a" : "20"),
        color,
        ...(isBoosting
          ? {
              borderLeft:   !ev.continuesLeft  ? `3px solid ${color}` : `1px dashed ${color}`,
              borderRight:   ev.continuesRight  ? `1px dashed ${color}` : undefined,
              borderTop:    `1px solid ${color}44`,
              borderBottom: `1px solid ${color}44`,
              borderRadius:
                !ev.continuesLeft && !ev.continuesRight ? 4
                : !ev.continuesLeft                      ? "4px 0 0 4px"
                : !ev.continuesRight                     ? "0 4px 4px 0"
                : 0,
            }
          : {}),
      }}
      {...extraProps}
    >
      {(!isBoosting || !ev.continuesLeft) && (
        isBoosting ? (
          <span className="truncate flex items-center gap-1 min-w-0">
            <span className="truncate font-medium">{ev.label}</span>
            {ev.sub && <span className="shrink-0 opacity-60 text-[9px]">{ev.sub}</span>}
          </span>
        ) : (
          <span className={cn("truncate", ev.done && "line-through opacity-70")}>{ev.label}</span>
        )
      )}
    </div>
  );
}

// ─── 바 레인 컨테이너 (col-span-7, 세로 구분선 포함) ─────────────────────────
// 두 캘린더 모두 이 컴포넌트를 통해 동일한 막대 영역 구조를 갖는다.
// nullCols: 전월/익월 날짜에 해당하는 컬럼 인덱스 배열 (0~6) → 날짜 행과 동일한 회색
export function CalendarBarsArea({
  laneHeight,
  nullCols = [],
  children,
}: {
  laneHeight: number;
  nullCols?: number[];
  children?: React.ReactNode;
}) {
  return (
    <div className="relative" style={{ height: laneHeight }}>
      {/*
        날짜 행과 동일한 구조(grid + gap-x-px + bg-border)로 배경을 만들어
        null 컬럼이 날짜 행과 정확히 같은 회색으로 렌더됨
        (bg-muted/20 을 bg-background 위에 얹으면 투명해지는 문제 방지)
      */}
      <div className="absolute inset-0 grid grid-cols-7 gap-x-px bg-border">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={nullCols.includes(i) ? "bg-muted/20" : "bg-background"} />
        ))}
      </div>
      {/* 이벤트 바 (배경 그리드 위에 절대 위치) */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
