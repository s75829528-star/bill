import { GoogleGenAI } from "@google/genai";

export type ProviderName = "gemini" | "openrouter";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderConfig {
  provider: ProviderName;
  fallbackEnabled: boolean;
  gemini: { apiKey: string; model: string };
  openrouter: { apiKey: string; model: string; baseUrl: string };
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly canFallback = false,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

const REQUEST_TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 1200;

export function getProviderConfig(): ProviderConfig {
  const provider = process.env.AI_PROVIDER?.trim() || "gemini";
  if (provider !== "gemini" && provider !== "openrouter") {
    throw new AiProviderError(
      "AI_PROVIDER must be either gemini or openrouter.",
      500,
      "invalid_provider",
    );
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const geminiModel = process.env.GEMINI_MODEL?.trim() ?? "";
  const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  const openRouterModel = process.env.OPENROUTER_MODEL?.trim() ?? "";
  const openRouterBaseUrl =
    process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
  const fallbackEnabled = process.env.AI_FALLBACK_ENABLED?.trim().toLowerCase() === "true";

  if (provider === "gemini" && (!geminiApiKey || !geminiModel)) {
    throw new AiProviderError(
      "Gemini is selected but GEMINI_API_KEY or GEMINI_MODEL is missing from the backend environment.",
      503,
      "provider_configuration_missing",
    );
  }
  if (provider === "openrouter" && (!openRouterApiKey || !openRouterModel)) {
    throw new AiProviderError(
      "OpenRouter is selected but OPENROUTER_API_KEY or OPENROUTER_MODEL is missing from the backend environment.",
      503,
      "provider_configuration_missing",
    );
  }
  if (
    fallbackEnabled &&
    ((provider === "gemini" && (!openRouterApiKey || !openRouterModel)) ||
      (provider === "openrouter" && (!geminiApiKey || !geminiModel)))
  ) {
    throw new AiProviderError(
      "Fallback is enabled but the secondary provider's key or model is missing.",
      503,
      "fallback_configuration_missing",
    );
  }

  const baseUrl = new URL(openRouterBaseUrl);
  if (baseUrl.protocol !== "https:" || baseUrl.hostname !== "openrouter.ai") {
    throw new AiProviderError(
      "OPENROUTER_BASE_URL must use the official HTTPS openrouter.ai endpoint.",
      500,
      "invalid_openrouter_base_url",
    );
  }

  return {
    provider,
    fallbackEnabled,
    gemini: { apiKey: geminiApiKey, model: geminiModel },
    openrouter: {
      apiKey: openRouterApiKey,
      model: openRouterModel,
      baseUrl: baseUrl.toString().replace(/\/+$/, ""),
    },
  };
}

export async function generateWithProvider(
  provider: ProviderName,
  config: ProviderConfig,
  systemInstruction: string,
  history: ChatTurn[],
  prompt: string,
  signal: AbortSignal,
): Promise<string> {
  if (provider === "gemini") {
    return generateWithGemini(config, systemInstruction, history, prompt, signal);
  }
  return generateWithOpenRouter(config, systemInstruction, history, prompt, signal);
}

function makeTimeoutSignal(requestSignal: AbortSignal): {
  signal: AbortSignal;
  dispose: () => void;
} {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error("Provider request timed out")),
    REQUEST_TIMEOUT_MS,
  );
  const abortFromRequest = () => controller.abort(requestSignal.reason);

  if (requestSignal.aborted) {
    abortFromRequest();
  } else {
    requestSignal.addEventListener("abort", abortFromRequest, { once: true });
  }

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timeout);
      requestSignal.removeEventListener("abort", abortFromRequest);
    },
  };
}

async function generateWithGemini(
  config: ProviderConfig,
  systemInstruction: string,
  history: ChatTurn[],
  prompt: string,
  requestSignal: AbortSignal,
): Promise<string> {
  const timeout = makeTimeoutSignal(requestSignal);
  try {
    const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    const contents = [
      ...history.map((turn) => ({
        role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: turn.content }],
      })),
      { role: "user" as const, parts: [{ text: prompt }] },
    ];
    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: timeout.signal,
      },
    });
    const answer = response.text?.trim();
    if (!answer) {
      throw new AiProviderError(
        "Gemini returned an empty response. Please retry your question.",
        502,
        "empty_provider_response",
      );
    }
    return answer;
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    throw classifyProviderError("gemini", error, timeout.signal);
  } finally {
    timeout.dispose();
  }
}

