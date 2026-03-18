import { Worker } from "bullmq";
import { generateStructuredPaper } from "./services/generator";
import {
  generationJobName,
  generationQueueName,
  pdfJobName,
  pdfQueueName,
  type GenerationJobPayload,
  type PdfJobPayload,
} from "./lib/queue";
import { connectToDatabase } from "./lib/db";
import { AssignmentModel } from "./models/Assignment";
import { GenerationJobModel } from "./models/GenerationJob";
import { GeneratedPaperModel } from "./models/GeneratedPaper";
import { realtimeGateway } from "./lib/realtime";
import { attachGeneratedPaper } from "./services/assignment-service";
import { env } from "./config";
import { setJobState } from "./lib/job-state";
import { generatePaperPdf } from "./services/pdf";
import { cachePdfDocument } from "./lib/pdf-cache";

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

      try {
        await GenerationJobModel.findByIdAndUpdate(job.data.generationJobId, {
          status: "processing",
          errorMessage: "",
        });

        await setJobState({
          assignmentId: job.data.assignmentId,
          jobId: job.data.generationJobId,
          jobKind: "generation",
          status: "processing",
          message: "Generating question paper",
        });

        await realtimeGateway.broadcast({
          type: "job-update",
          payload: {
            jobId: job.data.generationJobId,
            assignmentId: job.data.assignmentId,
            jobKind: "generation",
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

        await setJobState({
          assignmentId: job.data.assignmentId,
          jobId: job.data.generationJobId,
          jobKind: "generation",
          status: "completed",
          message: "Question paper ready",
        });

        await realtimeGateway.broadcast({
          type: "job-update",
          payload: {
            jobId: job.data.generationJobId,
            assignmentId: job.data.assignmentId,
            jobKind: "generation",
            status: "completed",
            message: "Question paper ready",
          },
        });

        return paper._id;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Question paper generation failed";
        await GenerationJobModel.findByIdAndUpdate(job.data.generationJobId, {
          status: "failed",
          errorMessage: message,
        });
        await setJobState({
          assignmentId: job.data.assignmentId,
          jobId: job.data.generationJobId,
          jobKind: "generation",
          status: "failed",
          message,
        });
        await realtimeGateway.broadcast({
          type: "job-update",
          payload: {
            jobId: job.data.generationJobId,
            assignmentId: job.data.assignmentId,
            jobKind: "generation",
            status: "failed",
            message,
          },
        });
        throw error;
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
      },
    },
  );
}

export function createPdfWorker() {
  return new Worker<PdfJobPayload, unknown, typeof pdfJobName>(
    pdfQueueName,
    async (job) => {
      await connectToDatabase();

      const assignment = await AssignmentModel.findById(job.data.assignmentId).lean<{
        _id: string;
        title: string;
        latestPaperId?: string;
      } | null>();

      if (!assignment?.latestPaperId) {
        throw new Error("Question paper is not ready for PDF export");
      }

      const paper = await GeneratedPaperModel.findById(assignment.latestPaperId).lean<{
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
      } | null>();

      if (!paper) {
        throw new Error("Generated paper not found for PDF export");
      }

      try {
        await setJobState({
          assignmentId: job.data.assignmentId,
          jobId: job.data.pdfJobId,
          jobKind: "pdf",
          status: "processing",
          message: "Formatting PDF",
        });

        await realtimeGateway.broadcast({
          type: "job-update",
          payload: {
            jobId: job.data.pdfJobId,
            assignmentId: job.data.assignmentId,
            jobKind: "pdf",
            status: "processing",
            message: "Formatting PDF",
          },
        });

        const buffer = await generatePaperPdf(paper);
        const fileName = `${paper.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "assignment-paper"}.pdf`;
        const downloadPath = `/api/assignments/${job.data.assignmentId}/export-pdf/${job.data.pdfJobId}`;

        await cachePdfDocument(job.data.pdfJobId, buffer, {
          fileName,
        });

        await setJobState({
          assignmentId: job.data.assignmentId,
          jobId: job.data.pdfJobId,
          jobKind: "pdf",
          status: "completed",
          message: "PDF ready",
          downloadPath,
          fileName,
        });

        await realtimeGateway.broadcast({
          type: "job-update",
          payload: {
            jobId: job.data.pdfJobId,
            assignmentId: job.data.assignmentId,
            jobKind: "pdf",
            status: "completed",
            message: "PDF ready",
            downloadPath,
            fileName,
          },
        });

        return fileName;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "PDF generation failed";
        await setJobState({
          assignmentId: job.data.assignmentId,
          jobId: job.data.pdfJobId,
          jobKind: "pdf",
          status: "failed",
          message,
        });
        await realtimeGateway.broadcast({
          type: "job-update",
          payload: {
            jobId: job.data.pdfJobId,
            assignmentId: job.data.assignmentId,
            jobKind: "pdf",
            status: "failed",
            message,
          },
        });
        throw error;
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
      },
    },
  );
}
