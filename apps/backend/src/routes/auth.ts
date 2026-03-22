import { Router } from "express";
import { env } from "../config";
import { createTeacherSession, destroyTeacherSession, getTeacherSession } from "../lib/session";

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const sessionCookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  secure: isProduction,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

authRouter.post("/login", async (request, response) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (email !== env.DEMO_TEACHER_EMAIL || password !== env.DEMO_TEACHER_PASSWORD) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const session = await createTeacherSession();

  response.cookie("vedaai_demo_session", session.sessionId, sessionCookieOptions);

  response.json({
    teacher: session.teacher,
  });
});

authRouter.get("/session", async (request, response) => {
  const sessionId = request.signedCookies.vedaai_demo_session as string | undefined;

  if (!sessionId) {
    response.status(401).json({ message: "No active session" });
    return;
  }

  const session = await getTeacherSession(sessionId);

  if (!session) {
    response.status(401).json({ message: "Session expired" });
    return;
  }

  response.json({
    teacher: session.teacher,
  });
});

authRouter.post("/logout", async (request, response) => {
  const sessionId = request.signedCookies.vedaai_demo_session as string | undefined;

  if (sessionId) {
    await destroyTeacherSession(sessionId);
  }

  response.clearCookie("vedaai_demo_session", sessionCookieOptions);
  response.status(204).send();
});
