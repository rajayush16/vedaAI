import OpenAI from "openai";
import {
  assignmentInputSchema,
  generatedPaperSchema,
  type AssignmentInput,
  type GeneratedPaper,
} from "@vedaai/shared";
import { env } from "../config";

const client = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

function buildFallbackPaper(input: AssignmentInput): GeneratedPaper {
  const sections = input.questionTypes.map((questionType, index) => ({
    title: `Section ${String.fromCharCode(65 + index)}`,
    instruction: `Attempt all ${questionType.type.toLowerCase()} in this section.`,
    questions: Array.from({ length: questionType.count }, (_, questionIndex) => ({
      text: `${questionType.type}: ${input.subject} question ${questionIndex + 1} for class ${input.className}.`,
      difficulty: (
        questionIndex % 3 === 0
          ? "easy"
          : questionIndex % 3 === 1
            ? "moderate"
            : "hard"
      ) as "easy" | "moderate" | "hard",
      marks: questionType.marks,
    })),
  }));

  const answerKey = sections.flatMap((section) =>
    section.questions.map((question, index) => ({
      questionNumber: index + 1,
      answer: `Suggested answer for ${question.text}`,
    })),
  );

  return {
    title: input.title,
    schoolName: input.schoolName,
    subject: input.subject,
    className: input.className,
    duration: `${input.durationMinutes} minutes`,
    maximumMarks: input.questionTypes.reduce(
      (sum, item) => sum + item.count * item.marks,
      0,
    ),
    sections,
    answerKey,
  };
}

function buildPrompt(input: AssignmentInput) {
  return [
    "You are generating a school question paper.",
    "Return valid JSON only.",
    "Use this structure:",
    JSON.stringify({
      title: "string",
      schoolName: "string",
      subject: "string",
      className: "string",
      duration: "string",
      maximumMarks: 10,
      sections: [
        {
          title: "Section A",
          instruction: "Attempt all questions.",
          questions: [
            {
              text: "Question text",
              difficulty: "easy | moderate | hard",
              marks: 2,
            },
          ],
        },
      ],
      answerKey: [
        {
          questionNumber: 1,
          answer: "Answer text",
        },
      ],
    }),
    `Assignment input: ${JSON.stringify(input)}`,
  ].join("\n");
}

export async function generateStructuredPaper(rawInput: AssignmentInput) {
  const input = assignmentInputSchema.parse(rawInput);

  if (!client) {
    return buildFallbackPaper(input);
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: buildPrompt(input),
    });

    const text = response.output_text;
    const parsed = generatedPaperSchema.parse(JSON.parse(text));
    return parsed;
  } catch (error) {
    console.error("OpenAI generation failed, falling back to deterministic paper", error);
    return buildFallbackPaper(input);
  }
}
