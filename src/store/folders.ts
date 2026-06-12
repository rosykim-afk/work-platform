import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Folder } from "@/types";

function generateId() {
  return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

interface FolderStore {
  folders: Folder[];
  addFolder: (title: string) => Folder;
  updateFolder: (id: string, title: string) => void;
  deleteFolder: (id: string) => void;
}

export const useFolderStore = create<FolderStore>()(
  persist(
    (set) => ({
      folders: [],

      addFolder: (title) => {
        const folder: Folder = { id: generateId(), title, createdAt: now(), updatedAt: now() };
        set((s) => ({ folders: [...s.folders, folder] }));
        return folder;
      },

      updateFolder: (id, title) => {
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === id ? { ...f, title, updatedAt: now() } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));
      },
    }),
    { name: "folders" }
  )
);
