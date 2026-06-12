"use client";

import { useState } from "react";
import { Boosting } from "@/types";
import { useBoostingStore, EXPOSURE_SITES } from "@/store/boosting";
import { useTaskStore } from "@/store/tasks";
import { useSelection } from "@/hooks/use-selection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectionBar } from "@/components/ui/selection-bar";
import { BoostingDetailModal } from "./boosting-detail-modal";
import { BoostingForm } from "./boosting-form";
import { BOOSTING_STATUS_LABEL, BOOSTING_STATUS_COLOR, siteColor } from "@/lib/constants";
import { cn, formatDateRange } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";

interface Props {
  boostings: Boosting[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddClick: () => void;
}

export function BoostingSideList({
  boostings,
  selectedId,
  onSelect,
  onAddClick,
}: Props) {
  const { deleteBoosting } = useBoostingStore();
  const { tasks } = useTaskStore();
  const [detailBoosting, setDetailBoosting] = useState<Boosting | null>(null);
  const [editingBoosting, setEditingBoosting] = useState<Boosting | null>(null);

  const sel = useSelection(boostings.map(b => b.id));

  function handleDeleteSelected() {
    sel.selected.forEach(id => deleteBoosting(id));
    toast.error(`${sel.count}개 부스팅이 삭제됐어요`);
    sel.clear();
  }

  const grouped = new Map<string, Boosting[]>();
  boostings.forEach(b => {
    if (!grouped.has(b.exposureSite)) grouped.set(b.exposureSite, []);
    grouped.get(b.exposureSite)!.push(b);
  });

  const sitesInUse = EXPOSURE_SITES.filter(s => grouped.has(s));

  return (
    <aside className="flex flex-col h-full border-r bg-muted/10">
      {/* 상단: 제목 + 등록 버튼 */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <span className="text-sm font-semibold">부스팅</span>
        <Button size="icon-xs" variant="ghost" onClick={onAddClick}>
          <Plus className="size-4" />
        </Button>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3 px-2">
        {boostings.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">부스팅이 없어요</p>
        )}

        {sitesInUse.map(site => {
          const items = grouped.get(site);
          if (!items?.length) return null;
          return (
            <div key={site}>
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: siteColor(site) }} />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{site}</span>
              </div>
              <div className="space-y-1">
                {items.map(b => {
                  const isItemSelected = sel.isSelected(b.id);
                  return (
                    <div
                      key={b.id}
                      className={cn(
                        "group rounded-md border px-2.5 py-2 cursor-pointer transition-colors",
                        isItemSelected
                          ? "bg-accent/70 border-accent-foreground/20"
                          : b.id === selectedId
                          ? "bg-accent border-accent-foreground/20"
                          : "bg-card hover:bg-accent/50 border-border"
                      )}
                      onClick={() => {
                        if (sel.hasSelection) { sel.toggle(b.id); return; }
                        onSelect(b.id === selectedId ? null : b.id);
                      }}
                    >
                      <div className="flex items-start gap-1.5">
                        {/* 체크박스 */}
                        <input
                          type="checkbox"
                          checked={isItemSelected}
                          onChange={() => sel.toggle(b.id)}
                          onClick={e => e.stopPropagation()}
                          className={cn(
                            "mt-0.5 size-3.5 rounded cursor-pointer accent-primary shrink-0 transition-opacity",
                            sel.hasSelection ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-medium leading-tight truncate flex-1">
                            {b.taskId ? (tasks.find(t => t.id === b.taskId)?.title ?? b.title) : b.title}
                          </p>
                            {/* 수정/삭제 버튼 — 선택 모드가 아닐 때만 */}
                            {!sel.hasSelection && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  className="p-0.5 rounded hover:bg-muted"
                                  title="수정"
                                  onClick={e => { e.stopPropagation(); setEditingBoosting(b); }}
                                >
                                  <Pencil className="size-3 text-muted-foreground" />
                                </button>
                                <button
                                  className="p-0.5 rounded hover:bg-red-50"
                                  title="삭제"
                                  onClick={e => { e.stopPropagation(); deleteBoosting(b.id); toast.error("삭제됐어요"); }}
                                >
                                  <Trash2 className="size-3 text-red-400" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Badge variant="secondary" className={cn("text-[10px] px-1 py-0", BOOSTING_STATUS_COLOR[b.status])}>
                              {BOOSTING_STATUS_LABEL[b.status]}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDateRange(b.startDate, b.endDate, b.startTime, b.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택 액션바 */}
      <SelectionBar
        count={sel.count}
        total={boostings.length}
        onSelectAll={sel.selectAll}
        onClear={sel.clear}
        onDelete={handleDeleteSelected}
      />

      {detailBoosting && (
        <BoostingDetailModal boosting={detailBoosting} open={!!detailBoosting} onClose={() => setDetailBoosting(null)} />
      )}
      {editingBoosting && (
        <BoostingForm open={!!editingBoosting} onClose={() => setEditingBoosting(null)} boosting={editingBoosting} />
      )}
    </aside>
  );
}
