// Server function: runs only on the server, so the AI key never reaches the browser.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import type { PricingSummary } from "./pricing";

// ---- The JSON shape the AI must return (strict schema) ----
export const planSchema = z.object({
  pricing: z.object({
    explanation: z.string(),
    suggestedPriceRange: z.object({ low: z.number(), high: z.number() }),
    tips: z.array(z.string()),
  }),
  calendar: z.array(
    z.object({
      day: z.string(),
      platform: z.string(),
      idea: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
    }),
  ),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export type Plan = z.infer<typeof planSchema>;

export type PlanInput = {
  businessType: string;
  targetCustomers: string;
  community: string;
  currency: string;
  language: "en" | "ar";
  pricing: PricingSummary;
};

// ---- System prompt: honesty rules are the most important part ----
const SYSTEM_PROMPT = `You are LocalBoost, a friendly assistant for small and home-based sellers.
RULES (must follow):
1. Never invent statistics, percentages, survey results, or market data.
2. Never promise or guarantee income, sales, or growth. Use words like "may" and "could".
3. Never recalculate the numbers you are given. Use them exactly as provided.
4. No fake testimonials, no medical or legal claims.
5. Keep advice practical, local, and low-cost.
6. Write ALL text in the requested language (English or Arabic). Hashtags may stay in English if common.
OUTPUT: exactly 7 calendar days (Day 1 to Day 7), exactly 5 FAQs, 2-4 pricing tips.
The suggested price range is per item, for the main product, in the given currency.`;

export const generatePlan = createServerFn({ method: "POST" })
  .validator((input: PlanInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");

    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const userPrompt = `Language: ${data.language === "ar" ? "Arabic" : "English"}
Business type: ${data.businessType}
Target customers: ${data.targetCustomers}
Community: ${data.community}
Currency: ${data.currency}
Pricing numbers calculated in code (do not change them):
${JSON.stringify(data.pricing, null, 2)}`;

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: planSchema }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const plan = (await result.output) as Plan;
      return { ok: true as const, plan };
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.error("generatePlan failed", status, err);
      if (status === 429) return { ok: false as const, error: "Too many requests. Please wait a minute and try again." };
      if (status === 402) return { ok: false as const, error: "AI credits have run out. Add credits in workspace settings." };
      return { ok: false as const, error: "The AI couldn't create your plan. Please try again." };
    }
  });
