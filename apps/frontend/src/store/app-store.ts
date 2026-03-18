"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { seededAssignments, demoTeacher } from "../data/demo";
import { sessionCookieName } from "../lib/constants";

export type AssignmentCard = {
  id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
};

type TeacherSession = {
  name: string;
  email: string;
  schoolName: string;
  city: string;
  avatarInitials: string;
};

type AppState = {
  teacher: TeacherSession | null;
  assignments: AssignmentCard[];
  search: string;
  login: () => void;
  logout: () => void;
  seedAssignments: () => void;
  setSearch: (search: string) => void;
};

function setSessionCookie() {
  document.cookie = `${sessionCookieName}=active; path=/; max-age=604800; samesite=lax`;
}

function clearSessionCookie() {
  document.cookie = `${sessionCookieName}=; path=/; max-age=0; samesite=lax`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      teacher: null,
      assignments: [],
      search: "",
      login: () => {
        setSessionCookie();
        set({
          teacher: demoTeacher,
        });
      },
      logout: () => {
        clearSessionCookie();
        set({
          teacher: null,
          assignments: [],
          search: "",
        });
      },
      seedAssignments: () => {
        set({
          assignments: seededAssignments,
        });
      },
      setSearch: (search) => {
        set({ search });
      },
    }),
    {
      name: "vedaai-app",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teacher: state.teacher,
        assignments: state.assignments,
      }),
    },
  ),
);
