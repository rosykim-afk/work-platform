"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { Task, Status, Priority, ChecklistItem, Boosting } from "@/types";
import { useTaskStore } from "@/store/tasks";
import { useProjectStore } from "@/store/projects";
import { useFolderStore } from "@/store/folders";
import { useBoostingStore, EXPOSURE_SITES } from "@/store/boosting";
import { useMeetingStore } from "@/store/meetings";
import { getProjectLabel } from "@/lib/project-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { DateDuringPicker } from "@/components/ui/date-during-picker";
import {
  Plus, Trash2, X, Zap, ChevronDown, ChevronUp, CalendarDays, Users, Clock,
  MessageSquare, Send, FolderOpen, CheckSquare,
} from "lucide-react";
import {
  TASK_STATUS_LABEL,
  TASK_STATUS_COLOR,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  BOOSTING_STATUS_LABEL,
  BOOSTING_STATUS_COLOR,
} from "@/lib/constants";
import { BoostingDetailModal } from "@/components/boosting/boosting-detail-modal";
import { MeetingDetailModal } from "@/components/meetings/meeting-detail-modal";
import { toast } from "sonner";
import { cn, formatDateRange } from "@/lib/utils";

const STATUS_OPTIONS: Status[] = ["todo", "in_progress", "done", "cancelled"];
const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high"];

interface Props {
  task: Task;
  open: boolean;
  onClose: () => void;
}

