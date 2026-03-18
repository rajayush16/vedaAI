import mongoose, { Schema, type InferSchemaType } from "mongoose";

const teacherSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    teacher: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      schoolName: { type: String, required: true },
      city: { type: String, required: true },
      avatarInitials: { type: String, required: true },
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
  },
);

export type TeacherSessionDocument = InferSchemaType<typeof teacherSessionSchema>;

export const TeacherSessionModel =
  mongoose.models.TeacherSession ||
  mongoose.model("TeacherSession", teacherSessionSchema);
