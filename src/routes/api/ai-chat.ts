import { createFileRoute } from "@tanstack/react-router";
import {
  buildConversationHistory,
  BusinessContextError,
  getAuthorizedBusinessContext,
} from "../../server/ai-business-context";
import { AiProviderError, generateAnswer, getProviderConfig } from "../../server/ai-providers";

const MAX_REQUEST_BYTES = 64_000;
const MAX_PROMPT_LENGTH = 4_000;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!request.headers.get("content-type")?.includes("application/json")) {
            return jsonError(415, "unsupported_media_type", "Send this request as JSON.");
          }

          const authHeader = request.headers.get("authorization");
          const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
          if (!accessToken) {
            return jsonError(401, "authentication_required", "Sign in to use Nexora Copilot.");
          }

          const declaredLength = Number(request.headers.get("content-length") || 0);
          if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
            return jsonError(413, "request_too_large", "This chat request is too large.");
          }
          const { body: rawBody, tooLarge } = await readLimitedBody(request, MAX_REQUEST_BYTES);
          if (tooLarge) {
            return jsonError(413, "request_too_large", "This chat request is too large.");
          }

          let payload: unknown;
          try {
            payload = JSON.parse(rawBody);
          } catch {
            return jsonError(400, "invalid_json", "The chat request must contain valid JSON.");
          }

          if (typeof payload !== "object" || payload === null || !("prompt" in payload)) {
            return jsonError(400, "invalid_request", "A prompt is required.");
          }
          const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
          if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
            return jsonError(
              400,
              "invalid_prompt",
              `Prompt must be between 1 and ${MAX_PROMPT_LENGTH} characters.`,
            );
          }

          getProviderConfig();
          const context = await getAuthorizedBusinessContext(accessToken, prompt);
          if (isRateLimited(context.userId)) {
            return jsonError(
              429,
              "rate_limited",
              "Too many Copilot requests. Wait a minute and try again.",
            );
          }

          const history = buildConversationHistory(
            "history" in payload ? payload.history : undefined,
          );
          const result = await generateAnswer(
            context.systemInstruction,
            history,
            prompt,
            request.signal,
          );

          console.info("[ai-provider] response generated", {
            provider: result.provider,
            model: result.model,
            usedFallback: result.usedFallback,
          });
          return Response.json({ answer: result.answer });
        } catch (error) {
          if (error instanceof BusinessContextError || error instanceof AiProviderError) {
            if (error instanceof AiProviderError) {
              console.warn("[ai-provider] request failed", { code: error.code });
            }
            return jsonError(error.status, error.code, error.message);
          }
          console.error("[ai-chat] request failed", {
            name: error instanceof Error ? error.name : "UnknownError",
          });
          return jsonError(
            500,
            "internal_error",
            "Nexora Copilot could not complete the request. Please try again.",
          );
        }
      },
    },
  },
});

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  if (requestCounts.size > 2_000) {
    for (const [token, entry] of requestCounts) {
      if (entry.resetAt <= now) requestCounts.delete(token);
    }
  }

  const current = requestCounts.get(userId);
  if (!current || current.resetAt <= now) {
    requestCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

async function readLimitedBody(
  request: Request,
  maxBytes: number,
): Promise<{ body: string; tooLarge: boolean }> {
  if (!request.body) return { body: "", tooLarge: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return { body: "", tooLarge: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: new TextDecoder().decode(body), tooLarge: false };
}
