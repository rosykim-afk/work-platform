import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, Status, Priority, TaskComment, SubTask } from "@/types";

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

interface TaskStore {
  tasks: Task[];
  addTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, data: Partial<Omit<Task, "id" | "createdAt">>) => void;
  deleteTask: (id: string) => void;
  setStatus: (id: string, status: Status) => void;
  addComment: (taskId: string, body: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  restoreTask: (task: Task) => void;
  addSubTask: (taskId: string, data: Omit<SubTask, "id">) => void;
  updateSubTask: (taskId: string, subId: string, data: Partial<SubTask>) => void;
  deleteSubTask: (taskId: string, subId: string) => void;
  getByProject: (projectId: string) => Task[];
  getDueToday: () => Task[];
  getUpcoming: (days?: number) => Task[];
  getOverdue: () => Task[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (data) => {
        const task: Task = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, data) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: now() } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      setStatus: (id, status) => {
        get().updateTask(id, { status });
      },

      addComment: (taskId, body) => {
        const comment: TaskComment = {
          id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          body,
          createdAt: now(),
        };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, comments: [...(t.comments ?? []), comment], updatedAt: now() }
              : t
          ),
        }));
      },

      restoreTask: (task) => {
        set((s) => {
          if (s.tasks.find(t => t.id === task.id)) return s;
          return { tasks: [...s.tasks, task] };
        });
      },

      addSubTask: (taskId, data) => {
        const sub: SubTask = {
          ...data,
          id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks ?? []), sub], updatedAt: now() }
              : t
          ),
        }));
      },

      updateSubTask: (taskId, subId, data) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks ?? []).map((s) => s.id === subId ? { ...s, ...data } : s),
                  updatedAt: now(),
                }
              : t
          ),
        }));
      },

      deleteSubTask: (taskId, subId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subId), updatedAt: now() }
              : t
          ),
        }));
      },

      deleteComment: (taskId, commentId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, comments: (t.comments ?? []).filter((c) => c.id !== commentId), updatedAt: now() }
              : t
          ),
        }));
      },

      getByProject: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId);
      },

      getDueToday: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().tasks.filter(
          (t) => t.dueDate === today && t.status !== "cancelled"
        );
      },

      getUpcoming: (days = 7) => {
        const today = new Date();
        const limit = new Date(today);
        limit.setDate(today.getDate() + days);
        const todayStr = today.toISOString().slice(0, 10);
        const limitStr = limit.toISOString().slice(0, 10);
        return get().tasks.filter(
          (t) =>
            t.dueDate &&
            t.dueDate > todayStr &&
            t.dueDate <= limitStr &&
            t.status !== "done" &&
            t.status !== "cancelled"
        );
      },

      getOverdue: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().tasks.filter(
          (t) =>
            t.dueDate &&
            t.dueDate < today &&
            t.status !== "done" &&
            t.status !== "cancelled"
        );
      },
    }),
    { name: "tasks" }
  )
);
