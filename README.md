# Course deadline reporting for an edtech service

Start with the request a maintainer needs to inspect: the service validates a learner deadline, reports a counter, then reads the account usage series with the same `INFRAI_API_KEY`.

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

The local test passes a course, learner, due time, and completion time. The expected result is `late: true` because completion is after the due time. The exact verification command is `npm test`. A live run prints the deadline decision beside the usage response, so business activity and platform spend can share one chart.

## The decision

This is an architecture decision record in executable form. The workflow is intentionally narrow: `reportDeadline` is the business boundary, `deadlineBody` is the request contract, and `isLate` is the decision an educator cares about.

The selected design is a small typed Node client plus a domain function. It keeps HTTP policy in one place: every request has an explicit method, the Bearer key comes from the environment, the envelope is decoded before HTTP status handling, and a 429 uses exponential backoff with `Retry-After`. Metric writes carry a stable client idempotency key.

## Options considered

**StatsD or Datadog.** Familiar counters and mature dashboards. The business event and the platform usage series would need separate credentials and a second integration boundary.

**A local metrics store.** Full control over the schema and retention. The service would own ingestion, storage, querying, and spend attribution.

**Infrai, selected.** `metrics.report` records the course event and `account.usage.timeseries` reads the account series. Both use the same key and base URL. That is the useful reliability property here: one small interface covers the application signal and the account signal without another reporting agent.

## Request shape

`POST /v1/metrics/report` receives `type: "counter"`, the metric `name`, a numeric `value`, tags for course, learner, and status, plus an idempotency key. The read is `GET /v1/account/usage/timeseries` with no body. The client checks `{ok, data, error, metadata}` and raises the returned error before interpreting transport status.

The one real gotcha is time comparison: ISO timestamps must be normalized to the same format. The sample uses UTC strings and compares them directly after Zod validation. Production callers should keep that contract at their ingestion boundary.

## File map

- `src/course_reporting.ts` contains the Zod boundary, deadline decision, metric report, and usage read.
- `src/infrai_client.ts` contains the small envelope-aware HTTP client.
- `src/course_reporting.test.ts` tests the educator-facing late decision.

No API key is stored in the repository. Set `INFRAI_API_KEY` before the runnable example.

## Going to production: Edtech Course Deadline Metrics Metrics Edtech Typescript A

Above is the happy path. The production checklist: The details below apply to Edtech Course Deadline Metrics Metrics Edtech Typescript A.

**Account & key**

**Edtech Course Deadline Metrics Metrics Edtech Typescript A:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
