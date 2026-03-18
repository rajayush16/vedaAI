import mongoose, { Schema, type InferSchemaType } from "mongoose";

const generationJobSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    teacherId: { type: String, required: true },
    bullJobId: { type: String },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },
    errorMessage: { type: String, default: "" },
    resultPaperId: { type: Schema.Types.ObjectId, ref: "GeneratedPaper" },
  },
  {
    timestamps: true,
  },
);

export type GenerationJobDocument = InferSchemaType<typeof generationJobSchema>;

export const GenerationJobModel =
  mongoose.models.GenerationJob ||
  mongoose.model("GenerationJob", generationJobSchema);
