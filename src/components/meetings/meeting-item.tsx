"use client";

import { useState } from "react";
import { Meeting } from "@/types";
import { useMeetingStore } from "@/store/meetings";
import { useProjectStore } from "@/store/projects";
import { MeetingDetailModal } from "./meeting-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUndoStore } from "@/store/undo";

interface Props {
  meeting: Meeting;
  isPast?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function MeetingItem({ meeting, isPast, isSelected, onToggleSelect, selectionMode }: Props) {
  const { deleteMeeting, restoreMeeting } = useMeetingStore();
  const { projects } = useProjectStore();
  const { push: pushUndo } = useUndoStore();
  const [detailOpen, setDetailOpen] = useState(false);

  function handleDelete() {
    const snapshot = { ...meeting };
    deleteMeeting(meeting.id);
    pushUndo({ label: `"${meeting.title}" 삭제 취소`, undo: () => restoreMeeting(snapshot) });
    toast.error("회의가 삭제됐어요", { description: "⌘Z로 되돌리기" });
  }

  const project = projects.find(p => p.id === meeting.projectId);

  return (
    <>
      <div
        className={cn(
          "rounded-md border bg-card px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer group",
          isPast && "opacity-60",
          isSelected && "bg-accent/60 border-accent-foreground/20"
        )}
        onClick={() => !selectionMode && setDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* 선택 체크박스 — 상시 노출 */}
          <input
            type="checkbox"
            checked={isSelected ?? false}
            onChange={() => onToggleSelect?.(meeting.id)}
            onClick={e => e.stopPropagation()}
            className="mt-1 size-4 rounded cursor-pointer accent-primary shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{meeting.title}</p>
              {project && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">{project.title}</Badge>
              )}
              {meeting.notes && (
                <FileText className="size-3 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {meeting.date} {meeting.startTime}{meeting.endTime ? ` ~ ${meeting.endTime}` : ""}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {meeting.location}
                </span>
              )}
              {meeting.attendees.length > 0 && (
                <span className="flex items-center gap-1">
                  <div className="flex -space-x-1.5">
                    {meeting.attendees.slice(0, 4).map((a) => (
                      <Avatar key={a} className="size-5 border border-background text-[9px]">
                        <AvatarFallback className="text-[9px]">{a[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {meeting.attendees.length > 4 && (
                      <span className="text-xs text-muted-foreground ml-1.5">+{meeting.attendees.length - 4}</span>
                    )}
                  </div>
                  <span className="ml-1 text-xs text-muted-foreground">{meeting.attendees.slice(0, 2).join(", ")}{meeting.attendees.length > 2 ? ` 외 ${meeting.attendees.length - 2}명` : ""}</span>
                </span>
              )}
            </div>
          </div>

          <div className={cn("flex items-center gap-0.5 transition-opacity shrink-0", selectionMode ? "invisible" : "opacity-0 group-hover:opacity-100")}>
            <Button
              variant="ghost" size="icon-xs"
              onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
              title="상세 보기"
            >
              <FileText className="size-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon-xs"
              onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
              title="수정"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon-xs"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              title="삭제"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <MeetingDetailModal meeting={meeting} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
