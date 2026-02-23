import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { getEncoding } from "js-tiktoken";
import { getPromptConfig } from "./config";
import { preprocessDocument } from "./preprocessing";

export const createOpenAIClient = () => {
  const config = useRuntimeConfig();

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
  });

  return openai;
};

/**
 * Allowed OpenAI models whitelist
 * [SECURITY FIX L4] Prevents unauthorized model usage via config tampering
 */
const ALLOWED_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-5-mini",
  "gpt-5",
  "o1-mini",
  "o1",
  "o3-mini",
] as const;

type AllowedModel = (typeof ALLOWED_MODELS)[number];

/**
 * Validates model name against whitelist
 * [SECURITY FIX L4] Prevents injection of unauthorized model names
 */
function validateModel(model: string): {
  valid: boolean;
  model?: AllowedModel;
} {
  if (!model || typeof model !== "string") {
    return { valid: false };
  }

  const trimmedModel = model.trim();

  if (ALLOWED_MODELS.includes(trimmedModel as AllowedModel)) {
    return { valid: true, model: trimmedModel as AllowedModel };
  }

  console.error("[SECURITY] Invalid model configured:", model);
  return { valid: false };
}

export const analyzeContract = async (
  contractText: string,
  analysisType: "basic" | "premium" | "forensic" = "premium",
) => {
  // Define timeouts per tier (in milliseconds)
  // Forensic tier needs longer timeout for 120k input / 30k output token processing
  const timeouts = {
    basic: 120000,     // 2 minutes
    premium: 300000,   // 5 minutes
    forensic: 600000,  // 10 minutes
  };
  const timeout = timeouts[analysisType];

  const config = useRuntimeConfig();

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    timeout,
  });

  // 1. Load Dynamic Configuration
  const promptConfig = await getPromptConfig();
  const { tiers, features } = promptConfig;

  // Force V2 if configured (or default to V2 if random string). We only support V2 now.
  const versionToUse = "v2";

  // 2. Resolve Parameters
  const tier = tiers[analysisType] || tiers.premium;
  const rawModel = tier.model || "gpt-4o-mini";

  // [SECURITY FIX L4] Validate model against whitelist
  const modelValidation = validateModel(rawModel);
  if (!modelValidation.valid) {
    throw new Error("Invalid AI model configuration. Please contact support.");
  }
  const model = modelValidation.model!;

  const limits = tier.tokenLimits || { input: 8000, output: 800 };

  // 3. Load System Prompt -- Strict V2 Path
  // Explicitly handle all three tiers: basic, premium, forensic
  const promptFile =
    analysisType === "basic"
      ? "basic-analysis-prompt.txt"
      : analysisType === "forensic"
        ? "forensic-analysis-prompt.txt"
        : "analysis-prompt.txt";
  const promptPath = path.resolve(
    process.cwd(),
    `server/prompts/${versionToUse}/${promptFile}`,
  );

  let systemPrompt = "";
  try {
    systemPrompt = await fs.readFile(promptPath, "utf-8");
  } catch {
    console.error(`CRITICAL: Failed to load prompt from ${promptPath}`);
    // [SECURITY FIX H3] Don't expose file paths
    throw new Error("System configuration error. Please contact support.");
  }

  // 4. Preprocessing & Token Control
  let processedText = contractText;
  let metadata: any = {};

  if (features.preprocessing) {
    // Reserve buffer for system prompt + safety
    // Forensic tier gets larger buffer (5k) to maximize 120k context window
    // for its target 15k-40k output. Basic/Premium use 2k buffer.
    const buffer = analysisType === "forensic" ? 5000 : 2000;
    const availableContext = limits.input - buffer;
    const result = preprocessDocument(contractText, availableContext);

    processedText = result.processedText;
    metadata = {
      preprocessing: {
        originalTokens: result.originalTokenCount,
        processedTokens: result.processedTokenCount,
        truncated: result.wasTruncated,
        relevantSections: result.relevantSectionsFound,
      },
    };

    if (features.tokenDebug) {
      console.log(
        `[Analysis Debug] Type: ${analysisType} | Version: ${versionToUse}`,
      );
      console.log(
        `[Analysis Debug] Tokens: ${result.processedTokenCount} / ${limits.input} (Original: ${result.originalTokenCount})`,
      );
    }
  } else {
    const _enc = getEncoding("cl100k_base");
    const tokens = _enc.encode(contractText);
    if (tokens.length > limits.input) {
      processedText = _enc.decode(tokens.slice(0, limits.input));
      metadata.truncated_legacy = true;
    }
  }

  const userPrompt = `
Texto del contrato a analizar:
${processedText}
`;

  let rawContent = "";
  try {
    // Debug logging for Forensic tier
    if (analysisType === "forensic") {
      console.log("[Forensic] Forensic tier selected - using gpt-5 with 120k input / 30k output tokens");
      console.log("[Forensic] Optimized prompt v2.0 - target 8k-20k output for faster completion");
    }
    console.log("Using model:", model);
    console.log("Using limits:", limits);
    const isReasoningOrGpt5 =
      model.startsWith("o") || model.startsWith("gpt-5");

    const completionParams: any = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
    };

    if (isReasoningOrGpt5) {
      completionParams.max_completion_tokens = limits.output;
      completionParams.temperature = 1;
    } else {
      completionParams.max_tokens = limits.output;
      completionParams.temperature = 0.1;
    }

    const response = await openai.chat.completions.create(completionParams);

    // Log token usage for Forensic tier
    if (analysisType === "forensic" && response.usage) {
      console.log("[Forensic] Token usage:", {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      });
    }

    console.log("OpenAI Choice Details:", {
      finish_reason: response.choices[0]?.finish_reason,
      has_message: !!response.choices[0]?.message,
      has_content: !!response.choices[0]?.message?.content,
      refusal: (response.choices[0]?.message as any)?.refusal,
    });

    rawContent = response.choices[0]?.message?.content || "";
    if (!rawContent) {
      const choice = response.choices[0];
      const message = choice?.message as any;

      if (message?.refusal) {
        console.error("OpenAI Refusal:", message.refusal);
        // [SECURITY FIX H3] Don't expose OpenAI refusal details
        const err: any = new Error(
          "Unable to analyze contract. Please try again or contact support.",
        );
        err.debugInfo = { type: "REFUSAL", model };
        throw err;
      }

      if (choice?.finish_reason === "length") {
        console.error("OpenAI hit token limit during reasoning/generation");
        throw new Error(
          "El análisis es demasiado complejo para el límite de tokens actual. Intenta con un contrato más corto o aumenta el límite en configuración.",
        );
      }

      console.error("Empty response choices[0]");
      // [SECURITY FIX H3] Don't expose OpenAI response structure
      throw new Error("Failed to process AI response. Please try again.");
    }

    let result: any;
    try {
      // Robust JSON extraction
      const firstBrace = rawContent.indexOf("{");
      const lastBrace = rawContent.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonCandidate = rawContent.substring(firstBrace, lastBrace + 1);
        result = JSON.parse(jsonCandidate);
      } else {
        // Fallback attempt
        const cleanContent = rawContent
          .replace(/^```json\s*/, "")
          .replace(/^```\s*/, "")
          .replace(/```$/, "")
          .trim();
        result = JSON.parse(cleanContent);
      }
    } catch (_parseError: any) {
      // [SECURITY FIX H3] Log full error but throw safe message
      console.error("JSON parse error:", _parseError.message);
      const debugInfo = {
        errorType: "INVALID_JSON",
        model_used: model,
      };
      const error: any = new Error(
        "Failed to parse analysis results. Please try again.",
      );
      error.debugInfo = debugInfo;
      throw error;
    }

    // 5. Attach Metadata (Always attach if available, frontend decides visibility)
    const debugInfo = {
      ...metadata,
      model_used: model,
      prompt_version: versionToUse,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    };

    if (!result._debug) {
      result._debug = debugInfo;
    } else {
      Object.assign(result._debug, debugInfo);
    }

    return result;
  } catch (error: any) {
    // [SECURITY FIX H3] Log full error but wrap with safe message
    console.error("Error analyzing contract with OpenAI:", error.message);

    // If it's already our custom error with debugInfo, rethrow it
    if (error.debugInfo) {
      throw error;
    }

    // Check for specific error types and provide safe messages
    if (error.message?.includes("token")) {
      throw new Error(
        "Token limit exceeded. Please try with a shorter contract.",
      );
    }

    if (error.message?.includes("timeout")) {
      throw new Error(
        "Analysis timed out due to document complexity. Consider using a shorter document or contact support for forensic analysis.",
      );
    }

    if (
      error.message?.includes("API") ||
      error.message?.includes("connection")
    ) {
      throw new Error(
        "AI service temporarily unavailable. Please try again later.",
      );
    }

    // Generic safe error
    const wrappedError: any = new Error(
      "Error during AI analysis. Please try again.",
    );
    wrappedError.debugInfo = {
      errorType: "API_ERROR",
      model_used: model,
    };
    throw wrappedError;
  }
};
