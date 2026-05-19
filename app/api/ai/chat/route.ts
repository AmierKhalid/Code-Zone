import { NextResponse } from "next/server";
import { groqClient } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      conversationHistory = [],
      model,
      stream = false,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const history = conversationHistory.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      }),
    );

    if (stream) {
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            await groqClient.generateGeneralResponse(message, history, model, (chunk) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
              );
            });
            controller.close();
          } catch (error) {
            const msg =
              error instanceof Error
                ? error.message
                : "Stream generation failed";
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
              );
            } catch {
              // stream may already be closed
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
      const responseModel = groqClient.pickModel(model);
      const responseText = await groqClient.generateGeneralResponse(
        message,
        history,
        model,
      );

      return NextResponse.json({
        response: responseText,
        model: responseModel,
      });
    }
  } catch (error) {
    console.error("AI chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const groqOk = await groqClient.isAvailable();
    if (!groqOk) {
      return NextResponse.json({
        available: false,
        error: "Groq is not configured properly",
      }, { status: 500 });
    }

    const models = groqClient.getModels();
    return NextResponse.json({
      available: true,
      models,
      defaultModel: groqClient.defaultModel(),
      service: "groq",
    });
  } catch (error) {
    console.error("AI status check error:", error);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
