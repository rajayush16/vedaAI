const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";

async function parseJsonResponse<T>(response: Response) {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" as string }));
    throw new Error(error.message || "Request failed");
  }

  return (await response.json()) as T;
}

export type TeacherPayload = {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  city: string;
  avatarInitials: string;
};

export type AssignmentListItem = {
  _id: string;
  title: string;
  dueDate: string;
  createdAt: string;
};

export type GeneratedPaperPayload = {
  _id: string;
  title: string;
  schoolName: string;
  subject: string;
  className: string;
  duration: string;
  maximumMarks: number;
  sections: {
    title: string;
    instruction: string;
    questions: {
      text: string;
      difficulty: "easy" | "moderate" | "hard";
      marks: number;
    }[];
  }[];
  answerKey: {
    questionNumber: number;
    answer: string;
  }[];
};

export type AssignmentDetailPayload = {
  assignment: {
    _id: string;
    title: string;
    subject: string;
    className: string;
    schoolName: string;
    dueDate: string;
    durationMinutes: number;
    instructions?: string;
    materialText?: string;
    materialFileName?: string;
    questionTypes?: {
      id: string;
      type: string;
      count: number;
      marks: number;
    }[];
  };
  latestJob: {
    _id: string;
    status: "queued" | "processing" | "completed" | "failed";
    errorMessage?: string;
  } | null;
  latestPaper: GeneratedPaperPayload | null;
};

export type JobUpdatePayload = {
  jobId: string;
  assignmentId: string;
  jobKind: "generation" | "pdf";
  status: "queued" | "processing" | "completed" | "failed";
  message?: string;
  downloadPath?: string;
  fileName?: string;
};

export async function loginTeacher(email: string, password: string) {
  return parseJsonResponse<{ teacher: TeacherPayload }>(
    await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function getTeacherSession() {
  return parseJsonResponse<{ teacher: TeacherPayload }>(
    await fetch(`${apiBaseUrl}/api/auth/session`, {
      credentials: "include",
      cache: "no-store",
    }),
  );
}

export async function logoutTeacher() {
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchAssignments(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return parseJsonResponse<{ assignments: AssignmentListItem[] }>(
    await fetch(`${apiBaseUrl}/api/assignments${query}`, {
      credentials: "include",
      cache: "no-store",
    }),
  );
}

export async function createAssignment(payload: FormData) {
  return parseJsonResponse<{ assignmentId: string; jobId: string }>(
    await fetch(`${apiBaseUrl}/api/assignments`, {
      method: "POST",
      body: payload,
      credentials: "include",
    }),
  );
}

export async function updateAssignment(id: string, payload: FormData) {
  return parseJsonResponse<{ assignmentId: string; jobId: string }>(
    await fetch(`${apiBaseUrl}/api/assignments/${id}`, {
      method: "PATCH",
      body: payload,
      credentials: "include",
    }),
  );
}

export async function fetchAssignmentDetail(id: string) {
  return parseJsonResponse<AssignmentDetailPayload>(
    await fetch(`${apiBaseUrl}/api/assignments/${id}`, {
      credentials: "include",
      cache: "no-store",
    }),
  );
}

export async function deleteAssignment(id: string) {
  await fetch(`${apiBaseUrl}/api/assignments/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" as string }));
      throw new Error(error.message || "Request failed");
    }
  });
}

export async function regenerateAssignment(id: string) {
  return parseJsonResponse<{ assignmentId: string; jobId: string }>(
    await fetch(`${apiBaseUrl}/api/assignments/${id}/regenerate`, {
      method: "POST",
      credentials: "include",
    }),
  );
}

export async function requestPdfExport(id: string) {
  return parseJsonResponse<{ jobId: string; status: "queued" }>(
    await fetch(`${apiBaseUrl}/api/assignments/${id}/export-pdf`, {
      method: "POST",
      credentials: "include",
    }),
  );
}

export async function downloadPdfExport(assignmentId: string, jobId: string) {
  const response = await fetch(
    `${apiBaseUrl}/api/assignments/${assignmentId}/export-pdf/${jobId}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" as string }));
    throw new Error(error.message || "Request failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const fileNameMatch = disposition?.match(/filename=\"?([^"]+)\"?/i);

  return {
    blob,
    fileName: fileNameMatch?.[1] ?? "assignment-paper.pdf",
  };
}

export function createJobSocket() {
  return new WebSocket(wsBaseUrl);
}
