import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const CommentModerationSchema = z.object({
  violating: z.boolean().describe("Whether the comment contains toxic, offensive, dirty, or inappropriate language"),
  category: z.string().describe("Category of violation if violating (e.g. Hate Speech, Profanity, Harassment, Sexual/Dirty, None)"),
  reason: z.string().describe("Concise explanation in Indonesian for the decision"),
});

export type ModerationResult = z.infer<typeof CommentModerationSchema>;

function getModel() {
  const provider = process.env.AI_PROVIDER || "openai";
  const apiKey = process.env.AI_API_KEY || "mock-key";
  const baseURL = process.env.AI_BASE_URL;
  const modelName = process.env.AI_MODEL || (provider === "anthropic" ? "claude-3-5-haiku-20241022" : "gpt-4o-mini");

  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey, baseURL });
    return anthropic(modelName);
  }

  // Default to OpenAI-compatible provider
  const openai = createOpenAI({ apiKey, baseURL });
  return openai(modelName);
}

export async function analyzeComment(text: string): Promise<ModerationResult> {
  // Mock mode for local testing without valid API key
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "mock-key" || process.env.AI_API_KEY.startsWith("your_")) {
    const toxicKeywords = ["babi", "anjing", "kontol", "memek", "goblok", "tolol", "bangsat", "tai", "kampang"];
    const isToxic = toxicKeywords.some((word) => text.toLowerCase().includes(word));

    return {
      violating: isToxic,
      category: isToxic ? "Kata Kasar & Tidak Pantas" : "Aman",
      reason: isToxic
        ? "Komentar terdeteksi mengandung kata kasar atau makian yang dilarang."
        : "Komentar sopan dan sesuai standar komunitas.",
    };
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: CommentModerationSchema,
      system:
        "Anda adalah AI Moderator Komentar untuk aplikasi kampus/sekolah.ugas Anda adalah mengevaluasi apakah sebuah komentar mengandung kata-kata kasar, jorok, hinaan, SARA, atau konten tidak pantas. Jawablah dalam format JSON yang valid.",
      prompt: `Evaluasi komentar berikut:\n"${text}"`,
    });

    return object;
  } catch (error) {
    console.error("AI Provider error:", error);
    // Fallback if AI service fails
    return {
      violating: false,
      category: "Error Provider",
      reason: "Gagal menghubungkan ke AI Provider, evaluasi dilewati.",
    };
  }
}
