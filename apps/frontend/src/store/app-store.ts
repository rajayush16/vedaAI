"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AssignmentInput } from "@vedaai/shared";
import { seededAssignments, demoTeacher } from "../data/demo";
import { sessionCookieName } from "../lib/constants";

export type AssignmentCard = {
  id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
};

export type QuestionTypeDraft = {
  id: string;
  type: string;
  count: number;
  marks: number;
};

export type AssignmentDraft = Omit<AssignmentInput, "questionTypes"> & {
  questionTypes: QuestionTypeDraft[];
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
  draft: AssignmentDraft;
  login: () => void;
  logout: () => void;
  seedAssignments: () => void;
  setSearch: (search: string) => void;
  updateDraft: (patch: Partial<AssignmentDraft>) => void;
  addQuestionType: () => void;
  updateQuestionType: (id: string, patch: Partial<QuestionTypeDraft>) => void;
  removeQuestionType: (id: string) => void;
  resetDraft: () => void;
  createAssignmentFromDraft: () => string;
};

function setSessionCookie() {
  document.cookie = `${sessionCookieName}=active; path=/; max-age=604800; samesite=lax`;
}

function clearSessionCookie() {
  document.cookie = `${sessionCookieName}=; path=/; max-age=0; samesite=lax`;
}

function createQuestionTypeRow(index: number): QuestionTypeDraft {
  const presets = [
    "Multiple Choice Questions",
    "Short Questions",
    "Diagram/Graph-Based Questions",
    "Numerical Problems",
  ];

  return {
    id: `question-type-${Date.now()}-${index}`,
    type: presets[index] ?? "",
    count: index === 0 ? 4 : index === 1 ? 3 : 5,
    marks: index === 0 ? 1 : index === 1 ? 2 : 5,
  };
}

function createEmptyDraft(): AssignmentDraft {
  return {
    title: "Quiz on Electricity",
    subject: "Science",
    className: "8th",
    schoolName: demoTeacher.schoolName,
    durationMinutes: 45,
    dueDate: "",
    instructions: "",
    materialText: "",
    materialFileName: "",
    questionTypes: [
      createQuestionTypeRow(0),
      createQuestionTypeRow(1),
      createQuestionTypeRow(2),
      createQuestionTypeRow(3),
    ],
  };
}

function formatToday() {
  return new Intl.DateTimeFormat("en-GB").format(new Date()).replace(/\//g, "-");
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      teacher: null,
      assignments: [],
      search: "",
      draft: createEmptyDraft(),
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
          draft: createEmptyDraft(),
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
      updateDraft: (patch) => {
        set((state) => ({
          draft: {
            ...state.draft,
            ...patch,
          },
        }));
      },
      addQuestionType: () => {
        set((state) => ({
          draft: {
            ...state.draft,
            questionTypes: [
              ...state.draft.questionTypes,
              createQuestionTypeRow(state.draft.questionTypes.length),
            ],
          },
        }));
      },
      updateQuestionType: (id, patch) => {
        set((state) => ({
          draft: {
            ...state.draft,
            questionTypes: state.draft.questionTypes.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        }));
      },
      removeQuestionType: (id) => {
        set((state) => ({
          draft: {
            ...state.draft,
            questionTypes:
              state.draft.questionTypes.length > 1
                ? state.draft.questionTypes.filter((item) => item.id !== id)
                : state.draft.questionTypes,
          },
        }));
      },
      resetDraft: () => {
        set({
          draft: createEmptyDraft(),
        });
      },
      createAssignmentFromDraft: () => {
        const id = `assignment-${crypto.randomUUID()}`;

        set((state) => ({
          assignments: [
            {
              id,
              title: state.draft.title,
              assignedOn: formatToday(),
              dueDate: state.draft.dueDate,
            },
            ...state.assignments,
          ],
        }));

        return id;
      },
    }),
    {
      name: "vedaai-app",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teacher: state.teacher,
        assignments: state.assignments,
        draft: state.draft,
      }),
    },
  ),
);
