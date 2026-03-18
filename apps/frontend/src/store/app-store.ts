"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AssignmentInput } from "@vedaai/shared";
import { seededAssignments, demoTeacher } from "../data/demo";

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
  activeJobs: Record<
    string,
    {
      jobId: string;
      status: "queued" | "processing" | "completed" | "failed";
      message?: string;
    }
  >;
  login: () => void;
  logout: () => void;
  seedAssignments: () => void;
  setSearch: (search: string) => void;
  setTeacher: (teacher: TeacherSession | null) => void;
  setAssignments: (assignments: AssignmentCard[]) => void;
  setActiveJob: (
    assignmentId: string,
    job: {
      jobId: string;
      status: "queued" | "processing" | "completed" | "failed";
      message?: string;
    },
  ) => void;
  updateDraft: (patch: Partial<AssignmentDraft>) => void;
  addQuestionType: () => void;
  updateQuestionType: (id: string, patch: Partial<QuestionTypeDraft>) => void;
  removeQuestionType: (id: string) => void;
  resetDraft: () => void;
};

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
      activeJobs: {},
      login: () => {
        set({
          teacher: demoTeacher,
        });
      },
      logout: () => {
        set({
          teacher: null,
          assignments: [],
          search: "",
          draft: createEmptyDraft(),
          activeJobs: {},
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
      setTeacher: (teacher) => {
        set({ teacher });
      },
      setAssignments: (assignments) => {
        set({ assignments });
      },
      setActiveJob: (assignmentId, job) => {
        set((state) => ({
          activeJobs: {
            ...state.activeJobs,
            [assignmentId]: job,
          },
        }));
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
    }),
    {
      name: "vedaai-app",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teacher: state.teacher,
        draft: state.draft,
      }),
    },
  ),
);
