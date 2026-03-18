import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { env } from "./config";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser(env.SESSION_SECRET));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    websocket: true,
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      type: "connected",
      message: "WebSocket server ready",
    }),
  );
});

server.listen(env.BACKEND_PORT, () => {
  console.log(`API server listening on http://localhost:${env.BACKEND_PORT}`);
});
