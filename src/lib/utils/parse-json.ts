/** LLM이 반환한 JSON에서 흔한 오류를 보정합니다. */
export function repairJsonText(text: string): string {
  let s = text.trim();

  // 스마트 따옴표 → ASCII
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // JSON 문자열 밖의 제어 문자 제거
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // trailing comma: ,] or ,}
  s = s.replace(/,\s*([}\]])/g, "$1");

  // 문자열 내부의 실제 줄바꿈 → 공백 (JSON 파싱 오류 방지)
  s = s.replace(/"([^"\\]|\\.)*"/g, (segment) =>
    segment.replace(/\r\n|\n|\r/g, " ")
  );

  // 잘린 JSON — 열린 괄호 닫기 시도
  const openBraces = (s.match(/{/g) ?? []).length;
  const closeBraces = (s.match(/}/g) ?? []).length;
  const openBrackets = (s.match(/\[/g) ?? []).length;
  const closeBrackets = (s.match(/]/g) ?? []).length;

  if (openBrackets > closeBrackets) {
    s += "]".repeat(openBrackets - closeBrackets);
  }
  if (openBraces > closeBraces) {
    s += "}".repeat(openBraces - closeBraces);
  }

  return s;
}

export function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);

  return text.trim();
}

export function parseJsonWithRepair<T>(text: string): T {
  const raw = extractJsonBlock(text);
  const candidates = [raw, repairJsonText(raw)];

  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  const hint = lastError?.message ?? "unknown";
  throw new Error(`JSON 파싱 실패: ${hint}`);
}
