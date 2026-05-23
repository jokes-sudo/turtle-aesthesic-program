import { NextRequest, NextResponse } from "next/server";
import { anthropic, AI_SYSTEM_PROMPTS } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { section, messages, contextData } = await req.json();

    const systemPrompt = AI_SYSTEM_PROMPTS[section] ?? AI_SYSTEM_PROMPTS.health;
    const fullSystem = contextData
      ? `${systemPrompt}\n\nCurrent user data context:\n${contextData}`
      : systemPrompt;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: fullSystem,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const message = response.content[0];
    if (message.type !== "text") throw new Error("Unexpected response type");

    return NextResponse.json({ message: message.text });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
