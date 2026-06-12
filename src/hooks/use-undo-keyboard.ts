"use client";

import { useEffect } from "react";
import { useUndoStore } from "@/store/undo";
import { toast } from "sonner";

/** 레이아웃에 한 번만 마운트하면 전역 Cmd+Z / Ctrl+Z 처리 */
export function useUndoKeyboard() {
  const { pop } = useUndoStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta || e.key !== "z" || e.shiftKey) return;

      // 입력 중인 경우 브라우저 기본 동작 허용
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;

      e.preventDefault();
      const entry = pop();
      if (!entry) {
        toast.info("더 이상 되돌릴 수 없어요");
        return;
      }
      entry.undo();
      toast.success(`되돌렸어요: ${entry.label}`);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pop]);
}
