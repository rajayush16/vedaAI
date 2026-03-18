import { Worker } from "bullmq";
import { generateStructuredPaper } from "./services/generator";
import {
  generationJobName,
  generationQueueName,
  type GenerationJobPayload,
} from "./lib/queue";
import { connectToDatabase } from "./lib/db";
import { AssignmentModel } from "./models/Assignment";
import { GenerationJobModel } from "./models/GenerationJob";
import { GeneratedPaperModel } from "./models/GeneratedPaper";
import { realtimeGateway } from "./lib/realtime";
import { attachGeneratedPaper } from "./services/assignment-service";
import { env } from "./config";

export function createGenerationWorker() {
  return new Worker<GenerationJobPayload, unknown, typeof generationJobName>(
    generationQueueName,
    async (job) => {
      await connectToDatabase();

      const assignment = await AssignmentModel.findById(job.data.assignmentId).lean<{
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
      } | null>();

      if (!assignment) {
        throw new Error("Assignment not found for job");
      }

      await GenerationJobModel.findByIdAndUpdate(job.data.generationJobId, {
        status: "processing",
      });

      realtimeGateway.broadcast({
        type: "job-update",
        payload: {
          jobId: job.data.generationJobId,
          assignmentId: job.data.assignmentId,
          status: "processing",
          message: "Generating question paper",
        },
      });

      const generatedPaper = await generateStructuredPaper({
        title: assignment.title,
        subject: assignment.subject,
        className: assignment.className,
        schoolName: assignment.schoolName,
        durationMinutes: assignment.durationMinutes,
        dueDate: assignment.dueDate,
        instructions: assignment.instructions,
        materialText: assignment.materialText,
        materialFileName: assignment.materialFileName,
        questionTypes: assignment.questionTypes,
      });

      const paper = await GeneratedPaperModel.create({
        assignmentId: assignment._id,
        ...generatedPaper,
      });

      await attachGeneratedPaper(
        job.data.assignmentId,
        job.data.generationJobId,
        String(paper._id),
      );

      realtimeGateway.broadcast({
        type: "job-update",
        payload: {
          jobId: job.data.generationJobId,
          assignmentId: job.data.assignmentId,
          status: "completed",
          message: "Question paper ready",
        },
      });

      return paper._id;
    },
    {
      connection: {
        url: env.REDIS_URL,
      },
    },
  );
}
