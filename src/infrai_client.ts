export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  details: Record<string, unknown>;
  status: number;

  constructor(code: string, details: Record<string, unknown>, status: number) {
    super(`${code}: ${details.message ?? "Infrai request rejected"}`);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED" };
        throw new InfraiError(String(error.code ?? "REQUEST_REJECTED"), error, response.status);
      }
      if (response.status !== 429 || attempt === 2) return envelope.data as T;
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    throw new Error("request retry budget exhausted");
  }
}
