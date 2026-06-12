"use client";

import { useState } from "react";
import { Task, Boosting, Meeting } from "@/types";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Zap, CalendarDays, CheckSquare } from "lucide-react";
import { BOOSTING_STATUS_LABEL, TASK_STATUS_LABEL, TASK_STATUS_COLOR, siteColor } from "@/lib/constants";
import { cn, formatDateRange } from "@/lib/utils";

interface Props {
  year: number;
  month: number;
  day: number;
  tasks: Task[];
  boostings: Boosting[];
  meetings: Meeting[];
  filters: Set<string>;
  onClose: () => void;
}

export function DayDetail({ year, month, day, tasks, boostings, meetings, filters, onClose }: Props) {
  const [addingTask, setAddingTask] = useState(false);
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const showTasks     = filters.has("task");
  const showBoostings = filters.has("boosting");
  const showMeetings  = filters.has("meeting");

  const visibleCount =
    (showTasks ? tasks.length : 0) +
    (showBoostings ? boostings.length : 0) +
    (showMeetings ? meetings.length : 0);

  return (
    <div className="w-72 shrink-0 max-h-[calc(100vh-12rem)] flex flex-col rounded-2xl border bg-background shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <p className="text-sm font-semibold">{month}월 {day}일</p>
          <p className="text-xs text-muted-foreground">{visibleCount}개 항목</p>
        </div>
        <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 업무 */}
        {showTasks && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <CheckSquare className="size-3.5" />
                마감 업무 ({tasks.length})
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full size-6"
                onClick={() => setAddingTask(true)}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">없어요</p>
            ) : (
              <div className="space-y-1">
                {tasks.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-2 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.status === "done" ? "#94a3b8" : "#0072F5" }}
                    />
                    <span className={cn(
                      "text-xs flex-1 truncate font-medium",
                      t.status === "done" && "line-through text-muted-foreground"
                    )}>
                      {t.title}
                    </span>
                    {t.status && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                        TASK_STATUS_COLOR[t.status]
                      )}>
                        {TASK_STATUS_LABEL[t.status]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 부스팅 */}
        {showBoostings && boostings.length > 0 && (
          <>
            {showTasks && <Separator />}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: "#17C964" }}>
                <Zap className="size-3.5" />
                부스팅 ({boostings.length})
              </p>
              <div className="space-y-1.5">
                {boostings.map(b => {
                  const color = siteColor(b.exposureSite);
                  return (
                    <div
                      key={b.id}
                      className="rounded-lg border px-3 py-2"
                      style={{
                        backgroundColor: color + "12",
                        borderColor: color + "40",
                        borderLeftWidth: "3px",
                        borderLeftColor: color,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold flex-1 truncate" style={{ color }}>
                          {b.exposureSite}
                        </p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                          style={{ backgroundColor: color + "20", color }}
                        >
                          {BOOSTING_STATUS_LABEL[b.status]}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateRange(b.startDate, b.endDate, b.startTime, b.endTime)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 회의 */}
        {showMeetings && meetings.length > 0 && (
          <>
            {(showTasks || (showBoostings && boostings.length > 0)) && <Separator />}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                <CalendarDays className="size-3.5" />
                회의/미팅 ({meetings.length})
              </p>
              <div className="space-y-1.5">
                {meetings.map(m => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2"
                    style={{ borderLeftWidth: "3px", borderLeftColor: "#F5A524" }}
                  >
                    <p className="text-xs font-semibold text-foreground">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {m.startTime}{m.endTime ? ` ~ ${m.endTime}` : ""}
                      {m.location ? ` · ${m.location}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {visibleCount === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">
              {filters.size === 0 ? "필터를 선택해 주세요" : "일정이 없어요"}
            </p>
          </div>
        )}
      </div>

      <TaskForm
        open={addingTask}
        onClose={() => setAddingTask(false)}
        defaultDueDate={dateStr}
      />
    </div>
  );
}
