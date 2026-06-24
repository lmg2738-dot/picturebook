const KST_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

/** 서버(Vercel UTC)와 클라이언트 모두 한국 시간으로 통일 */
export function formatKstTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("ko-KR", KST_OPTIONS);
}

export function formatKstDateTime(iso: string): string {
  return formatKstTime(new Date(iso));
}
