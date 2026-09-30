/**
 * The one clock format in the app: 24-hour "13:42", as used in Thailand and
 * by most of the nomad crowd. Local time.
 */
export function formatTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
