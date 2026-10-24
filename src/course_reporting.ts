import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const deadlineBody = z.object({
  courseId: z.string().min(1),
  learnerId: z.string().min(1),
  dueAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

export type DeadlineBody = z.infer<typeof deadlineBody>;

export function isLate(input: DeadlineBody): boolean {
  return input.completedAt === undefined || input.completedAt > input.dueAt;
}

export async function reportDeadline(client: InfraiClient, input: unknown): Promise<{ late: boolean }> {
  const deadline = deadlineBody.parse(input);
  const late = isLate(deadline);
  // The domain event maps directly to metrics.report.
  await client.request("POST", "/v1/metrics/report", {
    type: "counter",
    name: "edtech.learner_deadline",
    value: 1,
    tags: { course_id: deadline.courseId, learner_id: deadline.learnerId, status: late ? "late" : "on_time" },
    idempotency_key: `deadline:${deadline.courseId}:${deadline.learnerId}:${deadline.dueAt}`
  });
  return { late };
}

export async function readSpend(client: InfraiClient): Promise<unknown> {
  return client.request("GET", "/v1/account/usage/timeseries");
}

async function main(): Promise<void> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new InfraiClient(key);
  const result = await reportDeadline(client, {
    courseId: process.env.COURSE_ID ?? "algebra-101",
    learnerId: process.env.LEARNER_ID ?? "learner-001",
    dueAt: process.env.DUE_AT ?? "2026-10-20T17:00:00.000Z",
    completedAt: process.env.COMPLETED_AT ?? "2026-10-20T18:15:00.000Z"
  });
  const spend = await readSpend(client);
  console.log(JSON.stringify({ deadline: result, spend }));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
