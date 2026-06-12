"use client";

import { useState } from "react";
import { useTaskStore } from "@/store/tasks";
import { useMeetingStore } from "@/store/meetings";
import { useRoutineStore } from "@/store/routines";
import { useBoostingStore } from "@/store/boosting";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { TodayRoutines } from "@/components/dashboard/today-routines";
import { ActiveBoostings } from "@/components/dashboard/active-boostings";
import { UpcomingWeek } from "@/components/dashboard/upcoming-week";
import { WeeklyReport } from "@/components/dashboard/weekly-report";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getHoliday } from "@/lib/holidays";

export default function MainPage() {
  const { getDueToday, getOverdue } = useTaskStore();
  const { meetings } = useMeetingStore();
  const { getTodayRoutines } = useRoutineStore();
  const { getActive } = useBoostingStore();
  const [addingTask, setAddingTask] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const holiday = getHoliday(todayStr);

  const overdue = getOverdue();
  const remainingToday = getDueToday().filter(t => t.status !== "done").length;
  const todayMeetingCount = meetings.filter(m => m.date === todayStr).length;

  const todayRoutines = getTodayRoutines();
  const routineDone = todayRoutines.filter(r => r.completionHistory?.includes(todayStr)).length;

  const activeBoostingCount = getActive().length;

  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">오늘</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayLabel}
            {holiday && <span className="text-red-500 ml-1.5">· {holiday}</span>}
          </p>
        </div>
        <Button onClick={() => setAddingTask(true)}>
          <Plus className="size-4 mr-1.5" /> 업무 추가
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="오늘 할 일"
          value={remainingToday + overdue.length}
          sub={overdue.length > 0 ? `마감 지남 ${overdue.length}개 포함` : "마감일 기준"}
          color={overdue.length > 0 ? "red" : remainingToday > 0 ? "blue" : "default"}
        />
        <StatCard
          title="오늘 회의"
          value={todayMeetingCount}
          sub="예정 기준"
          color={todayMeetingCount > 0 ? "blue" : "default"}
        />
        <StatCard
          title="오늘 루틴"
          value={`${routineDone}/${todayRoutines.length}`}
          sub="완료"
          color={todayRoutines.length > 0 && routineDone === todayRoutines.length ? "green" : "default"}
        />
        <StatCard
          title="진행 중 부스팅"
          value={activeBoostingCount}
          sub="오늘 노출 중"
          color="default"
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 왼쪽 — 오늘 당장 */}
        <div className="space-y-4">
          <TodaySchedule />
          <TodayTasks />
        </div>

        {/* 오른쪽 — 루틴 / 부스팅 / 예정 */}
        <div className="space-y-4">
          <TodayRoutines />
          <ActiveBoostings />
          <UpcomingWeek />
        </div>
      </div>

      {/* 주간 리포트 */}
      <WeeklyReport />

      <TaskForm open={addingTask} onClose={() => setAddingTask(false)} />
    </div>
  );
}
