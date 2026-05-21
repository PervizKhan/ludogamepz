export function parseRolls(raw: unknown): number[] {
  if (!raw) return [];

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is number => typeof item === 'number')
        : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(raw)
    ? raw.filter((item): item is number => typeof item === 'number')
    : [];
}
