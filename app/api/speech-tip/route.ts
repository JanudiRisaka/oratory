// app/api/speech-tip/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const cache = {
  tip: "",
  lastFetched: 0,
};

const CACHE_DURATION_MS = 60 * 60 * 100000;

export async function GET() {
  const now = Date.now();

  if (cache.tip && now - cache.lastFetched < CACHE_DURATION_MS) {
    return NextResponse.json({ tip: cache.tip, fromCache: true });
  }

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      "Give me one short, actionable public speaking tip related to confidence, body language, or facial expressions. Keep it under 25 words.";

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = result?.response?.text?.().trim();
    if (!text) {
      return NextResponse.json({
        tip: "Pause briefly after key points and smile—your face projects calm, your pause projects confidence.",
        fromFallback: true,
      });
    }

    cache.tip = text;
    cache.lastFetched = now;

    return NextResponse.json({ tip: text, fromCache: false });

  } catch (err: any) {
    console.error("[Gemini API ERROR]", err);

    if (cache.tip) {
      return NextResponse.json({
        tip: cache.tip,
        fromCache: true,
        error: "API limit reached, serving stale tip."
      });
    }

    return NextResponse.json({
      tip: "Make eye contact for 2-3 seconds per person—short, steady contact signals confidence.",
      fromFallback: true,
    });
  }
}