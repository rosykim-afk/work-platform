import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Meeting } from "@/types";

function generateId() {
  return `meeting_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

interface MeetingStore {
  meetings: Meeting[];
  addMeeting: (data: Omit<Meeting, "id" | "createdAt" | "updatedAt">) => Meeting;
  updateMeeting: (id: string, data: Partial<Omit<Meeting, "id" | "createdAt">>) => void;
  deleteMeeting: (id: string) => void;
  restoreMeeting: (meeting: Meeting) => void;
  getByDate: (date: string) => Meeting[];
  getByMonth: (year: number, month: number) => Meeting[];
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: [],

      addMeeting: (data) => {
        const meeting: Meeting = {
          ...data,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ meetings: [...s.meetings, meeting] }));
        return meeting;
      },

      updateMeeting: (id, data) => {
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: now() } : m
          ),
        }));
      },

      restoreMeeting: (meeting) => {
        set((s) => {
          if (s.meetings.find(m => m.id === meeting.id)) return s;
          return { meetings: [...s.meetings, meeting] };
        });
      },

      deleteMeeting: (id) => {
        set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) }));
      },

      getByDate: (date) => {
        return get().meetings.filter((m) => m.date === date);
      },

      getByMonth: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, "0")}`;
        return get().meetings.filter((m) => m.date.startsWith(prefix));
      },

    }),
    { name: "meetings" }
  )
);
