import { z } from "zod";

export const questionDifficultySchema = z.enum(["easy", "moderate", "hard"]);

export const questionTypeSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  count: z.number().int().positive(),
  marks: z.number().int().positive(),
});

export const assignmentInputSchema = z.object({
  title: z.string().min(3),
  subject: z.string().min(2),
  className: z.string().min(1),
  schoolName: z.string().min(2),
  durationMinutes: z.number().int().positive(),
  dueDate: z.string().min(1),
  instructions: z.string().optional().default(""),
  questionTypes: z.array(questionTypeSchema).min(1),
  materialText: z.string().optional(),
  materialFileName: z.string().optional(),
});

export const questionSchema = z.object({
  text: z.string().min(1),
  difficulty: questionDifficultySchema,
  marks: z.number().int().positive(),
});

export const answerKeyItemSchema = z.object({
  questionNumber: z.number().int().positive(),
  answer: z.string().min(1),
});

export const paperSectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(questionSchema).min(1),
});

export const generatedPaperSchema = z.object({
  title: z.string().min(1),
  schoolName: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  duration: z.string().min(1),
  maximumMarks: z.number().int().positive(),
  sections: z.array(paperSectionSchema).min(1),
  answerKey: z.array(answerKeyItemSchema).min(1),
});

export type AssignmentInput = z.infer<typeof assignmentInputSchema>;
export type GeneratedPaper = z.infer<typeof generatedPaperSchema>;
export type PaperSection = z.infer<typeof paperSectionSchema>;
export type PaperQuestion = z.infer<typeof questionSchema>;
export type QuestionTypeInput = z.infer<typeof questionTypeSchema>;
