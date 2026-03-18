import mongoose, { Schema, type InferSchemaType } from "mongoose";

const assignmentQuestionTypeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    count: { type: Number, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    schoolName: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    dueDate: { type: String, required: true },
    instructions: { type: String, default: "" },
    materialText: { type: String, default: "" },
    materialFileName: { type: String, default: "" },
    questionTypes: {
      type: [assignmentQuestionTypeSchema],
      default: [],
    },
    teacherId: { type: String, required: true },
    latestJobId: { type: Schema.Types.ObjectId, ref: "GenerationJob" },
    latestPaperId: { type: Schema.Types.ObjectId, ref: "GeneratedPaper" },
  },
  {
    timestamps: true,
  },
);

export type AssignmentDocument = InferSchemaType<typeof assignmentSchema>;

export const AssignmentModel =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