function genId() {
  return `cl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function TaskDetailModal({ task, open, onClose }: Props) {
  const { updateTask, deleteTask, addComment, deleteComment } = useTaskStore();
  const { projects } = useProjectStore();
  const { folders } = useFolderStore();
  const { boostings, addBoosting, deleteBoosting } = useBoostingStore();
  const { meetings, addMeeting: addNewMeeting } = useMeetingStore();

  // 브레드크럼
  const linkedProject = projects.find(p => p.id === task.projectId);
  const linkedFolder = linkedProject?.folderId ? folders.find(f => f.id === linkedProject.folderId) : undefined;
  const breadcrumb = [linkedFolder?.title, linkedProject?.title].filter(Boolean).join(" / ");

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<Status | "">(task.status ?? "");
  const [priority, setPriority] = useState<Priority | "">(task.priority ?? "");
  const [startDate, setStartDate] = useState(task.startDate ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [dueTime, setDueTime] = useState(task.dueTime ?? "");
  const [projectId, setProjectId] = useState(task.projectId ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist ?? []);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [newItem, setNewItem] = useState("");
  const newItemRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때마다 task 기준으로 초기화
  // (상시 마운트라 useState 초기값은 최초 1회만 계산되기 때문)
  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status ?? "");
    setPriority(task.priority ?? "");
    setStartDate(task.startDate ?? "");
    setDueDate(task.dueDate ?? "");
    setDueTime(task.dueTime ?? "");
    setProjectId(task.projectId ?? "");
    setChecklist(task.checklist ?? []);
    setNotes(task.notes ?? "");
  }, [open, task]);

  // 부스팅 섹션
  const taskBoostings = boostings.filter(b => b.taskId === task.id);
  const [showBoosting, setShowBoosting] = useState(false);
  const [selectedBoosting, setSelectedBoosting] = useState<Boosting | null>(null);
  const [addingBoosting, setAddingBoosting] = useState(false);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [newBoostingStart, setNewBoostingStart] = useState("");
  const [newBoostingEnd, setNewBoostingEnd] = useState("");

  // 댓글
  const comments = task.comments ?? [];
  const [commentInput, setCommentInput] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);

  function handleAddComment() {
    const body = commentInput.trim();
    if (!body) return;
    addComment(task.id, body);
    setCommentInput("");
    commentInputRef.current?.focus();
  }

  // 회의 섹션
  const linkedMeetings = meetings.filter(m => m.projectId === task.projectId);
  const [showMeetings, setShowMeetings] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<typeof meetings[0] | null>(null);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [newMtgTitle, setNewMtgTitle] = useState("");
  const [newMtgDate, setNewMtgDate] = useState(task.dueDate ?? "");
  const [newMtgStart, setNewMtgStart] = useState("");
  const [newMtgEnd, setNewMtgEnd] = useState("");
  const [newMtgLocation, setNewMtgLocation] = useState("");

  function toggleSite(site: string) {
    setSelectedSites(prev => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site); else next.add(site);
      return next;
    });
  }

  function handleAddBoosting() {
    if (!newBoostingStart || !newBoostingEnd || selectedSites.size === 0) return;
    selectedSites.forEach(site => {
      addBoosting({
        title: `${task.title} - ${site}`,
        exposureSite: site,
        startDate: newBoostingStart,
        endDate: newBoostingEnd,
        status: "planned",
        taskId: task.id,
        projectId: task.projectId,
      });
    });
    toast.success(`${selectedSites.size}개 지면이 추가됐어요`);
    setSelectedSites(new Set());
    setNewBoostingStart("");
    setNewBoostingEnd("");
    setAddingBoosting(false);
  }

  function handleCreateMeeting() {
    if (!newMtgTitle.trim() || !newMtgDate || !newMtgStart) return;
    addNewMeeting({
      title: newMtgTitle.trim(),
      date: newMtgDate,
      startTime: newMtgStart,
      endTime: newMtgEnd || undefined,
      location: newMtgLocation || undefined,
      attendees: [],
      notes: undefined,
      projectId: task.projectId,
    });
    toast.success("회의가 등록됐어요");
    setNewMtgTitle(""); setNewMtgDate(task.dueDate ?? ""); setNewMtgStart("");
    setNewMtgEnd(""); setNewMtgLocation(""); setCreatingMeeting(false);
  }

  function addChecklistItem() {
    if (!newItem.trim()) return;
    setChecklist(prev => [...prev, { id: genId(), title: newItem.trim(), done: false }]);
    setNewItem("");
    newItemRef.current?.focus();
  }

  function toggleChecklistItem(id: string) {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  }

  function deleteChecklistItem(id: string) {
    setChecklist(prev => prev.filter(item => item.id !== id));
  }

  function handleSave() {
    if (!title.trim()) return;
    // 시작일만 있으면 그 날이 마감일(하루짜리), 시작일 == 마감일이면 단일 날짜로 저장
    const end   = dueDate || startDate;
    const start = startDate && end && startDate < end ? startDate : undefined;
    updateTask(task.id, {
      title: title.trim(),
      description: description || undefined,
      status:   (status   || undefined) as Status | undefined,
      priority: (priority || undefined) as Priority | undefined,
      startDate: start,
      dueDate: end || undefined,
      dueTime: dueTime || undefined,
      projectId: projectId || undefined,
      checklist,
      notes: notes || undefined,
    });
    toast.success("저장됐어요");
    onClose();
  }

  function handleDelete() {
    deleteTask(task.id);
    toast.error("업무가 삭제됐어요");
    onClose();
  }

  const doneCount = checklist.filter(i => i.done).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <CheckSquare className="size-3.5" />
            <span>업무</span>
            {breadcrumb && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <FolderOpen className="size-3 shrink-0" />
                <span>{breadcrumb}</span>
              </>
            )}
          </div>
          <DialogTitle>
            <input
              className="w-full text-base font-semibold bg-transparent outline-none border-b border-transparent focus:border-border transition-colors pb-0.5"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="업무명"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 요약 그리드 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
            {/* 진행도 */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">진행도</p>
              <Select value={status} onValueChange={v => setStatus(v as Status | "")}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                  <SelectValue placeholder="선택 안 함">
                    {status ? (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TASK_STATUS_COLOR[status])}>
                        {TASK_STATUS_LABEL[status]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">선택 안 함</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", TASK_STATUS_COLOR[s])}>
                        {TASK_STATUS_LABEL[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 중요도 */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">중요도</p>
              <Select value={priority} onValueChange={v => setPriority(v as Priority | "")}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                  <SelectValue placeholder="선택 안 함">
                    {priority ? (
                      <span className={cn("text-xs font-semibold", PRIORITY_COLOR[priority])}>
                        {PRIORITY_LABEL[priority]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">선택 안 함</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  {PRIORITY_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>
                      <span className={cn("text-xs font-medium", PRIORITY_COLOR[p])}>
                        {PRIORITY_LABEL[p]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 기간 (시작일 ~ 마감일 + 시간 옵션) — 공용 DateDuringPicker */}
            <div className="col-span-2">
              <DateDuringPicker
                compact
                label="기간"
                startDate={startDate}
                endDate={dueDate}
                startTime={dueTime}
                onStartDate={setStartDate}
                onEndDate={setDueDate}
                onStartTime={setDueTime}
              />
            </div>

            {/* 프로젝트 */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">프로젝트</p>
              <Select value={projectId} onValueChange={v => setProjectId(v ?? "")}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                  <SelectValue>
                    {(() => {
                      const p = projects.find(x => x.id === projectId);
                      return p ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="truncate">{getProjectLabel(p, folders)}</span>
                        </span>
                      ) : <span className="text-muted-foreground text-xs">없음</span>;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                        {getProjectLabel(p, folders)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* 설명 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">설명</label>
            <Textarea
              placeholder="업무 설명을 입력하세요"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-16 text-sm resize-none"
              rows={3}
            />
          </div>

          <Separator />

          {/* 체크리스트 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                체크리스트
                {checklist.length > 0 && (
                  <span className="ml-1.5 text-muted-foreground">
                    {doneCount}/{checklist.length}
                  </span>
                )}
              </label>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1.5">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group/item">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="shrink-0"
                    />
                    <span className={cn(
                      "text-sm flex-1",
                      item.done && "line-through text-muted-foreground"
                    )}>
                      {item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                      onClick={() => deleteChecklistItem(item.id)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Plus className="size-3.5 text-muted-foreground shrink-0" />
              <input
                ref={newItemRef}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground border-b border-transparent focus:border-border transition-colors py-0.5"
                placeholder="항목 추가..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); }
                }}
              />
              {newItem && (
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={addChecklistItem}>
                  추가
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* 메모 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">메모</label>
            <Textarea
              placeholder="자유롭게 메모하세요"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-16 text-sm resize-none"
              rows={3}
            />
          </div>

          <Separator />

          {/* ── 부스팅 일정 (접기/펼치기) ── */}
          <div>
            <button
              type="button"
              className="w-full flex items-center justify-between py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowBoosting(v => !v)}
            >
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5" />
                부스팅 일정
                {taskBoostings.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{taskBoostings.length}</Badge>
                )}
              </span>
              {showBoosting ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showBoosting && (
              <div className="mt-2 space-y-2">
                {/* 기존 부스팅 목록 */}
                {taskBoostings.length > 0 && (
                  <div className="space-y-1.5">
                    {taskBoostings.map(b => (
                      <div
                        key={b.id}
                        className="grid grid-cols-[80px_1fr_auto_auto] items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/40 transition-colors group/boost"
                        onClick={() => setSelectedBoosting(b)}
                      >
                        <span className="text-xs font-medium text-foreground truncate">{b.exposureSite}</span>
                        <span className="text-xs text-muted-foreground truncate">{b.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {formatDateRange(b.startDate, b.endDate, b.startTime, b.endTime)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5 opacity-0 group-hover/boost:opacity-100 shrink-0"
                          onClick={e => { e.stopPropagation(); deleteBoosting(b.id); toast.error("삭제됐어요"); }}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 지면 추가 폼 */}
                {addingBoosting ? (
                  <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">노출지면 선택 (여러 개 가능)</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {EXPOSURE_SITES.map(site => {
                          const checked = selectedSites.has(site);
                          return (
                            <button
                              key={site}
                              type="button"
                              onClick={() => toggleSite(site)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors text-left",
                                checked
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card hover:bg-accent border-border"
                              )}
                            >
                              <Checkbox checked={checked} className="size-3 pointer-events-none" />
                              {site}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">시작일</label>
                        <Input type="date" className="h-7 text-xs" value={newBoostingStart} onChange={e => setNewBoostingStart(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">종료일</label>
                        <Input type="date" className="h-7 text-xs" value={newBoostingEnd} onChange={e => setNewBoostingEnd(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {selectedSites.size > 0 ? `${selectedSites.size}개 선택됨` : "지면을 선택하세요"}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingBoosting(false); setSelectedSites(new Set()); }}>취소</Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddBoosting}
                          disabled={!newBoostingStart || !newBoostingEnd || selectedSites.size === 0}
                        >
                          {selectedSites.size > 0 ? `${selectedSites.size}개 추가` : "추가"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 w-full justify-start pl-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setAddingBoosting(true)}
                  >
                    <Plus className="size-3" /> 지면 추가
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* ── 연결 회의 (접기/펼치기) ── */}
          <div>
            <button
              type="button"
              className="w-full flex items-center justify-between py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowMeetings(v => !v)}
            >
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                연결 회의
                {linkedMeetings.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{linkedMeetings.length}</Badge>
                )}
              </span>
              {showMeetings ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showMeetings && (
              <div className="mt-2 space-y-2">
                {/* 같은 프로젝트 회의 목록 */}
                {linkedMeetings.length > 0 && (
                  <div className="space-y-1.5">
                    {linkedMeetings.map(m => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/40 transition-colors"
                        onClick={() => setSelectedMeeting(m)}
                      >
                        <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{m.title}</p>
                          <p className="text-[10px] text-muted-foreground">{m.date} {m.startTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 새 회의 등록 폼 */}
                {creatingMeeting && (
                  <div className="rounded-md border p-3 space-y-2.5 bg-muted/30">
                    <Input
                      className="h-7 text-xs"
                      placeholder="회의명 *"
                      value={newMtgTitle}
                      onChange={e => setNewMtgTitle(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">날짜 *</label>
                        <Input type="date" className="h-7 text-xs" value={newMtgDate} onChange={e => setNewMtgDate(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">시작 시간 *</label>
                        <Input type="time" className="h-7 text-xs" value={newMtgStart} onChange={e => setNewMtgStart(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">종료 시간</label>
                        <Input type="time" className="h-7 text-xs" value={newMtgEnd} onChange={e => setNewMtgEnd(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">장소</label>
                        <Input className="h-7 text-xs" placeholder="회의실 등" value={newMtgLocation} onChange={e => setNewMtgLocation(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCreatingMeeting(false)}>취소</Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleCreateMeeting}
                        disabled={!newMtgTitle.trim() || !newMtgDate || !newMtgStart}
                      >
                        등록
                      </Button>
                    </div>
                  </div>
                )}

                {!creatingMeeting && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setCreatingMeeting(true)}
                  >
                    <Clock className="size-3" /> 새 회의 등록
                  </Button>
                )}
              </div>
            )}
          </div>
          <Separator />

          {/* ── 댓글 ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 py-1 text-xs font-medium text-muted-foreground">
              <MessageSquare className="size-3.5" />
              댓글
              {comments.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{comments.length}</Badge>
              )}
            </div>

            {/* 댓글 목록 */}
            {comments.length > 0 && (
              <div className="space-y-2">
                {comments.map(c => (
                  <div key={c.id} className="group/comment flex gap-2 items-start rounded-lg border bg-muted/20 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed break-words">{c.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(c.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 opacity-0 group-hover/comment:opacity-100 shrink-0 mt-0.5"
                      onClick={() => { deleteComment(task.id, c.id); toast.info("댓글이 삭제됐어요"); }}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 입력 */}
            <div className="flex gap-2 items-center">
              <Input
                ref={commentInputRef}
                className="h-8 text-xs flex-1"
                placeholder="댓글을 입력하고 Enter..."
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0"
                disabled={!commentInput.trim()}
                onClick={handleAddComment}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="size-3.5 mr-1.5" /> 삭제
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim()}>저장</Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* 부스팅 상세 모달 */}
      {selectedBoosting && (
        <BoostingDetailModal
          boosting={selectedBoosting}
          open={!!selectedBoosting}
          onClose={() => setSelectedBoosting(null)}
        />
      )}

      {/* 회의 상세 모달 */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          open={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </Dialog>
  );
}
