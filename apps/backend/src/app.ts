import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config";
import { authRouter } from "./routes/auth";
import { assignmentsRouter } from "./routes/assignments";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.SESSION_SECRET));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      service: "backend",
      websocket: true,
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/assignments", assignmentsRouter);

  return app;
}
