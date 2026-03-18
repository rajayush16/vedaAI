import mongoose, { Schema, type InferSchemaType } from "mongoose";

const generatedQuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    difficulty: { type: String, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false },
);

const generatedSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: {
      type: [generatedQuestionSchema],
      default: [],
    },
  },
  { _id: false },
);

const answerKeyItemSchema = new Schema(
  {
    questionNumber: { type: Number, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const generatedPaperSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    title: { type: String, required: true },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    duration: { type: String, required: true },
    maximumMarks: { type: Number, required: true },
    sections: {
      type: [generatedSectionSchema],
      default: [],
    },
    answerKey: {
      type: [answerKeyItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type GeneratedPaperDocument = InferSchemaType<typeof generatedPaperSchema>;

export const GeneratedPaperModel =
  mongoose.models.GeneratedPaper ||
  mongoose.model("GeneratedPaper", generatedPaperSchema);
