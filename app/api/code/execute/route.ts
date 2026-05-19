import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

type ExecuteRequest = {
  language?: string;
  code?: string;
};

const SUPPORTED: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  csharp: "csharp",
  cpp: "cpp",
  go: "go",
  rust: "rust",
  sql: "sql",
  json: "json",
  css: "css",
  xml: "xml",
  bash: "bash",
};

const EXEC_TIMEOUT_MS = 8000;

type ProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

function runCommand(
  command: string,
  args: string[],
  timeoutMs = EXEC_TIMEOUT_MS,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        child.kill();
        reject(new Error("Execution timed out"));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (!finished) {
        finished = true;
        reject(err);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (!finished) {
        finished = true;
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      }
    });
  });
}

async function executeWithNode(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-node-"));
  const filePath = join(dir, "script.js");
  try {
    await writeFile(filePath, source, "utf8");
    return await runCommand("node", [filePath]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithPython(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-py-"));
  const filePath = join(dir, "script.py");
  try {
    await writeFile(filePath, source, "utf8");
    try {
      return await runCommand("python", [filePath]);
    } catch {
      return await runCommand("py", [filePath]);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithJava(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-java-"));
  const filePath = join(dir, "Main.java");
  try {
    await writeFile(filePath, source, "utf8");
    return await runCommand("java", [filePath]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithGo(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-go-"));
  const filePath = join(dir, "main.go");
  try {
    await writeFile(filePath, source, "utf8");
    return await runCommand("go", ["run", filePath]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithRust(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-rust-"));
  const filePath = join(dir, "main.rs");
  const outPath = join(dir, "main.exe");
  try {
    await writeFile(filePath, source, "utf8");
    const compileResult = await runCommand("rustc", [filePath, "-o", outPath]);
    if (compileResult.exitCode !== 0) return compileResult;
    return await runCommand(outPath, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithCpp(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-cpp-"));
  const filePath = join(dir, "main.cpp");
  const outPath = join(dir, "main.exe");
  try {
    await writeFile(filePath, source, "utf8");
    const compileResult = await runCommand("g++", [filePath, "-o", outPath]);
    if (compileResult.exitCode !== 0) return compileResult;
    return await runCommand(outPath, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithCSharp(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-cs-"));
  const filePath = join(dir, "Program.cs");
  const outPath = join(dir, "Program.exe");
  try {
    await writeFile(filePath, source, "utf8");
    const compileResult = await runCommand("csc", [filePath, `/out:${outPath}`]);
    if (compileResult.exitCode !== 0) return compileResult;
    return await runCommand(outPath, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function executeWithBash(source: string): Promise<ProcessResult> {
  const dir = await mkdtemp(join(tmpdir(), "code-zone-bash-"));
  const filePath = join(dir, "script.sh");
  try {
    await writeFile(filePath, source, "utf8");
    return await runCommand("bash", [filePath]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExecuteRequest;
    const language = (body.language || "").toLowerCase();
    const source = body.code || "";

    if (!source.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!SUPPORTED[language]) {
      return NextResponse.json(
        { error: `Language "${language}" is not supported yet` },
        { status: 400 },
      );
    }

    let result: ProcessResult;
    if (["sql", "json", "css", "xml"].includes(language)) {
      return NextResponse.json({
        output: `Language "${language}" is a markup or data language and cannot be executed directly.`,
        exitCode: 0,
      });
    } else if (language === "python") {
      result = await executeWithPython(source);
    } else if (language === "java") {
      result = await executeWithJava(source);
    } else if (language === "go") {
      result = await executeWithGo(source);
    } else if (language === "rust") {
      result = await executeWithRust(source);
    } else if (language === "cpp") {
      result = await executeWithCpp(source);
    } else if (language === "csharp") {
      result = await executeWithCSharp(source);
    } else if (language === "bash") {
      result = await executeWithBash(source);
    } else if (language === "typescript") {
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
        },
      }).outputText;
      result = await executeWithNode(transpiled);
    } else {
      result = await executeWithNode(source);
    }

    const stdout = result.stdout || "";
    const stderr = result.stderr || "";
    const output = (stdout + (stderr ? `\n${stderr}` : "")).trim();

    return NextResponse.json({
      output: output || "Program finished with no output.",
      exitCode: result.exitCode ?? 0,
    });
  } catch (error) {
    console.error("Code execution error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

