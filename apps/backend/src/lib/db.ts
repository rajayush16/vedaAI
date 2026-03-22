import mongoose from "mongoose";
import { env } from "../config";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGODB_URI, {
        family: 4,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error) => {
        connectionPromise = null;

        const message =
          error instanceof Error ? error.message : String(error);

        if (message.includes("EACCES") || message.includes("ETIMEDOUT")) {
          error.message = [
            "Failed to reach MongoDB Atlas from this machine.",
            "Outbound TCP access to the Atlas hosts on port 27017 is blocked or timing out.",
            "This is usually caused by Atlas Network Access rules, local firewall/antivirus, VPN, proxy, or the current ISP/network blocking port 27017.",
            "Try allowing your current public IP in Atlas and testing from a different network such as a mobile hotspot.",
            `Original error: ${message}`,
          ].join(" ");
          throw error;
        }

        if (message.includes("querySrv")) {
          error.message = [
            "Failed to resolve MongoDB Atlas SRV records.",
            "This machine is timing out on the DNS lookup for the Atlas cluster.",
            "Use the non-SRV mongodb:// host list form of the Atlas URI or fix local DNS resolution.",
            `Original error: ${message}`,
          ].join(" ");
          throw error;
        }

        if (
          env.MONGODB_URI.startsWith("mongodb+srv://") &&
          process.env.NODE_ENV !== "production"
        ) {
          error.message = [
            "Failed to connect to MongoDB Atlas.",
            "The app is using a cloud Atlas connection, so check Atlas Network Access and Database Access first.",
            "Make sure your current public IP is allowed in Atlas and that the cluster is not paused.",
            "If this machine has IPv6/DNS issues, the app now forces IPv4 for Atlas connections.",
            `Original error: ${error.message}`,
          ].join(" ");
        }

        throw error;
      });
  }

  return connectionPromise;
}
