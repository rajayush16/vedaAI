import { Queue } from "bullmq";
import { env } from "../config";

export const generationQueueName = "assignment-generation";
export const generationJobName = "generate-paper";

export type GenerationJobPayload = {
  assignmentId: string;
  generationJobId: string;
};

export const generationQueue = new Queue<
  GenerationJobPayload,
  unknown,
  typeof generationJobName
>(generationQueueName, {
  connection: {
    url: env.REDIS_URL,
  },
});
