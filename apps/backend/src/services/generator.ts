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
  let questionNumber = 1;
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
    section.questions.map((question) => ({
      questionNumber: questionNumber++,
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
  const sectionPlan = input.questionTypes.map((questionType, index) => ({
    title: `Section ${String.fromCharCode(65 + index)}`,
    type: questionType.type,
    questionCount: questionType.count,
    marksPerQuestion: questionType.marks,
    instruction: `Attempt all ${questionType.type.toLowerCase()} in this section.`,
  }));

  return [
    "You are generating a polished school examination paper.",
    "Return valid JSON only. Do not include markdown fences, commentary, or extra keys.",
    "The output must be exam-ready, concise, and readable.",
    "Follow the requested section plan exactly.",
    "Each question must include text, difficulty, and marks.",
    "Difficulty must be one of: easy, moderate, hard.",
    "The answerKey must be globally numbered in display order across the whole paper.",
    "Use this exact JSON shape:",
    JSON.stringify({
      title: "string",
      schoolName: "string",
      subject: "string",
      className: "string",
      duration: "45 minutes",
      maximumMarks: 100,
      sections: [
        {
          title: "Section A",
          instruction: "Attempt all questions.",
          questions: [
            {
              text: "Question text",
              difficulty: "easy",
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
    `Assignment title: ${input.title}`,
    `Subject: ${input.subject}`,
    `Class: ${input.className}`,
    `School: ${input.schoolName}`,
    `Duration: ${input.durationMinutes} minutes`,
    `Due date: ${input.dueDate}`,
    `Additional instructions: ${input.instructions || "None"}`,
    `Material text: ${input.materialText || "None provided"}`,
    `Source file name: ${input.materialFileName || "None"}`,
    `Section plan: ${JSON.stringify(sectionPlan)}`,
  ].join("\n");
}

function normalizeDifficulty(value: unknown): "easy" | "moderate" | "hard" {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "easy") {
    return "easy";
  }

  if (normalized === "medium" || normalized === "moderate") {
    return "moderate";
  }

  return "hard";
}

function normalizeGeneratedPaper(
  candidate: unknown,
  input: AssignmentInput,
): GeneratedPaper {
  const fallback = buildFallbackPaper(input);
  const source =
    candidate && typeof candidate === "object"
      ? (candidate as Record<string, unknown>)
      : {};
  const sectionCandidates = Array.isArray(source.sections) ? source.sections : [];
  let questionNumber = 1;

  const sections = input.questionTypes.map((questionType, index) => {
    const sectionSource =
      sectionCandidates[index] && typeof sectionCandidates[index] === "object"
        ? (sectionCandidates[index] as Record<string, unknown>)
        : null;
    const questionCandidates = Array.isArray(sectionSource?.questions)
      ? sectionSource.questions
      : [];

    const questions = Array.from({ length: questionType.count }, (_, questionIndex) => {
      const rawQuestion =
        questionCandidates[questionIndex] &&
        typeof questionCandidates[questionIndex] === "object"
          ? (questionCandidates[questionIndex] as Record<string, unknown>)
          : null;
      const fallbackQuestion = fallback.sections[index]?.questions[questionIndex];

      return {
        text:
          typeof rawQuestion?.text === "string" && rawQuestion.text.trim()
            ? rawQuestion.text.trim()
            : fallbackQuestion?.text ??
              `${questionType.type}: ${input.subject} question ${questionIndex + 1}.`,
        difficulty: normalizeDifficulty(rawQuestion?.difficulty),
        marks:
          typeof rawQuestion?.marks === "number" && rawQuestion.marks > 0
            ? Math.round(rawQuestion.marks)
            : questionType.marks,
      };
    });

    return {
      title:
        typeof sectionSource?.title === "string" && sectionSource.title.trim()
          ? sectionSource.title.trim()
          : `Section ${String.fromCharCode(65 + index)}`,
      instruction:
        typeof sectionSource?.instruction === "string" && sectionSource.instruction.trim()
          ? sectionSource.instruction.trim()
          : `Attempt all ${questionType.type.toLowerCase()} in this section.`,
      questions,
    };
  });

  const answerKeySource = Array.isArray(source.answerKey) ? source.answerKey : [];
  const answerKey = sections.flatMap((section) =>
    section.questions.map((question) => {
      const sourceAnswer =
        answerKeySource.find(
          (item) =>
            item &&
            typeof item === "object" &&
            Number((item as Record<string, unknown>).questionNumber) === questionNumber,
        ) ?? null;
      const currentNumber = questionNumber++;
      const answerText =
        sourceAnswer && typeof (sourceAnswer as Record<string, unknown>).answer === "string"
          ? String((sourceAnswer as Record<string, unknown>).answer)
          : "";

      return {
        questionNumber: currentNumber,
        answer:
          answerText.trim()
            ? answerText.trim()
            : `Suggested answer for ${question.text}`,
      };
    }),
  );

  return generatedPaperSchema.parse({
    title:
      typeof source.title === "string" && source.title.trim()
        ? source.title.trim()
        : input.title,
    schoolName:
      typeof source.schoolName === "string" && source.schoolName.trim()
        ? source.schoolName.trim()
        : input.schoolName,
    subject:
      typeof source.subject === "string" && source.subject.trim()
        ? source.subject.trim()
        : input.subject,
    className:
      typeof source.className === "string" && source.className.trim()
        ? source.className.trim()
        : input.className,
    duration:
      typeof source.duration === "string" && source.duration.trim()
        ? source.duration.trim()
        : `${input.durationMinutes} minutes`,
    maximumMarks: sections.reduce(
      (sum, section) =>
        sum + section.questions.reduce((questionSum, question) => questionSum + question.marks, 0),
      0,
    ),
    sections,
    answerKey,
  });
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
    const parsed = JSON.parse(text);
    return normalizeGeneratedPaper(parsed, input);
  } catch (error) {
    console.error("OpenAI generation failed, falling back to deterministic paper", error);
    return buildFallbackPaper(input);
  }
}