async function generateWithOpenRouter(
  config: ProviderConfig,
  systemInstruction: string,
  history: ChatTurn[],
  prompt: string,
  requestSignal: AbortSignal,
): Promise<string> {
  const timeout = makeTimeoutSignal(requestSignal);
  try {
    const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openrouter.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:5000",
        "X-Title": "Nexora Copilot",
      },
      body: JSON.stringify({
        model: config.openrouter.model,
        messages: [
          { role: "system", content: systemInstruction },
          ...history.map((turn) => ({
            role: turn.role,
            content: turn.content,
          })),
          { role: "user", content: prompt },
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
      }),
      signal: timeout.signal,
    });

    const payload = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
      error?: { message?: string; code?: string | number };
    } | null;

    if (!response.ok) {
      const detail = `${payload?.error?.code ?? ""} ${payload?.error?.message ?? ""}`.toLowerCase();
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new AiProviderError(
          "OpenRouter rejected the API key or account permissions. Check OPENROUTER_API_KEY.",
          502,
          "provider_authentication_failed",
        );
      }
      if (status === 402 || /insufficient|credit|billing/.test(detail)) {
        throw new AiProviderError(
          "OpenRouter reports insufficient credits or billing is unavailable. Check your OpenRouter account.",
          502,
          "provider_credits_unavailable",
        );
      }
      if (status === 404 || status === 400) {
        throw new AiProviderError(
          "OpenRouter could not use the configured model or request. Check OPENROUTER_MODEL.",
          502,
          "provider_model_or_request_invalid",
        );
      }
      if (status === 429) {
        const quota = /quota|insufficient|credit|billing/.test(detail);
        throw new AiProviderError(
          quota
            ? "OpenRouter reports exhausted quota or unavailable billing. Check your OpenRouter account."
            : "OpenRouter is temporarily rate limiting requests. Please try again shortly.",
          503,
          quota ? "provider_quota_exhausted" : "provider_rate_limited",
          !quota,
        );
      }
      if (status >= 500) {
        throw new AiProviderError(
          "OpenRouter is temporarily unavailable. Please try again shortly.",
          503,
          "provider_unavailable",
          true,
        );
      }
      throw new AiProviderError(
        "OpenRouter could not complete this request.",
        502,
        "provider_request_failed",
      );
    }

    const content = payload?.choices?.[0]?.message?.content;
    const answer = Array.isArray(content)
      ? content
          .map((part) => part.text ?? "")
          .join("")
          .trim()
      : content?.trim();
    if (!answer) {
      throw new AiProviderError(
        "OpenRouter returned an empty response. Please retry your question.",
        502,
        "empty_provider_response",
      );
    }
    return answer;
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    throw classifyProviderError("openrouter", error, timeout.signal);
  } finally {
    timeout.dispose();
  }
}

function classifyProviderError(
  provider: ProviderName,
  error: unknown,
  signal: AbortSignal,
): AiProviderError {
  if (signal.aborted) {
    if (signal.reason instanceof Error && signal.reason.message === "Provider request timed out") {
      return new AiProviderError(
        `${provider === "gemini" ? "Gemini" : "OpenRouter"} timed out. Please try again.`,
        504,
        "provider_timeout",
        true,
      );
    }
    return new AiProviderError("Request was cancelled.", 499, "request_cancelled");
  }

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : undefined;
  const detail = error instanceof Error ? error.message.toLowerCase() : "";
  const providerName = provider === "gemini" ? "Gemini" : "OpenRouter";

  if (status === 401 || status === 403) {
    return new AiProviderError(
      `${providerName} rejected the API key or account permissions. Check the backend provider configuration.`,
      502,
      "provider_authentication_failed",
    );
  }
  if (status === 402 || /insufficient|credit|billing/.test(detail)) {
    return new AiProviderError(
      `${providerName} reports insufficient credits or billing is unavailable.`,
      502,
      "provider_credits_unavailable",
    );
  }
  if (status === 404 || status === 400) {
    return new AiProviderError(
      `${providerName} could not use the configured model or request. Check the configured model ID.`,
      502,
      "provider_model_or_request_invalid",
    );
  }
  if (status === 429) {
    const quota = /quota|billing|credit|resource_exhausted/.test(detail);
    return new AiProviderError(
      quota
        ? `${providerName} has exhausted its quota. Check the provider account or quota.`
        : `${providerName} is temporarily rate limiting requests. Please try again shortly.`,
      503,
      quota ? "provider_quota_exhausted" : "provider_rate_limited",
      !quota,
    );
  }
  if (typeof status === "number" && status >= 500) {
    return new AiProviderError(
      `${providerName} is temporarily unavailable. Please try again shortly.`,
      503,
      "provider_unavailable",
      true,
    );
  }
  return new AiProviderError(
    `Could not reach ${providerName}. Check your connection and try again.`,
    503,
    "provider_connection_failed",
    true,
  );
}

export async function generateAnswer(
  systemInstruction: string,
  history: ChatTurn[],
  prompt: string,
  signal: AbortSignal,
): Promise<{ answer: string; provider: ProviderName; model: string; usedFallback: boolean }> {
  const config = getProviderConfig();
  const primaryModel = config.provider === "gemini" ? config.gemini.model : config.openrouter.model;

  try {
    const answer = await generateWithProvider(
      config.provider,
      config,
      systemInstruction,
      history,
      prompt,
      signal,
    );
    return { answer, provider: config.provider, model: primaryModel, usedFallback: false };
  } catch (error) {
    if (
      !config.fallbackEnabled ||
      !(error instanceof AiProviderError) ||
      !error.canFallback ||
      signal.aborted
    ) {
      throw error;
    }

    const fallback: ProviderName = config.provider === "gemini" ? "openrouter" : "gemini";
    const model = fallback === "gemini" ? config.gemini.model : config.openrouter.model;
    const answer = await generateWithProvider(
      fallback,
      config,
      systemInstruction,
      history,
      prompt,
      signal,
    );
    return { answer, provider: fallback, model, usedFallback: true };
  }
}
