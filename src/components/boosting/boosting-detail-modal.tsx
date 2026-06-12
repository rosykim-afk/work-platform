"use client";

import { useEffect, useState } from "react";
import { Boosting, BoostingStatus } from "@/types";
import { useBoostingStore, EXPOSURE_SITES } from "@/store/boosting";
import { useProjectStore } from "@/store/projects";
import { useFolderStore } from "@/store/folders";
import { useTaskStore } from "@/store/tasks";
import { getProjectLabel } from "@/lib/project-label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2, Link2, X, Plus, CheckSquare, Zap } from "lucide-react";
import { BOOSTING_STATUS_LABEL, BOOSTING_STATUS_COLOR, TASK_STATUS_LABEL, TASK_STATUS_COLOR, siteColor } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: BoostingStatus[] = ["planned", "active", "completed", "cancelled"];

interface Props {
  boosting: Boosting;
  open: boolean;
  onClose: () => void;
}

export function BoostingDetailModal({ boosting, open, onClose }: Props) {
  const { updateBoosting, deleteBoosting } = useBoostingStore();
  const { projects } = useProjectStore();
  const { folders } = useFolderStore();
  const { tasks } = useTaskStore();

  const [title, setTitle]             = useState(boosting.title);
  const [exposureSite, setExposureSite] = useState(boosting.exposureSite);
  const [status, setStatus]           = useState<BoostingStatus>(boosting.status);
  const [startDate, setStartDate]     = useState(boosting.startDate);
  const [endDate, setEndDate]         = useState(boosting.endDate);
  const [startTime, setStartTime]     = useState(boosting.startTime ?? "");
  const [endTime, setEndTime]         = useState(boosting.endTime ?? "");
  const [projectId, setProjectId]     = useState(boosting.projectId ?? "");
  const [taskId, setTaskId]           = useState(boosting.taskId ?? "");
  const [notes, setNotes]             = useState(boosting.notes ?? "");
  const [linkingTask, setLinkingTask] = useState(false);

  // 모달이 열릴 때마다 boosting 기준으로 초기화
  // (상시 마운트라 useState 초기값은 최초 1회만 계산되기 때문)
  useEffect(() => {
    if (!open) return;
    setTitle(boosting.title);
    setExposureSite(boosting.exposureSite);
    setStatus(boosting.status);
    setStartDate(boosting.startDate);
    setEndDate(boosting.endDate);
    setStartTime(boosting.startTime ?? "");
    setEndTime(boosting.endTime ?? "");
    setProjectId(boosting.projectId ?? "");
    setTaskId(boosting.taskId ?? "");
    setNotes(boosting.notes ?? "");
    setLinkingTask(false);
  }, [open, boosting]);

  const selectedProject = projects.find(p => p.id === projectId);
  const linkedTask = tasks.find(t => t.id === taskId);

  // 연결 가능한 업무 (같은 프로젝트 우선, 전체 포함)
  const taskOptions = projectId
    ? [...tasks.filter(t => t.projectId === projectId), ...tasks.filter(t => t.projectId !== projectId && t.status !== "cancelled")]
    : tasks.filter(t => t.status !== "cancelled");

  function handleSave() {
    if (!title.trim()) return;
    if (startDate && endDate && endDate < startDate) return;
    updateBoosting(boosting.id, {
      title: title.trim(),
      exposureSite,
      status,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime:   endTime   || undefined,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      notes: notes || undefined,
    });
    toast.success("저장됐어요");
    onClose();
  }

  function handleDelete() {
    deleteBoosting(boosting.id);
    toast.error("부스팅이 삭제됐어요");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Zap className="size-3.5" />
            <span>부스팅</span>
          </div>
          <DialogTitle>
            <input
              className="w-full text-base font-semibold bg-transparent outline-none border-b border-transparent focus:border-border transition-colors pb-0.5"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="부스팅 제목"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 요약 그리드 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-muted/20 px-4 py-3">
            {/* 상태 */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">상태</p>
              <Select value={status} onValueChange={v => setStatus(v as BoostingStatus)}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                  <SelectValue>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", BOOSTING_STATUS_COLOR[status])}>
                      {BOOSTING_STATUS_LABEL[status]}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", BOOSTING_STATUS_COLOR[s])}>
                        {BOOSTING_STATUS_LABEL[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 노출지면 */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">노출지면</p>
              <Select value={exposureSite} onValueChange={v => setExposureSite(v ?? EXPOSURE_SITES[0])}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                  <SelectValue>
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: siteColor(exposureSite) }} />
                      {exposureSite}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EXPOSURE_SITES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full inline-block" style={{ backgroundColor: siteColor(s) }} />
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 기간 (시작 ~ 종료 + 시간 옵션) — 공용 DateDuringPicker */}
            <div className="col-span-2">
              <DateDuringPicker
                compact
                label="기간"
                startDate={startDate}
                endDate={endDate}
                startTime={startTime}
                endTime={endTime}
                onStartDate={setStartDate}
                onEndDate={setEndDate}
                onStartTime={setStartTime}
                onEndTime={setEndTime}
              />
            </div>

            {/* 프로젝트 */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">프로젝트</p>
              <Select value={projectId} onValueChange={v => setProjectId(v ?? "")}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                  <SelectValue>
                    {selectedProject ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="size-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: selectedProject.color }} />
                        <span className="truncate">{getProjectLabel(selectedProject, folders)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">없음</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {projects.map(p => (
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
          </div>

          <Separator />

          {/* 연결 업무 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Link2 className="size-3.5" /> 연결 업무
              </p>
              {!linkingTask && (
                <Button
                  size="sm" variant="ghost"
                  className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
                  onClick={() => setLinkingTask(true)}
                >
                  <Plus className="size-3" /> 연결
                </Button>
              )}
            </div>

            {/* 현재 연결된 업무 */}
            {linkedTask ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/20">
                <CheckSquare className="size-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{linkedTask.title}</p>
                  {linkedTask.status && (
                    <p className={cn("text-[10px] mt-0.5", TASK_STATUS_COLOR[linkedTask.status].replace("bg-", "text-").replace("-100", "-600"))}>
                      {TASK_STATUS_LABEL[linkedTask.status]}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setTaskId("")}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              !linkingTask && (
                <p className="text-xs text-muted-foreground py-1">연결된 업무가 없어요</p>
              )
            )}

            {/* 업무 선택 목록 */}
            {linkingTask && (
              <div className="rounded-md border bg-muted/10 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">업무 선택</span>
                  <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5" onClick={() => setLinkingTask(false)}>닫기</Button>
                </div>
                {taskOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-3">연결할 업무가 없어요</p>
                ) : (
                  <div className="max-h-44 overflow-y-auto divide-y">
                    {taskOptions.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setTaskId(t.id); setLinkingTask(false); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent/40 transition-colors text-left",
                          t.id === taskId && "bg-accent/30"
                        )}
                      >
                        <CheckSquare className="size-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{t.title}</p>
                          {t.projectId && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {getProjectLabel(projects.find(p => p.id === t.projectId)!, folders)}
                            </p>
                          )}
                        </div>
                        {t.status && (
                          <Badge variant="secondary" className={cn("text-[10px] h-4 px-1.5 shrink-0", TASK_STATUS_COLOR[t.status])}>
                            {TASK_STATUS_LABEL[t.status]}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 성과 메모 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">성과 메모</label>
            <Textarea
              placeholder="목표 수치, 성과 기록, 특이사항 등을 자유롭게 작성하세요"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-20 text-sm resize-none"
              rows={3}
            />
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
    </Dialog>
  );
}
