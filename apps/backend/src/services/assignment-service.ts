import { assignmentInputSchema } from "@vedaai/shared";
import { AssignmentModel } from "../models/Assignment";
import { GenerationJobModel } from "../models/GenerationJob";
import { GeneratedPaperModel } from "../models/GeneratedPaper";
import { generationJobName, generationQueue } from "../lib/queue";
import { realtimeGateway } from "../lib/realtime";

export async function createAssignmentWithJob(input: unknown, teacherId: string) {
  const parsed = assignmentInputSchema.parse(input);

  const assignment = await AssignmentModel.create({
    ...parsed,
    teacherId,
  });

  const generationJob = await GenerationJobModel.create({
    assignmentId: assignment._id,
    teacherId,
    status: "queued",
  });

  assignment.latestJobId = generationJob._id;
  await assignment.save();

  const queuedJob = await generationQueue.add(generationJobName, {
    assignmentId: String(assignment._id),
    generationJobId: String(generationJob._id),
  });

  generationJob.bullJobId = String(queuedJob.id);
  await generationJob.save();

  realtimeGateway.broadcast({
    type: "job-update",
    payload: {
      jobId: String(generationJob._id),
      assignmentId: String(assignment._id),
      status: "queued",
      message: "Assignment queued for generation",
    },
  });

  return {
    assignmentId: String(assignment._id),
    jobId: String(generationJob._id),
  };
}

export async function listAssignments(teacherId: string, search?: string) {
  const query = {
    teacherId,
    ...(search
      ? {
          title: {
            $regex: search,
            $options: "i",
          },
        }
      : {}),
  };

  const assignments = await AssignmentModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return assignments;
}

export async function getAssignmentWithOutput(assignmentId: string, teacherId: string) {
  const assignment = await AssignmentModel.findOne({
    _id: assignmentId,
    teacherId,
  }).lean<{
    _id: string;
    title: string;
    subject: string;
    className: string;
    schoolName: string;
    durationMinutes: number;
    dueDate: string;
    instructions: string;
    materialText: string;
    materialFileName: string;
    questionTypes: {
      id: string;
      type: string;
      count: number;
      marks: number;
    }[];
    teacherId: string;
    latestJobId?: string;
    latestPaperId?: string;
  } | null>();

  if (!assignment) {
    return null;
  }

  const latestJob = assignment.latestJobId
    ? await GenerationJobModel.findById(assignment.latestJobId).lean()
    : null;
  const latestPaper = assignment.latestPaperId
    ? await GeneratedPaperModel.findById(assignment.latestPaperId).lean()
    : null;

  return {
    assignment,
    latestJob,
    latestPaper,
  };
}

export async function attachGeneratedPaper(
  assignmentId: string,
  generationJobId: string,
  generatedPaperId: string,
) {
  await AssignmentModel.findByIdAndUpdate(assignmentId, {
    latestPaperId: generatedPaperId,
  });

  await GenerationJobModel.findByIdAndUpdate(generationJobId, {
    status: "completed",
    resultPaperId: generatedPaperId,
    errorMessage: "",
  });
}
