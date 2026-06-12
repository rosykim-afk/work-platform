"use client";

import { useTaskStore } from "@/store/tasks";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function getThisWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d.toISOString().slice(0, 10);
  });
}

const chartConfig = {
  done: { label: "완료", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export function WeeklyReport() {
  const { tasks } = useTaskStore();
  const weekDays = getThisWeekDays();
  const today = new Date().toISOString().slice(0, 10);

  const data = weekDays.map((date, i) => ({
    day: DAY_KO[i],
    done: tasks.filter(t => t.status === "done" && t.updatedAt.slice(0, 10) === date).length,
    isToday: date === today,
    isFuture: date > today,
  }));

  const totalDone = tasks.filter(t => t.status === "done").length;
  const totalTasks = tasks.filter(t => t.status !== "cancelled").length;
  const rate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">주간 리포트</p>
        <span className="text-xs text-muted-foreground">이번 주 완료 현황</span>
      </div>

      <ChartContainer config={chartConfig} className="h-28 w-full">
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="done"
            fill="var(--color-done)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ChartContainer>

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className="text-xs text-muted-foreground">전체 달성률</span>
        <span className="text-sm font-semibold">{totalDone}/{totalTasks} ({rate}%)</span>
      </div>
    </div>
  );
}
