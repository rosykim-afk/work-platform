"use client";

import { useState } from "react";
import Link from "next/link";
import { Meeting } from "@/types";
import { useMeetingStore } from "@/store/meetings";
import { useProjectStore } from "@/store/projects";
import { MeetingDetailModal } from "@/components/meetings/meeting-detail-modal";
import { Users, MapPin, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function TodaySchedule() {
  const { meetings } = useMeetingStore();
  const { projects } = useProjectStore();
  const [selected, setSelected] = useState<Meeting | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  const todayMeetings = meetings
    .filter(m => m.date === today)
    .sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"));

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">오늘 회의</span>
            {todayMeetings.length > 0 && (
              <span className="text-xs text-muted-foreground">{todayMeetings.length}건</span>
            )}
          </div>
          <Link href="/meetings" className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            전체 보기 <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="p-3 space-y-2">
          {todayMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">오늘 예정된 회의가 없어요</p>
          ) : (
            todayMeetings.map(m => {
              const project = projects.find(p => p.id === m.projectId);
              const isPast = !!m.endTime && m.endTime < nowTime;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-accent/40 transition-colors",
                    isPast && "opacity-60"
                  )}
                  onClick={() => setSelected(m)}
                >
                  <span className="text-sm font-semibold tabular-nums w-11 shrink-0 mt-px">
                    {m.startTime ?? "—"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      {project && (
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground">
                      {m.endTime && <span>~{m.endTime}</span>}
                      {m.location && (
                        <span className="flex items-center gap-0.5"><MapPin className="size-3" />{m.location}</span>
                      )}
                      {m.attendees.length > 0 && <span>{m.attendees.slice(0, 2).join(", ")}{m.attendees.length > 2 ? ` 외 ${m.attendees.length - 2}명` : ""}</span>}
                    </div>
                    {m.notes && (
                      <p className="flex items-start gap-1 text-xs text-muted-foreground mt-1 line-clamp-1">
                        <FileText className="size-3 shrink-0 mt-0.5" />
                        <span className="truncate">{m.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selected && (
        <MeetingDetailModal meeting={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
