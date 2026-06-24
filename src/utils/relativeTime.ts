export function relativeTime(ts: number, short = false): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return short ? 'now' : 'just now';
  if (mins < 60) return short ? `${mins}m` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return short ? `${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return short ? `${days}d` : `${days}d ago`;
}
