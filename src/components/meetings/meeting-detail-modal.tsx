"use client";

import { useState, useEffect } from "react";
import { Meeting } from "@/types";
import { useMeetingStore } from "@/store/meetings";
import { useTaskStore } from "@/store/tasks";
import { useProjectStore } from "@/store/projects";

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
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Users, Plus, Trash2, X } from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  meeting: Meeting;
  open: boolean;
  onClose: () => void;
}

export function MeetingDetailModal({ meeting, open, onClose }: Props) {
  const { updateMeeting, deleteMeeting } = useMeetingStore();
  const { addTask } = useTaskStore();
  const { projects, addTaskId } = useProjectStore();

  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(meeting.date);
  const [startTime, setStartTime] = useState(meeting.startTime ?? "");
  const [endTime, setEndTime] = useState(meeting.endTime ?? "");
  const [location, setLocation] = useState(meeting.location ?? "");
  const [attendees, setAttendees] = useState<string[]>(meeting.attendees);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [projectId, setProjectId] = useState(meeting.projectId ?? "");
  const [taskInput, setTaskInput] = useState("");
  const [showTaskInput, setShowTaskInput] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(meeting.title);
    setDate(meeting.date);
    setStartTime(meeting.startTime ?? "");
    setEndTime(meeting.endTime ?? "");
    setLocation(meeting.location ?? "");
    setAttendees(meeting.attendees);
    setAttendeeInput("");
    setNotes(meeting.notes ?? "");
    setProjectId(meeting.projectId ?? "");
    setTaskInput("");
    setShowTaskInput(false);
  }, [open, meeting]);

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

  function handleAddTask() {
    const t = taskInput.trim();
    if (!t) return;
    const newTask = addTask({
      title: t,
      projectId: meeting.projectId,
      status: "todo",
    });
    if (meeting.projectId) addTaskId(meeting.projectId, newTask.id);
    setTaskInput("");
  }

  function handleSave() {
    if (!title.trim() || !date) return;
    updateMeeting(meeting.id, {
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      attendees,
      notes: notes || undefined,
      projectId: projectId || undefined,
      routineId: meeting.routineId,
    });
    toast.success("저장됐어요");
    onClose();
  }

  function handleDelete() {
    deleteMeeting(meeting.id);
    toast.error("회의가 삭제됐어요");
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="size-3.5" />
              <span>회의/미팅</span>
            </div>
            <DialogTitle>
              <input
                className="w-full text-base font-semibold bg-transparent outline-none border-b border-transparent focus:border-border transition-colors pb-0.5"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="회의 제목"
              />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* 날짜 / 시간 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" /> 일시
              </label>
              <div className="flex gap-2 flex-wrap">
                <Input type="date" className="h-8 text-xs w-36" value={date} onChange={e => setDate(e.target.value)} />
                <Input type="time" className="h-8 text-xs w-28" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <span className="self-center text-xs text-muted-foreground">~</span>
                <Input type="time" className="h-8 text-xs w-28" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            {/* 장소 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5" /> 장소
              </label>
              <Input
                className="h-8 text-sm"
                placeholder="회의실 또는 링크"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            {/* 참석자 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5" /> 참석자
              </label>
              <div className="flex gap-2">
                <Input
                  className="h-8 text-sm"
                  placeholder="이름 입력 후 Enter"
                  value={attendeeInput}
                  onChange={e => setAttendeeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                />
                <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={addAttendee}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attendees.map(a => (
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
              <label className="text-xs font-medium text-muted-foreground">연결 프로젝트</label>
              <Select value={projectId} onValueChange={v => setProjectId(v ?? "")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {selectedProject ? (
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: selectedProject.color }} />
                        <span className="truncate">{selectedProject.title}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">없음</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                        {p.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 회의록 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">회의록 / 안건</label>
              <Textarea
                placeholder="회의 내용, 결정 사항, 안건 등을 기록하세요"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-32 text-sm resize-none"
                rows={6}
              />
            </div>

            <Separator />

            {/* 후속 업무 — 프로젝트에 바로 추가 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">후속 업무</label>
                {!showTaskInput && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowTaskInput(true)}>
                    <Plus className="size-3 mr-1" /> 추가
                  </Button>
                )}
              </div>

              {showTaskInput ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    className="h-8 text-sm"
                    placeholder={meeting.projectId ? "할 일 입력 후 Enter — 프로젝트에 추가됨" : "할 일 입력 후 Enter"}
                    value={taskInput}
                    onChange={e => setTaskInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddTask(); }
                      if (e.key === "Escape") { setShowTaskInput(false); setTaskInput(""); }
                    }}
                  />
                  <Button type="button" size="sm" className="h-8 shrink-0" onClick={handleAddTask}>추가</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => { setShowTaskInput(false); setTaskInput(""); }}>취소</Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {meeting.projectId ? "추가하면 연결된 프로젝트 업무로 들어가요" : "추가하면 업무 목록에 들어가요"}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="size-3.5 mr-1.5" /> 삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
              <Button size="sm" onClick={handleSave} disabled={!title.trim() || !date}>저장</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
