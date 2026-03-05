/**
 * Format large numbers as compact strings (e.g. 1200000 -> "1.2M")
 */
export function formatCount(count: bigint | number): string {
  const n = typeof count === "bigint" ? Number(count) : count;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Format a bigint timestamp (nanoseconds from ICP or milliseconds) to relative time
 */
export function formatTimestamp(timestamp: bigint): string {
  let ms = Number(timestamp);
  // If timestamp looks like nanoseconds (> year 2000 in ns), convert
  if (ms > 1_600_000_000_000_000) {
    ms = ms / 1_000_000;
  }
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}
