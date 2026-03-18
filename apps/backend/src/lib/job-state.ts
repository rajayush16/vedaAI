import { redis } from "./redis";

export type JobKind = "generation" | "pdf";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type CachedJobState = {
  assignmentId: string;
  jobId: string;
  jobKind: JobKind;
  status: JobStatus;
  message?: string;
  downloadPath?: string;
  fileName?: string;
};

function getJobStateKey(jobKind: JobKind, jobId: string) {
  return `vedaai:job:${jobKind}:${jobId}`;
}

export async function setJobState(state: CachedJobState) {
  await redis.set(
    getJobStateKey(state.jobKind, state.jobId),
    JSON.stringify(state),
    "EX",
    60 * 60 * 24,
  );
}

export async function getJobState(jobKind: JobKind, jobId: string) {
  const raw = await redis.get(getJobStateKey(jobKind, jobId));
  return raw ? (JSON.parse(raw) as CachedJobState) : null;
}
