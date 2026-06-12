"use client";

import { useEffect, useState } from "react";
import { Boosting, BoostingStatus } from "@/types";
import { useBoostingStore, EXPOSURE_SITES } from "@/store/boosting";
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
import { BOOSTING_STATUS_LABEL } from "@/lib/constants";

const STATUS_OPTIONS: BoostingStatus[] = ["planned", "active", "completed", "cancelled"];

interface Props {
  open: boolean;
  onClose: () => void;
  boosting?: Boosting;
  defaultProjectId?: string;
}

export function BoostingForm({ open, onClose, boosting, defaultProjectId }: Props) {
  const { addBoosting, updateBoosting } = useBoostingStore();
  const { projects } = useProjectStore();
  const { folders } = useFolderStore();

  const [title,      setTitle     ] = useState(boosting?.title      ?? "");
  const [exposureSite,setExposureSite] = useState(boosting?.exposureSite ?? EXPOSURE_SITES[0]);
  const [startDate,  setStartDate ] = useState(boosting?.startDate  ?? "");
  const [endDate,    setEndDate   ] = useState(boosting?.endDate    ?? "");
  const [startTime,  setStartTime ] = useState(boosting?.startTime  ?? "");
  const [endTime,    setEndTime   ] = useState(boosting?.endTime    ?? "");
  const [status,     setStatus    ] = useState<BoostingStatus | "">(boosting?.status ?? "");
  const [projectId,  setProjectId ] = useState(boosting?.projectId  ?? defaultProjectId ?? "");
  const [notes,      setNotes     ] = useState(boosting?.notes      ?? "");

  // 다이얼로그가 열릴 때마다 props 기준으로 초기화
  // (폼이 상시 마운트라 useState 초기값은 최초 1회만 계산되기 때문)
  useEffect(() => {
    if (!open) return;
    setTitle(boosting?.title ?? "");
    setExposureSite(boosting?.exposureSite ?? EXPOSURE_SITES[0]);
    setStartDate(boosting?.startDate ?? "");
    setEndDate(boosting?.endDate ?? "");
    setStartTime(boosting?.startTime ?? "");
    setEndTime(boosting?.endTime ?? "");
    setStatus(boosting?.status ?? "");
    setProjectId(boosting?.projectId ?? defaultProjectId ?? "");
    setNotes(boosting?.notes ?? "");
  }, [open, boosting, defaultProjectId]);

  const selectedProject = projects.find(p => p.id === projectId);

  function handleSubmit() {
    if (!title.trim()) return;
    if (startDate && endDate && endDate < startDate) return;
    const data = {
      title: title.trim(),
      exposureSite,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime:   endTime   || undefined,
      status:   (status || "planned") as BoostingStatus,
      projectId: projectId || undefined,
      notes:     notes     || undefined,
    };
    if (boosting) {
      updateBoosting(boosting.id, data);
    } else {
      addBoosting(data);
    }
    onClose();
  }

  const isValid = title.trim() && (!startDate || !endDate || endDate >= startDate);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{boosting ? "부스팅 수정" : "새 부스팅 등록"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 제목 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">제목 *</label>
            <Input placeholder="부스팅 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* 노출지면 + 진행도 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">노출지면 *</label>
              <Select value={exposureSite} onValueChange={(v) => setExposureSite(v ?? EXPOSURE_SITES[0])}>
                <SelectTrigger>
                  <SelectValue><span>{exposureSite}</span></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EXPOSURE_SITES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">진행도</label>
              <Select value={status} onValueChange={(v) => setStatus(v as BoostingStatus | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{BOOSTING_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 기간 (during) + 시간 옵션 */}
          <DateDuringPicker
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

          {/* 메모 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">메모</label>
            <Textarea placeholder="메모 (선택)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {boosting ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
