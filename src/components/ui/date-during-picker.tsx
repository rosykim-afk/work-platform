"use client";

/**
 * DateDuringPicker
 * ─────────────────
 * 기간(during) 스타일 날짜 선택 컴포넌트.
 *
 * - 범위 모드: [시작일] ~ [종료일]   (onEndDate 전달 시)
 * - 단일 모드: [날짜]                (onEndDate 미전달 시)
 * - 시작일 == 종료일이면 종료일 입력이 흐릿하게 표시됨 ("당일" 처리)
 * - 시간 토글 버튼으로 옵션 시간 입력을 펼침/접음
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateDuringPickerProps {
  /** 섹션 라벨 */
  label?: string;
  /** 시작일 / 단일 날짜 (YYYY-MM-DD) */
  startDate: string;
  /** 종료일 — 전달하면 범위 모드, undefined면 단일 날짜 모드 */
  endDate?: string;
  /** 시작 시간 (HH:MM) */
  startTime?: string;
  /** 종료 시간 (HH:MM) */
  endTime?: string;
  onStartDate: (v: string) => void;
  /** 범위 모드에서 종료일 콜백 */
  onEndDate?: (v: string) => void;
  /** 전달하면 시간 토글 버튼 노출 */
  onStartTime?: (v: string) => void;
  /** 전달하면 종료 시간 입력 노출 */
  onEndTime?: (v: string) => void;
  /** 상세 모달 요약 그리드용 컴팩트 스타일 */
  compact?: boolean;
  className?: string;
}

export function DateDuringPicker({
  label = "기간",
  startDate,
  endDate,
  startTime = "",
  endTime = "",
  onStartDate,
  onEndDate,
  onStartTime,
  onEndTime,
  compact = false,
  className,
}: DateDuringPickerProps) {
  const isRange      = onEndDate !== undefined;
  const hasTimeProp  = onStartTime !== undefined;
  // 시간 값이 있으면 항상 펼침 — 외부에서 값이 리셋돼도 표시가 따라가도록 파생값 사용
  const [timeOpened, setTimeOpened] = useState(false);
  const showTime = timeOpened || !!(startTime || endTime);

  // 시작일 == 종료일 → "당일" 처리
  const isSameDay = isRange && !!startDate && !!endDate && startDate === endDate;

  // 기간 일수 (양쪽 날짜가 모두 있을 때)
  const durationDays =
    isRange && startDate && endDate && endDate >= startDate
      ? Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1
      : null;

  const inputCls = compact
    ? "h-7 text-xs border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 w-fit"
    : "flex-1";

  function toggleTime() {
    if (showTime) {
      onStartTime?.("");
      onEndTime?.("");
      setTimeOpened(false);
    } else {
      setTimeOpened(true);
    }
  }

  return (
    <div className={cn(compact ? "space-y-1" : "space-y-2", className)}>
      {/* 헤더: 라벨 + 기간일수 + 시간 토글 */}
      <div className="flex items-center justify-between">
        {label && (
          <label
            className={
              compact
                ? "text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                : "text-sm font-medium"
            }
          >
            {label}
            {durationDays != null && (
              <span className="font-normal text-muted-foreground"> ({durationDays}일)</span>
            )}
          </label>
        )}
        {hasTimeProp && (
          <button
            type="button"
            onClick={toggleTime}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
              showTime
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Clock className="size-3" />
            {showTime ? "시간 제거" : "시간 추가"}
          </button>
        )}
      </div>

      {/* 날짜 입력 */}
      <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")}>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDate(e.target.value)}
          className={inputCls}
        />
        {isRange && (
          <>
            <span
              className={cn(
                "shrink-0 text-sm text-muted-foreground select-none transition-opacity",
                isSameDay ? "opacity-20" : "opacity-100",
              )}
            >
              ~
            </span>
            <Input
              type="date"
              value={endDate ?? ""}
              min={startDate || undefined}
              onChange={(e) => onEndDate?.(e.target.value)}
              className={cn(
                inputCls,
                "transition-opacity",
                isSameDay ? "opacity-40" : "opacity-100",
              )}
            />
          </>
        )}
      </div>

      {/* 당일 안내 */}
      {isSameDay && (
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          시작일과 종료일이 같아 당일 일정으로 표기됩니다
        </p>
      )}

      {/* 시간 입력 */}
      {showTime && (
        <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")}>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => onStartTime?.(e.target.value)}
            className={inputCls}
            placeholder="시작 시간"
          />
          {/* 종료 시간: onEndTime 콜백이 있을 때만 */}
          {onEndTime && (
            <>
              <span className="shrink-0 text-sm text-muted-foreground select-none">~</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => onEndTime(e.target.value)}
                className={inputCls}
                placeholder="종료 시간"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
