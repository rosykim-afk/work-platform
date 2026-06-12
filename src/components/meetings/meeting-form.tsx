"use client";

import { useState, useEffect } from "react";
import { Meeting } from "@/types";
import { useMeetingStore } from "@/store/meetings";
import { useProjectStore } from "@/store/projects";
import { useFolderStore } from "@/store/folders";
import { getProjectLabel } from "@/lib/project-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { DateDuringPicker } from "@/components/ui/date-during-picker";
import { X, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  meeting?: Meeting;
  defaultProjectId?: string;
  defaultRoutineId?: string;   // 루틴에서 생성 시
  defaultTitle?: string;       // 루틴 제목 pre-fill
  defaultNotes?: string;       // 이전 회의 안건 이어받기
  defaultDate?: string;        // 기본 날짜
}

export function MeetingForm({ open, onClose, meeting, defaultProjectId, defaultRoutineId, defaultTitle, defaultNotes, defaultDate }: Props) {
  const { addMeeting, updateMeeting } = useMeetingStore();
  const { projects } = useProjectStore();
  const { folders } = useFolderStore();

  const [title,         setTitle        ] = useState(meeting?.title         ?? defaultTitle ?? "");
  const [date,          setDate         ] = useState(meeting?.date          ?? defaultDate  ?? "");
  const [startTime,     setStartTime    ] = useState(meeting?.startTime     ?? "");
  const [endTime,       setEndTime      ] = useState(meeting?.endTime       ?? "");
  const [location,      setLocation     ] = useState(meeting?.location      ?? "");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees,     setAttendees    ] = useState<string[]>(meeting?.attendees ?? []);
  const [notes,         setNotes        ] = useState(meeting?.notes         ?? defaultNotes ?? "");
  const [projectId,     setProjectId    ] = useState(meeting?.projectId     ?? defaultProjectId ?? "");

  useEffect(() => {
    if (!open) return;
    setTitle(meeting?.title         ?? defaultTitle ?? "");
    setDate (meeting?.date          ?? defaultDate  ?? "");
    setStartTime(meeting?.startTime ?? "");
    setEndTime  (meeting?.endTime   ?? "");
    setLocation (meeting?.location  ?? "");
    setAttendees(meeting?.attendees ?? []);
    setNotes    (meeting?.notes     ?? defaultNotes ?? "");
    setProjectId(meeting?.projectId ?? defaultProjectId ?? "");
    setAttendeeInput("");
  }, [open, meeting, defaultTitle, defaultNotes, defaultDate, defaultProjectId]);

  const selectedProject = projects.find(p => p.id === projectId);

  function addAttendee() {
    const name = attendeeInput.trim();
    if (name && !attendees.includes(name)) {
      setAttendees(prev => [...prev, name]);
      setAttendeeInput("");
    }
  }

  function removeAttendee(name: string) {
    setAttendees(prev => prev.filter(a => a !== name));
  }

  function handleSubmit() {
    // 시간은 선택사항 — 날짜만 있으면 저장 가능
    if (!title.trim() || !date) return;
    const data = {
      title,
      date,
      startTime: startTime || undefined,
      endTime:   endTime   || undefined,
      location:  location  || undefined,
      attendees,
      notes:     notes     || undefined,
      projectId:  projectId          || undefined,
      routineId:  defaultRoutineId   || meeting?.routineId || undefined,
    };
    if (meeting) {
      updateMeeting(meeting.id, data);
    } else {
      addMeeting(data);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? "회의 수정" : "새 회의 등록"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 회의명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">회의명 *</label>
            <Input placeholder="회의명 입력" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* 날짜 + 시간 (during, 시간 옵션) */}
          <DateDuringPicker
            label="날짜 *"
            startDate={date}
            startTime={startTime}
            endTime={endTime}
            onStartDate={setDate}
            onStartTime={setStartTime}
            onEndTime={setEndTime}
          />

          {/* 장소 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">장소</label>
            <Input placeholder="회의실, 링크 등" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          {/* 참석자 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">참석자</label>
            <div className="flex gap-2">
              <Input
                placeholder="이름 입력 후 Enter"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addAttendee}>
                <Plus className="size-4" />
              </Button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {attendees.map((a) => (
                  <span key={a} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    {a}
                    <button onClick={() => removeAttendee(a)} className="hover:text-red-500">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 연결 프로젝트 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">연결 프로젝트</label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
              <SelectTrigger>
                <SelectValue>
                  {selectedProject ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: selectedProject.color }} />
                      <span className="truncate">{getProjectLabel(selectedProject, folders)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">선택 안 함</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">없음</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: p.color }} />
                      {getProjectLabel(p, folders)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 회의록 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">회의록</label>
            <Textarea
              placeholder="회의 내용, 결정 사항 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          {/* 시간은 선택사항이므로 !startTime 제거 */}
          <Button onClick={handleSubmit} disabled={!title.trim() || !date}>
            {meeting ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
