"use client";

import { useEffect, useState } from "react";
import { Task, Status, Priority } from "@/types";
import { useTaskStore } from "@/store/tasks";
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
import { TASK_STATUS_LABEL, PRIORITY_LABEL } from "@/lib/constants";
import { toast } from "sonner";

const STATUS_OPTIONS: Status[] = ["todo", "in_progress", "done", "cancelled"];
const PRIORITY_OPTIONS: Priority[] = ["high", "medium", "low"];

interface Props {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultProjectId?: string;
  defaultDueDate?: string;
}

export function TaskForm({ open, onClose, task, defaultProjectId, defaultDueDate }: Props) {
  const { addTask, updateTask } = useTaskStore();
  const { addTaskId, removeTaskId, projects } = useProjectStore();
  const { folders } = useFolderStore();

  const [title,     setTitle    ] = useState(task?.title       ?? "");
  const [description,setDescription] = useState(task?.description ?? "");
  const [status,    setStatus   ] = useState<Status | "">(task?.status ?? "");
  const [priority,  setPriority ] = useState<Priority | "">(task?.priority ?? "");
  const [startDate, setStartDate] = useState(task?.startDate ?? "");
  const [dueDate,   setDueDate  ] = useState(task?.dueDate  ?? defaultDueDate ?? "");
  const [dueTime,   setDueTime  ] = useState(task?.dueTime  ?? "");
  const [projectId, setProjectId] = useState(task?.projectId ?? defaultProjectId ?? "");

  // 다이얼로그가 열릴 때마다 props 기준으로 초기화
  // (폼이 상시 마운트라 useState 초기값은 최초 1회만 계산되기 때문)
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? "");
    setPriority(task?.priority ?? "");
    setStartDate(task?.startDate ?? "");
    setDueDate(task?.dueDate ?? defaultDueDate ?? "");
    setDueTime(task?.dueTime ?? "");
    setProjectId(task?.projectId ?? defaultProjectId ?? "");
  }, [open, task, defaultProjectId, defaultDueDate]);

  const selectedProject = projects.find(p => p.id === projectId);

  function handleSubmit() {
    if (!title.trim()) return;

    // 마감일을 비우고 시작일만 고르면 그 날이 마감일(하루짜리)
    // 시작일 == 마감일이면 단일 날짜로 저장 (startDate 생략)
    const end   = dueDate || startDate;
    const start = startDate && end && startDate < end ? startDate : undefined;

    const payload = {
      title,
      description,
      status:    (status    || "todo")   as Status,
      priority:  (priority  || undefined) as Priority | undefined,
      startDate: start,
      dueDate:   end       || undefined,
      dueTime:   dueTime   || undefined,
      projectId: projectId || undefined,
    };

    if (task) {
      const prevProjectId = task.projectId;
      updateTask(task.id, payload);
      if (prevProjectId && prevProjectId !== projectId) removeTaskId(prevProjectId, task.id);
      if (projectId && projectId !== prevProjectId) addTaskId(projectId, task.id);
      toast.success("업무가 수정됐어요");
    } else {
      const newTask = addTask(payload);
      if (projectId) addTaskId(projectId, newTask.id);
      toast.success("업무가 추가됐어요");
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "업무 수정" : "새 업무"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 업무명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">업무명 *</label>
            <Input
              placeholder="업무명 입력"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">설명</label>
            <Textarea
              placeholder="업무 설명 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* 상태 + 우선순위 — 둘 다 선택사항 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">진행도</label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">중요도</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 기간 (시작일 ~ 마감일) + 시간 (옵션) — 하루만 고르면 당일 표기 */}
          <DateDuringPicker
            label="기간"
            startDate={startDate}
            endDate={dueDate}
            startTime={dueTime}
            onStartDate={setStartDate}
            onEndDate={setDueDate}
            onStartTime={setDueTime}
          />

          {/* 프로젝트 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">프로젝트</label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
              <SelectTrigger>
                <SelectValue>
                  {selectedProject ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: selectedProject.color }} />
                      <span className="truncate">{getProjectLabel(selectedProject, folders)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">프로젝트 선택 (선택)</span>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !!(startDate && dueDate && dueDate < startDate)}
          >
            {task ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
