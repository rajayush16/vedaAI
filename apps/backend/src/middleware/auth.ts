import type { NextFunction, Request, Response } from "express";
import { getTeacherSession } from "../lib/session";

export async function requireTeacherSession(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const sessionId = request.signedCookies.vedaai_demo_session as string | undefined;

  if (!sessionId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const session = await getTeacherSession(sessionId);

  if (!session) {
    response.status(401).json({ message: "Session expired" });
    return;
  }

  request.teacher = session.teacher;
  next();
}
