/** durationMs → "42s" · "1m 42s" · "2m 3s". */
export function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "—";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
