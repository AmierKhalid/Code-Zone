import { NextResponse } from "next/server";
import { groqClient } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, language, model, stream = false } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Language is required" },
        { status: 400 },
      );
    }

    const groqModels = groqClient.getModels();
    const groqCodeModel =
      model && groqModels.includes(model)
        ? model
        : groqModels.find((m) => m.includes("70b")) ?? groqClient.defaultModel();

    if (stream) {
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            await groqClient.generateCodeExplanation(code, language, groqCodeModel, (chunk) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
              );
            });
            controller.close();
          } catch (error) {
            const msg =
              error instanceof Error ? error.message : "Explanation failed";
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
              );
            } catch {
              /* ignore */
            }
            controller.close();
          }
        },
      });

      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    } else {
      const explanation = await groqClient.generateCodeExplanation(
        code,
        language,
        groqCodeModel,
      );

      return NextResponse.json({
        explanation,
        model: groqCodeModel,
        language,
        fallback: false,
      });
    }
  } catch (error) {
    console.error("AI explain error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to explain code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
