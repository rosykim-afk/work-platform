"use client";

import { useEffect, useState } from "react";
import { Project, ProjectStatus } from "@/types";
import { useProjectStore } from "@/store/projects";
import { useFolderStore } from "@/store/folders";
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
import { PROJECT_STATUS_LABEL } from "@/lib/constants";
import { toast } from "sonner";

const STATUS_OPTIONS: ProjectStatus[] = ["active", "on_hold", "completed", "cancelled"];

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
  defaultFolderId?: string;
}

export function ProjectForm({ open, onClose, project, defaultFolderId }: Props) {
  const { addProject, updateProject, getNextColor } = useProjectStore();
  const { folders } = useFolderStore();

  const [title,      setTitle     ] = useState(project?.title       ?? "");
  const [description,setDescription] = useState(project?.description ?? "");
  const [status,     setStatus    ] = useState<ProjectStatus | "">(project?.status ?? "");
  const [color,      setColor     ] = useState(project?.color       ?? getNextColor());
  const [startDate,  setStartDate ] = useState(project?.startDate   ?? "");
  const [endDate,    setEndDate   ] = useState(project?.endDate     ?? "");
  const [folderId,   setFolderId  ] = useState(project?.folderId    ?? defaultFolderId ?? "");

  // 다이얼로그가 열릴 때마다 props 기준으로 초기화
  // (폼이 상시 마운트라 useState 초기값은 최초 1회만 계산되기 때문)
  useEffect(() => {
    if (!open) return;
    setTitle(project?.title ?? "");
    setDescription(project?.description ?? "");
    setStatus(project?.status ?? "");
    setColor(project?.color ?? getNextColor());
    setStartDate(project?.startDate ?? "");
    setEndDate(project?.endDate ?? "");
    setFolderId(project?.folderId ?? defaultFolderId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project, defaultFolderId]);

  const selectedFolder = folders.find(f => f.id === folderId);

  function handleSubmit() {
    if (!title.trim()) return;
    const data = {
      title,
      description,
      status:   (status || "active") as ProjectStatus,
      color,
      startDate,
      endDate,
      folderId: folderId || undefined,
    };
    if (project) {
      updateProject(project.id, data);
      toast.success("프로젝트가 수정됐어요");
    } else {
      addProject(data);
      toast.success("프로젝트가 만들어졌어요");
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "프로젝트 수정" : "새 프로젝트"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 프로젝트명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">프로젝트명 *</label>
            <Input placeholder="프로젝트명 입력" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">설명</label>
            <Textarea placeholder="프로젝트 설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* 폴더 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">폴더</label>
            <Select value={folderId} onValueChange={(v) => setFolderId(v ?? "")}>
              <SelectTrigger>
                <SelectValue>
                  {selectedFolder
                    ? <span>{selectedFolder.title}</span>
                    : <span className="text-muted-foreground">폴더 없음</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">폴더 없음</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기간 (during) */}
          <DateDuringPicker
            label="기간"
            startDate={startDate}
            endDate={endDate}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
          />

          {/* 진행도 — 선택사항 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">진행도</label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | "")}>
              <SelectTrigger>
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">선택 안 함</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 색상 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">색상</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? c : "transparent",
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {project ? "저장" : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
