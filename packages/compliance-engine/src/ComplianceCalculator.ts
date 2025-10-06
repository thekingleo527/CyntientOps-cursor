import type { LL97Emission } from '@cyntientops/domain-schema';

export class ComplianceCalculator {
  /**
   * LL11 next due date: +5 years from latest facade filing/inspection date.
   * If no dates provided, returns null.
   */
  static calculateLL11NextDue(dates: Array<string | Date>): Date | null {
    if (!dates || dates.length === 0) return null;
    const latest = dates
      .map(d => (d instanceof Date ? d : new Date(d)))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (!latest) return null;
    const next = new Date(latest);
    next.setFullYear(next.getFullYear() + 5);
    return next;
  }

  /**
   * LL97 next due (reporting): May 1 following the latest reporting year found.
   * If no emissions provided, returns null.
   */
  static calculateLL97NextDue(emissions: LL97Emission[]): Date | null {
    if (!emissions || emissions.length === 0) return null;
    const latestYear = emissions
      .map(e => e.year)
      .filter(y => typeof y === 'number' && y > 1900)
      .sort((a, b) => b - a)[0];
    if (!latestYear) return null;
    return new Date(latestYear + 1, 4, 1); // May (4) 1st next year
  }

  /**
   * Compliance score (0-100). Deduct by severity/open counts and emissions average.
   * Inputs are generic; callers map their data to this shape.
   */
  static calculateComplianceScore(input: {
    openCritical: number;
    openWarning: number;
    openInfo: number;
    avgEmissions?: number; // LL97 intensity; normalize loosely
    outstandingFines?: number; // DSNY dollars
  }): number {
    let score = 100;
    score -= input.openCritical * 12;
    score -= input.openWarning * 6;
    score -= input.openInfo * 2;
    if (input.avgEmissions && input.avgEmissions > 0) {
      // Emissions penalty: scaled by intensity bands
      if (input.avgEmissions > 12) score -= 10;
      else if (input.avgEmissions > 8) score -= 6;
      else if (input.avgEmissions > 5) score -= 3;
    }
    if (input.outstandingFines && input.outstandingFines > 0) {
      score -= Math.min(15, Math.floor(input.outstandingFines / 500));
    }
    return Math.max(0, Math.min(100, score));
  }
}

