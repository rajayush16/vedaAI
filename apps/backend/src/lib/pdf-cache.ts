import { redis } from "./redis";

function getPdfBufferKey(jobId: string) {
  return `vedaai:pdf:${jobId}:buffer`;
}

function getPdfMetaKey(jobId: string) {
  return `vedaai:pdf:${jobId}:meta`;
}

export async function cachePdfDocument(
  jobId: string,
  buffer: Buffer,
  metadata: { fileName: string },
) {
  await redis.set(getPdfBufferKey(jobId), buffer.toString("base64"), "EX", 60 * 60);
  await redis.set(getPdfMetaKey(jobId), JSON.stringify(metadata), "EX", 60 * 60);
}

export async function getCachedPdfDocument(jobId: string) {
  const [rawBuffer, rawMeta] = await Promise.all([
    redis.get(getPdfBufferKey(jobId)),
    redis.get(getPdfMetaKey(jobId)),
  ]);

  if (!rawBuffer || !rawMeta) {
    return null;
  }

  return {
    buffer: Buffer.from(rawBuffer, "base64"),
    metadata: JSON.parse(rawMeta) as { fileName: string },
  };
}
