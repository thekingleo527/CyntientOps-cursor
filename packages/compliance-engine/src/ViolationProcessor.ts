export class ViolationProcessor {
  /** Deduplicate by composite key generator (e.g., id+bin) */
  static deduplicate<T>(items: T[], keyFn: (v: T) => string): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const v of items) {
      const key = keyFn(v);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    }
    return out;
  }
}

