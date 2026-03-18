import { env } from "./config";

async function main() {
  console.log("Worker bootstrap ready");
  console.log(`Redis: ${env.REDIS_URL}`);
  console.log(`MongoDB: ${env.MONGODB_URI}`);
}

main().catch((error) => {
  console.error("Worker failed to start", error);
  process.exit(1);
});
