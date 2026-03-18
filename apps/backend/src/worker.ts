import { connectToDatabase } from "./lib/db";
import { createGenerationWorker, createPdfWorker } from "./worker-runner";

async function main() {
  await connectToDatabase();
  createGenerationWorker();
  createPdfWorker();
  console.log("Generation and PDF workers started");
}

main().catch((error) => {
  console.error("Worker failed to start", error);
  process.exit(1);
});
