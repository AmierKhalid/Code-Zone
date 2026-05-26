import { NextResponse } from "next/server";

type ExecuteRequest = {
  language?: string;
  code?: string;
};

// JDoodle language name + version index mapping
// See: https://www.jdoodle.com/compiler-api/v1/list-of-all-languages
const JDOODLE_LANGS: Record<string, { language: string; versionIndex: string }> = {
  javascript: { language: "nodejs",    versionIndex: "4" },
  typescript: { language: "typescript", versionIndex: "1" },
  python:     { language: "python3",   versionIndex: "4" },
  java:       { language: "java",      versionIndex: "5" },
  csharp:     { language: "csharp",    versionIndex: "4" },
  cpp:        { language: "cpp17",     versionIndex: "1" },
  go:         { language: "go",        versionIndex: "4" },
  rust:       { language: "rust",      versionIndex: "4" },
  bash:       { language: "bash",      versionIndex: "5" },
};

// Static/markup languages that cannot be executed
const STATIC_LANGS = new Set(["sql", "json", "css", "xml"]);

const JDOODLE_API = "https://api.jdoodle.com/v1/execute";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExecuteRequest;
    const language = (body.language || "").toLowerCase();
    const source = body.code || "";

    if (!source.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Static/markup languages
    if (STATIC_LANGS.has(language)) {
      return NextResponse.json({
        output: `"${language}" is a markup/data language and cannot be executed directly.`,
        exitCode: 0,
      });
    }

    const langConfig = JDOODLE_LANGS[language];
    if (!langConfig) {
      return NextResponse.json(
        { error: `Language "${language}" is not supported yet` },
        { status: 400 }
      );
    }

    const clientId     = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Code execution is not configured on the server. Please set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET." },
        { status: 503 }
      );
    }

    const jdoodleRes = await fetch(JDOODLE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script:       source,
        language:     langConfig.language,
        versionIndex: langConfig.versionIndex,
      }),
    });

    if (!jdoodleRes.ok) {
      const errorText = await jdoodleRes.text();
      console.error("JDoodle API error:", jdoodleRes.status, errorText);
      return NextResponse.json(
        { error: `Execution service error (${jdoodleRes.status}). Please try again later.` },
        { status: 502 }
      );
    }

    const data = await jdoodleRes.json() as {
      output?: string;
      statusCode?: number;
      memory?: string;
      cpuTime?: string;
      error?: string;
    };

    // JDoodle returns statusCode 200 for success, non-200 for compile/runtime errors
    const output = (data.output || "Program finished with no output.").trim();
    const exitCode = (data.statusCode === 200 || data.statusCode === undefined) ? 0 : 1;

    return NextResponse.json({ output, exitCode });
  } catch (error) {
    console.error("Code execution error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
