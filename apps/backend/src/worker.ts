import { connectToDatabase } from "./lib/db";
import { createGenerationWorker } from "./worker-runner";

async function main() {
  await connectToDatabase();
  createGenerationWorker();
  console.log("Generation worker started");
}

main().catch((error) => {
  console.error("Worker failed to start", error);
  process.exit(1);
});
