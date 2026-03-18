import http from "http";
import { WebSocketServer } from "ws";
import { env } from "./config";
import { createApp } from "./app";
import { connectToDatabase } from "./lib/db";
import { realtimeGateway } from "./lib/realtime";

async function main() {
  await connectToDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  realtimeGateway.attach(wss);

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
}

main().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
