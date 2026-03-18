import crypto from "crypto";
import { TeacherSessionModel } from "../models/TeacherSession";

const demoTeacher = {
  id: "teacher-demo-1",
  name: "John Doe",
  email: "teacher@vedaai.dev",
  schoolName: "Delhi Public School",
  city: "Bokaro Steel City",
  avatarInitials: "JD",
};

export async function createTeacherSession() {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await TeacherSessionModel.create({
    sessionId,
    teacher: demoTeacher,
    expiresAt,
  });

  return {
    sessionId,
    teacher: demoTeacher,
    expiresAt,
  };
}

export async function getTeacherSession(sessionId: string) {
  return TeacherSessionModel.findOne({ sessionId }).lean<{
    sessionId: string;
    teacher: {
      id: string;
      name: string;
      email: string;
      schoolName: string;
      city: string;
      avatarInitials: string;
    };
  } | null>();
}

export async function destroyTeacherSession(sessionId: string) {
  await TeacherSessionModel.deleteOne({ sessionId });
}
