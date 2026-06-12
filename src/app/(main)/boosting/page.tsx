"use client";

import { useState } from "react";
import { useBoostingStore, EXPOSURE_SITES } from "@/store/boosting";
import { BoostingForm } from "@/components/boosting/boosting-form";
import { BoostingTimeline } from "@/components/boosting/boosting-timeline";
import { BoostingCalendar } from "@/components/boosting/boosting-calendar";
import { BoostingSideList } from "@/components/boosting/boosting-side-list";
import { BoostingDetailModal } from "@/components/boosting/boosting-detail-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteColor } from "@/lib/constants";
import { Boosting } from "@/types";

export default function BoostingPage() {
  const { boostings } = useBoostingStore();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [siteFilter, setSiteFilter] = useState<string>("all");

  const [creating, setCreating]       = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [detailBoosting, setDetailBoosting] = useState<Boosting | null>(null);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStr = `${year}-${pad(month)}`;

  // 이번 달 범위에 걸치는 것만 (캘린더/타임라인용)
  const monthFiltered = boostings.filter(b =>
    b.startDate <= `${monthStr}-31` && b.endDate >= `${monthStr}-01`
  );

  // 달력/타임라인용: 지면 필터 적용
  const viewBoostings = siteFilter === "all"
    ? monthFiltered
    : monthFiltered.filter(b => b.exposureSite === siteFilter);

  // 사이드 목록에 존재하는 지면 (전체 부스팅 기준)
  const activeSites = EXPOSURE_SITES.filter(s => boostings.some(b => b.exposureSite === s));

  const selectedBoosting = selectedId ? boostings.find(b => b.id === selectedId) ?? null : null;

  const activeCount  = boostings.filter(b => b.status === "active").length;
  const plannedCount = boostings.filter(b => b.status === "planned").length;

  return (
    <div className="flex h-[calc(100vh-3rem-48px)] -m-6 overflow-hidden">
      {/* ── 왼쪽: 목록 패널 ── */}
      <div className="w-56 shrink-0 flex flex-col overflow-hidden">
        <BoostingSideList
          boostings={boostings}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (id) {
              const b = boostings.find(x => x.id === id);
              if (b) setDetailBoosting(b);
            }
          }}
          onAddClick={() => setCreating(true)}
        />
      </div>

      {/* ── 오른쪽: 메인 영역 ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center gap-4 px-5 py-3 border-b shrink-0 flex-wrap">
          {/* 제목 + 월 네비 */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold whitespace-nowrap">
              {year}년 {month}월
            </h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              진행 중 {activeCount}개 · 예정 {plannedCount}개
            </p>
            <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* 탭 */}
        <Tabs defaultValue="calendar" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-3 shrink-0 flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="calendar">월별</TabsTrigger>
              <TabsTrigger value="timeline">타임라인</TabsTrigger>
            </TabsList>
            {/* 지면 필터 */}
            <ToggleGroup
              value={[siteFilter]}
              onValueChange={(v) => setSiteFilter(v[v.length - 1] ?? "all")}
            >
              <ToggleGroupItem value="all" size="sm" className="text-xs px-2 gap-1">
                <span className="size-1.5 rounded-full shrink-0 bg-slate-400" />
                전체
              </ToggleGroupItem>
              {activeSites.map(s => (
                <ToggleGroupItem key={s} value={s} size="sm" className="text-xs px-2 gap-1">
                  <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: siteColor(s) }} />
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <TabsContent value="calendar" className="flex-1 overflow-y-auto px-5 pb-5 mt-3">
            <BoostingCalendar
              boostings={viewBoostings}
              year={year}
              month={month}
              selectedId={selectedId}
              onSelect={(b) => {
                setSelectedId(b.id === selectedId ? null : b.id);
                setDetailBoosting(b);
              }}
            />
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-y-auto px-5 pb-5 mt-3">
            <BoostingTimeline
              boostings={viewBoostings}
              year={year}
              month={month}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 폼 / 상세 모달 */}
      <BoostingForm open={creating} onClose={() => setCreating(false)} />
      {detailBoosting && (
        <BoostingDetailModal
          boosting={detailBoosting}
          open={!!detailBoosting}
          onClose={() => { setDetailBoosting(null); setSelectedId(null); }}
        />
      )}
    </div>
  );
}
