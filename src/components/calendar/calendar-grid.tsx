"use client";

import React, { useState, useMemo, useRef, KeyboardEvent } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Task, Boosting, Meeting } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { useMeetingStore } from "@/store/meetings";
import { cn } from "@/lib/utils";
import { siteColor } from "@/lib/constants";
import { getHoliday } from "@/lib/holidays";
import { DayDetail } from "./day-detail";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  BAR_H, BAR_GAP, MIN_LANE_HEIGHT,
  BarEvent, toDateStr, buildWeeks, assignLanes,
  CalendarDayHeader, CalendarBarVisual, CalendarBarsArea,
} from "./calendar-shared";

const TASK_COLOR      = "#0072F5";
const TASK_DONE_COLOR = "#889096";
const MEETING_COLOR   = "#F5A524";

// ─── 드래그 중 오버레이 pill ──────────────────────────────────────────────────
function OverlayPill({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{ backgroundColor: color + "30", color, borderLeft: `3px solid ${color}` }}
      className="text-[10px] px-2 py-1 rounded-full font-semibold shadow-xl cursor-grabbing w-32 truncate"
    >
      {label}
    </div>
  );
}

// ─── DnD 래퍼 — CalendarBarVisual + useDraggable ─────────────────────────────
function CalendarBar({
  ev,
  onSelectDay,
}: {
  ev: BarEvent;
  onSelectDay: (day: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ev.id,
    disabled: !ev.draggable,
  });

  return (
    <CalendarBarVisual
      ev={ev}
      isDragging={isDragging}
      innerRef={setNodeRef}
      extraProps={
        ev.draggable
          ? ({ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>)
          : undefined
      }
      onClick={() => onSelectDay(ev.selDay)}
    />
  );
}

// ─── 날짜 셀 (드롭 타깃 + 클릭 + 추가버튼) ──────────────────────────────────
interface DayCellProps {
  dateStr: string;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isSun: boolean;
  isSat: boolean;
  holiday?: string;
  onSelect: () => void;
  onAdd: () => void;
}

function DayCell({
  dateStr,
  day,
  isToday,
  isSelected,
  isSun,
  isSat,
  holiday,
  onSelect,
  onAdd,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}` });

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        "min-h-9 flex items-start justify-between px-2 pt-1.5 pb-1 cursor-pointer group/cell transition-colors",
        isOver
          ? "bg-primary/10 ring-1 ring-primary ring-inset"
          : isSelected
          ? "bg-primary/5"
          : "bg-background hover:bg-muted/40",
      )}
    >
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onAdd();
        }}
        className="opacity-0 group-hover/cell:opacity-100 transition-opacity size-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 mt-0.5"
      >
        <Plus className="size-3" />
      </button>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            "text-xs font-semibold size-6 flex items-center justify-center rounded-full transition-colors shrink-0",
            isToday
              ? "bg-primary text-primary-foreground shadow-sm"
              : isSelected
              ? "text-primary font-bold"
              : holiday
              ? "text-red-500"
              : isSun
              ? "text-red-400"
              : isSat
              ? "text-blue-400"
              : "text-foreground",
          )}
        >
          {day}
        </span>
        {holiday && (
          <span className="text-[9px] leading-tight text-red-400 max-w-14 text-right truncate">
            {holiday}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── CalendarGrid (메인) ──────────────────────────────────────────────────────
interface Props {
  year: number;
  month: number;
  tasks: Task[];
  boostings: Boosting[];
  meetings: Meeting[];
  filters: Set<string>;
}

export function CalendarGrid({
  year,
  month,
  tasks,
  boostings,
  meetings,
  filters,
}: Props) {
  const { updateTask, addTask } = useTaskStore();
  const { updateMeeting }       = useMeetingStore();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [overlayInfo, setOverlayInfo] = useState<{ label: string; color: string } | null>(null);
  const [addingDay,   setAddingDay  ] = useState<number | null>(null);
  const [addInput,    setAddInput   ] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const weeks    = useMemo(() => buildWeeks(year, month), [year, month]);

  // 주별 BarEvent 생성 + 레인 계산
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

      const raw: BarEvent[] = [];

      if (filters.has("task")) {
        tasks.forEach(t => {
          if (!t.dueDate || t.status === "cancelled") return;
          // startDate가 있으면 기간 업무 → 부스팅처럼 주를 가로지르는 막대
          const due   = t.dueDate;
          const start = t.startDate && t.startDate < due ? t.startDate : due;
          if (start > weekEnd || due < weekStart) return;
          let startIdx = full7.findIndex(d => d >= start);
          if (startIdx === -1) startIdx = 0;
          const revEnd = [...full7].reverse().findIndex(d => d <= due);
          const endIdx = revEnd === -1 ? 0 : 6 - revEnd;
          raw.push({
            kind: "task",
            id: `task-${t.id}`,
            label: t.title,
            color: t.status === "done" ? TASK_DONE_COLOR : TASK_COLOR,
            startIdx, endIdx, lane: 0,
            draggable: true,
            continuesLeft:  start < weekStart,
            continuesRight: due   > weekEnd,
            done: t.status === "done",
            selDay: parseInt(full7[startIdx].slice(8)),
          });
        });
      }

      if (filters.has("meeting")) {
        meetings.forEach(m => {
          const idx = week.indexOf(m.date);
          if (idx === -1) return;
          raw.push({
            kind: "meeting",
            id: `meeting-${m.id}`,
            label: m.title,
            color: MEETING_COLOR,
            startIdx: idx, endIdx: idx, lane: 0,
            draggable: true,
            continuesLeft: false, continuesRight: false,
            selDay: parseInt(m.date.slice(8)),
          });
        });
      }

      if (filters.has("boosting")) {
        boostings.forEach(b => {
          if (!b.startDate || !b.endDate || b.status === "cancelled") return;
          if (b.startDate > weekEnd || b.endDate < weekStart) return;
          let startIdx = full7.findIndex(d => d >= b.startDate);
          if (startIdx === -1) startIdx = 0;
          const revEnd = [...full7].reverse().findIndex(d => d <= b.endDate);
          const endIdx = revEnd === -1 ? 0 : 6 - revEnd;
          const label  = b.taskId
            ? tasks.find(t => t.id === b.taskId)?.title ?? b.title
            : b.title;
          raw.push({
            kind: "boosting",
            id: `boosting-${b.id}`,
            label, sub: b.exposureSite,
            color: siteColor(b.exposureSite),
            startIdx, endIdx, lane: 0,
            draggable: false,
            continuesLeft:  b.startDate < weekStart,
            continuesRight: b.endDate   > weekEnd,
            selDay: parseInt(full7[startIdx].slice(8)),
          });
        });
      }

      // 긴 막대(부스팅) 위로, 그다음 시작일 순
      raw.sort(
        (a, b) =>
          a.startIdx - b.startIdx ||
          (b.endIdx - b.startIdx) - (a.endIdx - a.startIdx) ||
          (a.kind === "boosting" ? -1 : 1),
      );

      const events     = assignLanes(raw);
      const maxLane    = events.length ? Math.max(...events.map(e => e.lane)) : -1;
      const laneHeight = Math.max(
        maxLane >= 0 ? (maxLane + 1) * (BAR_H + BAR_GAP) + 4 : 0,
        MIN_LANE_HEIGHT,
      );

      return { week, laneHeight, events };
    });
  }, [weeks, tasks, meetings, boostings, filters]);

  function handleAddTask(title: string, day: number) {
    const v = title.trim();
    if (!v) return;
    addTask({ title: v, status: "todo", priority: "medium", dueDate: toDateStr(year, month, day) });
    toast.success(`"${v}" 추가됐어요`);
  }

  function openAdd(day: number) {
    setAddingDay(day);
    setAddInput("");
    setTimeout(() => addInputRef.current?.focus(), 30);
  }
  function commitAdd() {
    if (addingDay != null) handleAddTask(addInput, addingDay);
    setAddingDay(null);
    setAddInput("");
  }
  function cancelAdd() {
    setAddingDay(null);
    setAddInput("");
  }

  function handleDragStart(event: DragStartEvent) {
    const id      = String(event.active.id);
    const dashIdx = id.indexOf("-");
    const type    = id.slice(0, dashIdx);
    const itemId  = id.slice(dashIdx + 1);
    if (type === "task") {
      const t = tasks.find(t => t.id === itemId);
      if (t)
        setOverlayInfo({
          label: t.title,
          color: t.status === "done" ? TASK_DONE_COLOR : TASK_COLOR,
        });
    } else if (type === "meeting") {
      const m = meetings.find(m => m.id === itemId);
      if (m) setOverlayInfo({ label: m.title, color: MEETING_COLOR });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setOverlayInfo(null);
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("day-")) return;
    // overId format: "day-YYYY-MM-DD"
    const newDate   = overId.slice(4); // "YYYY-MM-DD"
    const targetDay = parseInt(newDate.slice(8));

    const activeId = String(active.id);
    const dashIdx  = activeId.indexOf("-");
    const type     = activeId.slice(0, dashIdx);
    const itemId   = activeId.slice(dashIdx + 1);

    if (type === "task") {
      const t = tasks.find(t => t.id === itemId);
      if (!t || !t.dueDate || t.dueDate === newDate) return;
      if (t.startDate) {
        // 기간 업무: 기간 길이를 유지한 채 통째로 이동
        const diffMs   = Date.parse(newDate) - Date.parse(t.dueDate);
        const newStart = new Date(Date.parse(t.startDate) + diffMs).toISOString().slice(0, 10);
        updateTask(itemId, { startDate: newStart, dueDate: newDate });
      } else {
        updateTask(itemId, { dueDate: newDate });
      }
      toast.success(`"${t.title}" → ${month}/${targetDay}로 이동됐어요`);
    } else if (type === "meeting") {
      const m = meetings.find(m => m.id === itemId);
      if (!m || m.date === newDate) return;
      updateMeeting(itemId, { date: newDate });
      toast.success(`"${m.title}" → ${month}/${targetDay}로 이동됐어요`);
    }
  }

  function getSelectedDayItems() {
    if (!selectedDay) return { tasks: [], boostings: [], meetings: [] };
    const dateStr = toDateStr(year, month, selectedDay);
    return {
      tasks:     tasks.filter(t =>
        t.dueDate &&
        (t.startDate ?? t.dueDate) <= dateStr &&
        t.dueDate >= dateStr &&
        t.status !== "cancelled",
      ),
      boostings: boostings.filter(
        b => b.startDate && b.endDate && b.startDate <= dateStr && b.endDate >= dateStr,
      ),
      meetings:  meetings.filter(m => m.date === dateStr),
    };
  }
  const selectedItems = getSelectedDayItems();

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0 select-none">
          {/* ── 공유 요일 헤더 ── */}
          <CalendarDayHeader />

          {/* ── 날짜 그리드 ── */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden shadow-sm">
            {weekData.map(({ week, laneHeight, events }, wi) => {
              const addingInThisWeek =
                addingDay != null && week.includes(toDateStr(year, month, addingDay));
              return (
                // 주 전체를 col-span-7 flex 블록으로 — 날짜 행과 바 영역 사이 수평선 제거
                <div key={wi} className="col-span-7 flex flex-col">
                  {/* 날짜 행 — gap-x-px 로 세로 구분선만 유지 */}
                  <div className="grid grid-cols-7 gap-x-px bg-border">
                    {week.map((d, di) => {
                      if (!d) return <div key={di} className="h-9 bg-muted/20" />;
                      const day = parseInt(d.slice(8));
                      return (
                        <DayCell
                          key={di}
                          dateStr={d}
                          day={day}
                          isToday={d === todayStr}
                          isSelected={selectedDay === day}
                          isSun={di === 0}
                          isSat={di === 6}
                          holiday={getHoliday(d)}
                          onSelect={() => setSelectedDay(selectedDay === day ? null : day)}
                          onAdd={() => openAdd(day)}
                        />
                      );
                    })}
                  </div>

                  {/* ── 공유 바 레인 영역 ── */}
                  <CalendarBarsArea
                    laneHeight={laneHeight}
                    nullCols={week.map((d, i) => d ? -1 : i).filter(i => i >= 0)}
                  >
                    {events.map(ev => (
                      <CalendarBar
                        key={ev.id}
                        ev={ev}
                        onSelectDay={d => setSelectedDay(d)}
                      />
                    ))}
                  </CalendarBarsArea>

                  {/* 인라인 업무 추가 */}
                  {addingInThisWeek && (
                    <div
                      className="bg-background flex items-center gap-1.5 px-2 py-1.5 border-t border-dashed"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {month}/{addingDay}
                      </span>
                      <input
                        ref={addInputRef}
                        value={addInput}
                        onChange={e => setAddInput(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") { e.preventDefault(); commitAdd(); }
                          if (e.key === "Escape") cancelAdd();
                        }}
                        placeholder="업무명..."
                        className="flex-1 min-w-0 text-xs border border-primary/40 rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={commitAdd}
                        className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground shrink-0 hover:opacity-90"
                      >
                        추가
                      </button>
                      <button
                        type="button"
                        onClick={cancelAdd}
                        className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 사이드 패널 */}
        {selectedDay && (
          <DayDetail
            year={year}
            month={month}
            day={selectedDay}
            tasks={selectedItems.tasks}
            boostings={selectedItems.boostings}
            meetings={selectedItems.meetings}
            filters={filters}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {overlayInfo && <OverlayPill label={overlayInfo.label} color={overlayInfo.color} />}
      </DragOverlay>
    </DndContext>
  );
}
