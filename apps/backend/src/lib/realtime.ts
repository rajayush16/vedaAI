import type { WebSocketServer } from "ws";
import { createRedisClient, redis } from "./redis";

type JobEventPayload = {
  type: "job-update";
  payload: {
    jobId: string;
    assignmentId: string;
    jobKind: "generation" | "pdf";
    status: "queued" | "processing" | "completed" | "failed";
    message?: string;
    downloadPath?: string;
    fileName?: string;
  };
};

const realtimeChannel = "vedaai:realtime";

class RealtimeGateway {
  private wss: WebSocketServer | null = null;
  private subscriber = createRedisClient({
    enableReadyCheck: false,
    lazyConnect: true,
  });
  private subscribed = false;

  async attach(wss: WebSocketServer) {
    this.wss = wss;

    if (!this.subscribed) {
      this.subscriber.on("message", (channel, message) => {
        if (channel === realtimeChannel) {
          this.sendLocal(message);
        }
      });
      await this.subscriber.subscribe(realtimeChannel);
      this.subscribed = true;
    }
  }

  async broadcast(message: JobEventPayload) {
    const data = JSON.stringify(message);
    await redis.publish(realtimeChannel, data);
  }

  private sendLocal(data: string) {
    if (!this.wss) {
      return;
    }
    for (const client of this.wss.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }
}

export const realtimeGateway = new RealtimeGateway();
