"use client";

import { useState } from "react";
import { Boosting } from "@/types";
import { useBoostingStore } from "@/store/boosting";
import { useTaskStore } from "@/store/tasks";
import { useProjectStore } from "@/store/projects";
import { BoostingForm } from "./boosting-form";
import { BoostingDetailModal } from "./boosting-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { BOOSTING_STATUS_LABEL, BOOSTING_STATUS_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function BoostingRow({ b, indent = false }: { b: Boosting; indent?: boolean }) {
  const { deleteBoosting, setStatus } = useBoostingStore();
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const duration =
    Math.round(
      (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return (
    <>
      <TableRow
        className={cn("group cursor-pointer hover:bg-accent/40", indent && "bg-muted/10")}
        onClick={() => setDetailOpen(true)}
      >
        <TableCell className={cn("font-medium", indent && "pl-8 text-muted-foreground")}>
          {indent ? b.exposureSite : b.title}
        </TableCell>
        <TableCell>
          {!indent && b.exposureSite}
          {indent && (
            <Badge variant="secondary" className={cn("text-xs", BOOSTING_STATUS_COLOR[b.status])}>
              {BOOSTING_STATUS_LABEL[b.status]}
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {!indent && (
            <Badge variant="secondary" className={cn("text-xs", BOOSTING_STATUS_COLOR[b.status])}>
              {BOOSTING_STATUS_LABEL[b.status]}
            </Badge>
          )}
          {indent && <span className="text-xs text-muted-foreground">{b.startDate}</span>}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {indent ? b.endDate : b.startDate}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {indent ? `${duration}일` : b.endDate}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {!indent && `${duration}일`}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()} />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
                <Pencil className="size-4 mr-2" /> 수정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStatus(b.id, "active"); toast.success("진행 중으로 변경됐어요"); }}>→ 진행 중</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStatus(b.id, "completed"); toast.success("완료 처리됐어요"); }}>→ 완료</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStatus(b.id, "cancelled"); toast.info("취소됐어요"); }}>→ 취소</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={(e) => {
                e.stopPropagation();
                deleteBoosting(b.id);
                toast.error("부스팅이 삭제됐어요");
              }}>
                <Trash2 className="size-4 mr-2" /> 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <BoostingForm open={editing} onClose={() => setEditing(false)} boosting={b} />
      <BoostingDetailModal boosting={b} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}

export function BoostingList({ boostings }: { boostings: Boosting[] }) {
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  if (boostings.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">해당하는 부스팅이 없어요</p>;
  }

  // 업무 기준 그룹핑
  const taskGroups = new Map<string, Boosting[]>();
  const standalone: Boosting[] = [];

  boostings.forEach(b => {
    if (b.taskId) {
      if (!taskGroups.has(b.taskId)) taskGroups.set(b.taskId, []);
      taskGroups.get(b.taskId)!.push(b);
    } else {
      standalone.push(b);
    }
  });

  function toggleGroup(id: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>업무 / 노출지면</TableHead>
            <TableHead>지면</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>시작일</TableHead>
            <TableHead>종료일</TableHead>
            <TableHead>기간</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* 업무 그룹 */}
          {Array.from(taskGroups.entries()).map(([taskId, groupBoostings]) => {
            const task = tasks.find(t => t.id === taskId);
            const project = projects.find(p => p.id === task?.projectId);
            const isCollapsed = collapsedGroups.has(taskId);

            return (
              <>
                {/* 그룹 헤더 행 */}
                <TableRow
                  key={`group-${taskId}`}
                  className="bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleGroup(taskId)}
                >
                  <TableCell colSpan={6} className="py-2">
                    <div className="flex items-center gap-2">
                      {isCollapsed
                        ? <ChevronRight className="size-3.5 text-muted-foreground" />
                        : <ChevronDown className="size-3.5 text-muted-foreground" />}
                      {project && (
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      )}
                      <span className="text-xs font-semibold">{task?.title ?? "업무"}</span>
                      {project && (
                        <span className="text-xs text-muted-foreground">· {project.title}</span>
                      )}
                      <Badge variant="secondary" className="text-xs ml-1">{groupBoostings.length}개 지면</Badge>
                    </div>
                  </TableCell>
                  <TableCell />
                </TableRow>

                {/* 지면 행들 */}
                {!isCollapsed && groupBoostings.map(b => (
                  <BoostingRow key={b.id} b={b} indent />
                ))}
              </>
            );
          })}

          {/* 독립 부스팅 */}
          {standalone.map(b => <BoostingRow key={b.id} b={b} />)}
        </TableBody>
      </Table>
    </div>
  );
}
