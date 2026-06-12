"use client";

import { useState } from "react";
import Link from "next/link";
import { Boosting } from "@/types";
import { useBoostingStore } from "@/store/boosting";
import { BoostingDetailModal } from "@/components/boosting/boosting-detail-modal";
import { Zap, ChevronRight } from "lucide-react";
import { siteColor } from "@/lib/constants";

export function ActiveBoostings() {
  const { getActive } = useBoostingStore();
  const [selected, setSelected] = useState<Boosting | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  // 종료 임박 순
  const active = [...getActive()].sort((a, b) => a.endDate.localeCompare(b.endDate));

  function dDay(endDate: string): string {
    const diff = Math.round(
      (new Date(endDate + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000
    );
    return diff === 0 ? "오늘 종료" : `D-${diff}`;
  }

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">진행 중 부스팅</span>
            {active.length > 0 && <span className="text-xs text-muted-foreground">{active.length}건</span>}
          </div>
          <Link href="/boosting" className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            전체 보기 <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="p-3 space-y-2">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">진행 중인 부스팅이 없어요</p>
          ) : (
            active.map(b => {
              const dday = dDay(b.endDate);
              const urgent = dday === "오늘 종료" || dday === "D-1";
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => setSelected(b)}
                >
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: siteColor(b.exposureSite) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.exposureSite} · ~{b.endDate.slice(5).replace("-", "/")}
                    </p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${urgent ? "text-red-500" : "text-muted-foreground"}`}>
                    {dday}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selected && (
        <BoostingDetailModal boosting={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
