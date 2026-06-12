"use client";

import { useState } from "react";
import { Boosting } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { EXPOSURE_SITES } from "@/store/boosting";
import { siteColor } from "@/lib/constants";
import { BoostingDetailModal } from "./boosting-detail-modal";
import { cn, formatDateRange } from "@/lib/utils";

interface Props {
  boostings: Boosting[];
  year: number;
  month: number;
}

// 노출지면 정렬 순서 (사이드 목록과 동일)
const SITE_ORDER: readonly string[] = EXPOSURE_SITES;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function dateToDay(dateStr: string, year: number, month: number): number {
  const d = new Date(dateStr);
  if (d.getFullYear() !== year || d.getMonth() + 1 !== month) {
    return d < new Date(year, month - 1, 1) ? 0 : getDaysInMonth(year, month) + 1;
  }
  return d.getDate();
}

export function BoostingTimeline({ boostings, year, month }: Props) {
  const { tasks } = useTaskStore();
  const [selectedBoosting, setSelectedBoosting] = useState<Boosting | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const totalDays = getDaysInMonth(year, month);
  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : null;

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // ─── 노출지면 기준으로 그룹핑 ───────────────────────────────
  const siteGroups = new Map<string, Boosting[]>();
  boostings.forEach(b => {
    if (!siteGroups.has(b.exposureSite)) siteGroups.set(b.exposureSite, []);
    siteGroups.get(b.exposureSite)!.push(b);
  });

  // EXPOSURE_SITES 순서대로 정렬 (목록에 없는 지면은 뒤에)
  const orderedSites = Array.from(siteGroups.keys()).sort((a, b) => {
    const ia = SITE_ORDER.indexOf(a);
    const ib = SITE_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  function toggleGroup(id: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (boostings.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        이번 달 부스팅 일정이 없어요
      </div>
    );
  }

  // 지면 그룹 안에서 보여줄 개별 부스팅 행 (업무명/제목 표시)
  const renderBoostingRow = (b: Boosting) => {
    const startDay = Math.max(dateToDay(b.startDate, year, month), 1);
    const endDay = Math.min(dateToDay(b.endDate, year, month), totalDays);
    const leftPct = ((startDay - 1) / totalDays) * 100;
    const widthPct = ((endDay - startDay + 1) / totalDays) * 100;
    const color = siteColor(b.exposureSite);
    const task = b.taskId ? tasks.find(t => t.id === b.taskId) : null;
    const label = task?.title ?? b.title;

    return (
      <div
        key={b.id}
        className="flex border-b last:border-b-0 hover:bg-muted/20 cursor-pointer"
        onClick={() => setSelectedBoosting(b)}
      >
        <div className="w-40 shrink-0 px-3 py-2 border-r flex items-center gap-1.5 pl-5">
          <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{label}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {formatDateRange(b.startDate, b.endDate, b.startTime, b.endTime)}
            </p>
          </div>
        </div>
        <div className="flex-1 relative py-2 px-0.5">
          <div className="relative h-6">
            {endDay >= startDay && (
              <div
                className="absolute top-0 h-full rounded flex items-center px-2 overflow-hidden"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: color + "33",
                  borderLeft: `3px solid ${color}`,
                }}
                title={`${label} · ${formatDateRange(b.startDate, b.endDate, b.startTime, b.endTime)}`}
              >
                {/* 월별 캘린더와 동일하게: 제목 + 작게 노출지면 */}
                <span className="truncate flex items-center gap-1 min-w-0">
                  <span className="truncate font-medium text-xs" style={{ color }}>{label}</span>
                  <span className="shrink-0 opacity-60 text-[9px]" style={{ color }}>{b.exposureSite}</span>
                </span>
              </div>
            )}
            {todayDay && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-50"
                style={{ left: `${((todayDay - 0.5) / totalDays) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(totalDays * 28, 600)}px` }}>
          {/* 날짜 헤더 */}
          <div className="flex border-b bg-muted/30">
            <div className="w-40 shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r">
              노출지면 / 업무
            </div>
            <div className="flex flex-1">
              {days.map((d) => (
                <div
                  key={d}
                  className={cn(
                    "flex-1 text-center text-xs py-2 border-r last:border-r-0",
                    todayDay === d && "bg-blue-50 font-bold text-blue-600"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* 노출지면 그룹별 렌더링 */}
          {orderedSites.map(site => {
            const groupBoostings = siteGroups
              .get(site)!
              .slice()
              .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
            const color = siteColor(site);
            const isCollapsed = collapsedGroups.has(site);

            // 그룹 전체 기간 (가장 이른 시작 ~ 가장 늦은 종료)
            const groupStartDay = Math.max(
              Math.min(...groupBoostings.map(b => dateToDay(b.startDate, year, month))), 1
            );
            const groupEndDay = Math.min(
              Math.max(...groupBoostings.map(b => dateToDay(b.endDate, year, month))), totalDays
            );
            const groupLeftPct = ((groupStartDay - 1) / totalDays) * 100;
            const groupWidthPct = ((groupEndDay - groupStartDay + 1) / totalDays) * 100;

            return (
              <div key={site}>
                {/* 노출지면 그룹 헤더 */}
                <div
                  className="flex border-b bg-muted/40 hover:bg-muted/60 cursor-pointer"
                  onClick={() => toggleGroup(site)}
                >
                  <div className="w-40 shrink-0 px-3 py-2 border-r">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <p className="text-xs font-semibold truncate" style={{ color }}>{site}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-3.5">
                      {isCollapsed ? "▶" : "▼"} {groupBoostings.length}개
                    </p>
                  </div>
                  {/* 그룹 전체 범위 바 */}
                  <div className="flex-1 relative py-2 px-0.5">
                    <div className="relative h-6">
                      {groupEndDay >= groupStartDay && (
                        <div
                          className="absolute top-1 h-4 rounded-sm opacity-25"
                          style={{
                            left: `${groupLeftPct}%`,
                            width: `${groupWidthPct}%`,
                            backgroundColor: color,
                          }}
                        />
                      )}
                      {todayDay && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-50"
                          style={{ left: `${((todayDay - 0.5) / totalDays) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 지면별 부스팅 행 */}
                {!isCollapsed && groupBoostings.map(b => renderBoostingRow(b))}
              </div>
            );
          })}
        </div>
      </div>

      {selectedBoosting && (
        <BoostingDetailModal
          boosting={selectedBoosting}
          open={!!selectedBoosting}
          onClose={() => setSelectedBoosting(null)}
        />
      )}
    </div>
  );
}
