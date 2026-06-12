import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Boosting, BoostingStatus } from "@/types";

function generateId() {
  return `boost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

export const EXPOSURE_SITES = [
  "메인 홈",
  "추천 영역",
  "검색 결과",
  "기획전",
  "팝업",
  "기타",
] as const;

interface BoostingStore {
  boostings: Boosting[];
  addBoosting: (data: Omit<Boosting, "id" | "createdAt" | "updatedAt">) => Boosting;
  updateBoosting: (id: string, data: Partial<Omit<Boosting, "id" | "createdAt">>) => void;
  deleteBoosting: (id: string) => void;
  setStatus: (id: string, status: BoostingStatus) => void;
  getByTask: (taskId: string) => Boosting[];
  getByMonth: (year: number, month: number) => Boosting[];
  getActive: () => Boosting[];
}

export const useBoostingStore = create<BoostingStore>()(
  persist(
    (set, get) => ({
      boostings: [],

      addBoosting: (data) => {
        const boosting: Boosting = {
          ...data,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boostings: [...s.boostings, boosting] }));
        return boosting;
      },

      updateBoosting: (id, data) => {
        set((s) => ({
          boostings: s.boostings.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: now() } : b
          ),
        }));
      },

      deleteBoosting: (id) => {
        set((s) => ({ boostings: s.boostings.filter((b) => b.id !== id) }));
      },

      setStatus: (id, status) => {
        get().updateBoosting(id, { status });
      },

      getByTask: (taskId) => {
        return get().boostings.filter((b) => b.taskId === taskId);
      },

      getByMonth: (year, month) => {
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const end = `${year}-${String(month).padStart(2, "0")}-31`;
        return get().boostings.filter(
          (b) => b.startDate <= end && b.endDate >= start
        );
      },

      getActive: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().boostings.filter(
          (b) => b.startDate <= today && b.endDate >= today && b.status !== "cancelled"
        );
      },
    }),
    { name: "boostings" }
  )
);
