import test from "node:test";
import assert from "node:assert/strict";
import { isLate, deadlineBody } from "./course_reporting.ts";

test("an educator report marks a completion after its deadline as late", () => {
  const input = deadlineBody.parse({
    courseId: "algebra-101",
    learnerId: "learner-001",
    dueAt: "2026-10-20T17:00:00.000Z",
    completedAt: "2026-10-20T18:15:00.000Z"
  });
  assert.equal(isLate(input), true);
});
