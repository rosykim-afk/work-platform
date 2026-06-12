import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project, ProjectStatus } from "@/types";

function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

const DEFAULT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

interface ProjectStore {
  projects: Project[];
  addProject: (data: Omit<Project, "id" | "taskIds" | "createdAt" | "updatedAt">) => Project;
  updateProject: (id: string, data: Partial<Omit<Project, "id" | "createdAt">>) => void;
  deleteProject: (id: string) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
  addTaskId: (projectId: string, taskId: string) => void;
  removeTaskId: (projectId: string, taskId: string) => void;
  getNextColor: () => string;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (data) => {
        const project: Project = {
          ...data,
          id: generateId(),
          taskIds: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, data) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      },

      setStatus: (id, status) => {
        get().updateProject(id, { status });
      },

      addTaskId: (projectId, taskId) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId && !p.taskIds.includes(taskId)
              ? { ...p, taskIds: [...p.taskIds, taskId], updatedAt: now() }
              : p
          ),
        }));
      },

      removeTaskId: (projectId, taskId) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, taskIds: p.taskIds.filter((id) => id !== taskId), updatedAt: now() }
              : p
          ),
        }));
      },

      getNextColor: () => {
        const used = get().projects.map((p) => p.color);
        return DEFAULT_COLORS.find((c) => !used.includes(c)) ?? DEFAULT_COLORS[0];
      },
    }),
    { name: "projects" }
  )
);
