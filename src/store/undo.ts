import { create } from "zustand";

export interface UndoEntry {
  label: string;
  undo: () => void;
}

interface UndoStore {
  stack: UndoEntry[];
  push: (entry: UndoEntry) => void;
  pop: () => UndoEntry | undefined;
  clear: () => void;
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  stack: [],

  push: (entry) =>
    set((s) => ({ stack: [...s.stack.slice(-19), entry] })), // 최대 20개

  pop: () => {
    const { stack } = get();
    if (!stack.length) return undefined;
    const last = stack[stack.length - 1];
    set({ stack: stack.slice(0, -1) });
    return last;
  },

  clear: () => set({ stack: [] }),
}));
