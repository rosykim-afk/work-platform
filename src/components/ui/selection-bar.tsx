"use client";

import { Trash2, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
  className?: string;
}

export function SelectionBar({ count, total, onSelectAll, onClear, onDelete, className }: Props) {
  if (count === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
      "flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border",
      "bg-background/95 backdrop-blur-sm",
      className
    )}>
      <span className="text-sm font-medium text-foreground">
        {count}개 선택됨
      </span>
      <div className="w-px h-4 bg-border mx-1" />
      {count < total && (
        <Button variant="ghost" size="xs" onClick={onSelectAll} className="gap-1.5">
          <CheckSquare className="size-3.5" />
          전체 선택 ({total})
        </Button>
      )}
      <Button
        variant="ghost"
        size="xs"
        className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
        삭제
      </Button>
      <button
        onClick={onClear}
        className="ml-1 p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
