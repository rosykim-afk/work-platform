import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Routine } from "@/types";

function generateId() {
  return `routine_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

interface RoutineStore {
  routines: Routine[];
  addRoutine: (data: Omit<Routine, "id" | "createdAt" | "updatedAt">) => Routine;
  updateRoutine: (id: string, data: Partial<Omit<Routine, "id" | "createdAt">>) => void;
  deleteRoutine: (id: string) => void;
  complete: (id: string) => void;
  toggle: (id: string) => void;
  getTodayRoutines: () => Routine[];
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],

      addRoutine: (data) => {
        const routine: Routine = {
          ...data,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ routines: [...s.routines, routine] }));
        return routine;
      },

      updateRoutine: (id, data) => {
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: now() } : r
          ),
        }));
      },

      deleteRoutine: (id) => {
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }));
      },

      complete: (id) => {
        const today = new Date().toISOString().slice(0, 10);
        const routine = get().routines.find(r => r.id === id);
        if (!routine) return;
        const history = routine.completionHistory ?? [];
        const newHistory = history.includes(today) ? history : [...history, today];
        get().updateRoutine(id, { lastCompletedAt: now(), completionHistory: newHistory });
      },

      toggle: (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (routine) get().updateRoutine(id, { isActive: !routine.isActive });
      },

      getTodayRoutines: () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const dayOfMonth = today.getDate();

        return get().routines.filter((r) => {
          if (!r.isActive) return false;
          if (r.frequency === "daily") return true;
          if (r.frequency === "weekly") return r.daysOfWeek?.includes(dayOfWeek);
          if (r.frequency === "monthly") return r.dayOfMonth === dayOfMonth;
          return false;
        });
      },
    }),
    { name: "routines" }
  )
);
