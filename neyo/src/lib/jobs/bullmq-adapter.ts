/**
 * BullMQ adapter (Feature A.12) — PRODUCTION path.
 * Only loaded when REDIS_URL is set. Pushes jobs to a Redis-backed queue that a
 * SEPARATE worker process drains (see scripts/worker.ts.example).
 *
 * Install at deploy:  npm i bullmq ioredis
 * Set env:            REDIS_URL=rediss://...   (Upstash)
 *
 * We import bullmq dynamically so the package isn't required in dev.
 */
export async function addToQueue(name: string, payload?: unknown): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let BullMQ: any;
  try {
    // Opaque dynamic import so webpack doesn't try to resolve the optional
    // 'bullmq' package at build time (it's installed only in production).
    const moduleName = "bullmq";
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const dynamicImport = new Function("m", "return import(m)") as (
      m: string
    ) => Promise<unknown>;
    BullMQ = await dynamicImport(moduleName);
  } catch {
    throw new Error(
      "bullmq is not installed. Run `npm i bullmq ioredis` to enable the Redis queue."
    );
  }
  const { Queue } = BullMQ as { Queue: new (n: string, o: unknown) => { add: (...a: unknown[]) => Promise<unknown>; close: () => Promise<void> } };
  const queue = new Queue("neyo-jobs", {
    connection: { url: process.env.REDIS_URL },
  });
  await queue.add(
    name,
    { name, payload },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    }
  );
  await queue.close();
}
