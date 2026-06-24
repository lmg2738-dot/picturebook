import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getAihubApiKey, getAihubShellPath } from "./config";
import type {
  AihubDatasetSummary,
  AihubDownloadParams,
  AihubFileEntry,
  AihubListDatasetsParams,
} from "./types";

function resolveShellExecutable(): { command: string; argsPrefix: string[] } {
  const shellPath = getAihubShellPath();

  if (process.platform === "win32") {
    if (fs.existsSync(shellPath)) {
      return { command: "bash", argsPrefix: [shellPath] };
    }
    return { command: "bash", argsPrefix: ["aihubshell"] };
  }

  if (fs.existsSync(shellPath)) {
    return { command: shellPath, argsPrefix: [] };
  }

  return { command: "aihubshell", argsPrefix: [] };
}

export async function runAihubshell(args: string[]): Promise<string> {
  const { command, argsPrefix } = resolveShellExecutable();
  const apiKey = getAihubApiKey();

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...argsPrefix, ...args, "-aihubapikey", apiKey], {
      cwd: process.cwd(),
      env: { ...process.env, LANG: "ko_KR.UTF-8", LC_ALL: "ko_KR.UTF-8" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("error", (err) => {
      reject(
        new Error(
          `aihubshell 실행 실패: ${err.message}. Git Bash/WSL 설치 또는 tools/aihubshell 다운로드가 필요합니다.`
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `aihubshell exited with code ${code}`));
        return;
      }
      resolve(stdout);
    });
  });
}

export function parseDatasetList(output: string): AihubDatasetSummary[] {
  const lines = output.split("\n");
  const results: AihubDatasetSummary[] = [];

  for (const line of lines) {
    const match = line.trim().match(/^(\d+)\s*,\s*(.+)$/);
    if (match) {
      results.push({ key: parseInt(match[1], 10), title: match[2].trim() });
    }
  }

  return results;
}

export function parseFileTree(output: string): AihubFileEntry[] {
  const lines = output.split("\n");
  const results: AihubFileEntry[] = [];
  const pathStack: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim() || line.includes("Fetching file tree")) continue;

    const fileMatch = line.match(/[├└│\s─]+([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*$/);
    if (fileMatch) {
      const name = fileMatch[1].trim();
      results.push({
        path: [...pathStack, name].join("/"),
        name,
        size: fileMatch[2].trim(),
        filekey: parseInt(fileMatch[3], 10),
      });
      continue;
    }

    const dirMatch = line.match(/[├└│\s─]+(.+)$/);
    if (dirMatch && !dirMatch[1].includes("|")) {
      const depth = (line.match(/│/g) || []).length;
      const dirName = dirMatch[1].trim();
      pathStack.length = depth;
      pathStack.push(dirName);
    }
  }

  return results;
}

export async function listDatasets(
  params: AihubListDatasetsParams = {}
): Promise<{ raw: string; items: AihubDatasetSummary[] | AihubFileEntry[] }> {
  const mode = params.mode ?? "l";
  const args = ["-mode", mode];

  if (params.datasetkey !== undefined) {
    args.push("-datasetkey", String(params.datasetkey));
  }
  if (params.datapckagekey !== undefined) {
    args.push("-datapckagekey", String(params.datapckagekey));
  }

  const raw = await runAihubshell(args);

  if (params.datasetkey !== undefined || params.datapckagekey !== undefined) {
    return { raw, items: parseFileTree(raw) };
  }

  return { raw, items: parseDatasetList(raw) };
}

export async function downloadDataset(params: AihubDownloadParams): Promise<string> {
  const args = ["-mode", params.mode];
  const outputDir = params.outputDir ?? path.join(process.cwd(), "downloads");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (params.datasetkey !== undefined) {
    args.push("-datasetkey", String(params.datasetkey));
  }
  if (params.datapckagekey !== undefined) {
    args.push("-datapckagekey", String(params.datapckagekey));
  }
  if (params.filekeys?.length) {
    args.push("-filekey", params.filekeys.join(","));
  }

  const apiKey = getAihubApiKey();
  const { command, argsPrefix } = resolveShellExecutable();

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...argsPrefix, ...args, "-aihubapikey", apiKey], {
      cwd: outputDir,
      env: { ...process.env, LANG: "ko_KR.UTF-8", LC_ALL: "ko_KR.UTF-8" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });
    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `aihubshell exited with code ${code}`));
        return;
      }
      resolve(stdout);
    });
  });
}
