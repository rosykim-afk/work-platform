"use client";

import { useState } from "react";
import Link from "next/link";
import { Task, Meeting } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { useMeetingStore } from "@/store/meetings";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { MeetingDetailModal } from "@/components/meetings/meeting-detail-modal";
import { CalendarDays, ChevronRight, Users, CheckSquare } from "lucide-react";
import { getHoliday } from "@/lib/holidays";
import { DAY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type UpcomingItem =
  | { type: "task"; date: string; time?: string; data: Task }
  | { type: "meeting"; date: string; time?: string; data: Meeting };

export function UpcomingWeek() {
  const { getUpcoming } = useTaskStore();
  const { meetings } = useMeetingStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date();
  limit.setDate(limit.getDate() + 7);
  const limitStr = limit.toISOString().slice(0, 10);

  const items: UpcomingItem[] = [
    ...getUpcoming(7).map(t => ({ type: "task" as const, date: t.dueDate!, time: t.dueTime, data: t })),
    ...meetings
      .filter(m => m.date > today && m.date <= limitStr)
      .map(m => ({ type: "meeting" as const, date: m.date, time: m.startTime, data: m })),
  ];

  // 날짜별 그룹
  const byDate = new Map<string, UpcomingItem[]>();
  items.forEach(it => {
    if (!byDate.has(it.date)) byDate.set(it.date, []);
    byDate.get(it.date)!.push(it);
  });
  const dates = [...byDate.keys()].sort();
  dates.forEach(d =>
    byDate.get(d)!.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))
  );

  function dateLabel(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`;
  }

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">다가오는 7일</span>
          </div>
          <Link href="/calendar" className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            캘린더 <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="p-3 space-y-3">
          {dates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">7일 내 예정된 일정이 없어요</p>
          ) : (
            dates.map(date => {
              const holiday = getHoliday(date);
              const isWeekend = [0, 6].includes(new Date(date + "T00:00:00").getDay());
              return (
                <div key={date}>
                  <p className={cn(
                    "text-xs font-semibold mb-1.5",
                    holiday || isWeekend ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {dateLabel(date)}{holiday ? ` · ${holiday}` : ""}
                  </p>
                  <div className="space-y-1.5">
                    {byDate.get(date)!.map(it => (
                      <div
                        key={`${it.type}-${it.data.id}`}
                        className="flex items-center gap-2.5 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/40 transition-colors"
                        onClick={() =>
                          it.type === "task" ? setSelectedTask(it.data) : setSelectedMeeting(it.data)
                        }
                      >
                        {it.type === "meeting"
                          ? <Users className="size-3.5 text-blue-500 shrink-0" />
                          : <CheckSquare className="size-3.5 text-muted-foreground shrink-0" />}
                        {it.time && (
                          <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">{it.time}</span>
                        )}
                        <p className="text-sm truncate flex-1">{it.data.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} />
      )}
      {selectedMeeting && (
        <MeetingDetailModal meeting={selectedMeeting} open={!!selectedMeeting} onClose={() => setSelectedMeeting(null)} />
      )}
    </>
  );
}
