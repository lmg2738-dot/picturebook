import path from "path";

const AIHUB_SHELL_URL = "https://api.aihub.or.kr/api/aihubshell.do";

export function getAihubApiKey(): string {
  const key = process.env.AIHUB_API_KEY;
  if (!key) {
    throw new Error(
      "AIHUB_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    );
  }
  return key;
}

export function getAihubShellPath(): string {
  if (process.env.AIHUB_SHELL_PATH) {
    return process.env.AIHUB_SHELL_PATH;
  }

  const localTool = path.join(process.cwd(), "tools", "aihubshell");
  return localTool;
}

export { AIHUB_SHELL_URL };
