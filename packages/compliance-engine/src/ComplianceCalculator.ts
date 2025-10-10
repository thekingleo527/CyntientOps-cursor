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
   * Compliance score (0-100) - Fixed for Real Data
   * Deduct by severity/open counts, emissions, and outstanding fines.
   */
  static calculateComplianceScore(input: {
    hpdViolations: number;
    dsnyViolations: number;
    fdnyFailures: number;
    complaints311: number;
    outstandingFines: number;
    avgEmissions?: number;
  }): {
    score: number;
    grade: string;
    status: 'excellent' | 'good' | 'medium' | 'poor' | 'critical';
  } {
    let score = 100;
    
    // HPD violations penalty (most severe)
    score -= input.hpdViolations * 8;
    
    // DSNY violations penalty
    score -= input.dsnyViolations * 6;
    
    // FDNY failures penalty (fire safety critical)
    score -= input.fdnyFailures * 10;
    
    // 311 complaints penalty
    score -= input.complaints311 * 3;
    
    // Outstanding fines penalty
    if (input.outstandingFines > 0) {
      score -= Math.min(20, input.outstandingFines / 1000); // Cap at 20 points
    }
    
    // Emissions penalty
    if (input.avgEmissions && input.avgEmissions > 0) {
      score -= Math.min(15, input.avgEmissions / 100); // Cap at 15 points
    }
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    // Calculate grade and status
    let grade: string;
    let status: 'excellent' | 'good' | 'medium' | 'poor' | 'critical';
    
    if (score >= 95) {
      grade = 'A+';
      status = 'excellent';
    } else if (score >= 90) {
      grade = 'A';
      status = 'excellent';
    } else if (score >= 85) {
      grade = 'A-';
      status = 'good';
    } else if (score >= 80) {
      grade = 'B+';
      status = 'good';
    } else if (score >= 75) {
      grade = 'B';
      status = 'medium';
    } else if (score >= 70) {
      grade = 'B-';
      status = 'medium';
    } else if (score >= 65) {
      grade = 'C+';
      status = 'poor';
    } else if (score >= 60) {
      grade = 'C';
      status = 'poor';
    } else if (score >= 50) {
      grade = 'D';
      status = 'critical';
    } else {
      grade = 'F';
      status = 'critical';
    }
    
    return { score: Math.round(score), grade, status };
  }

  /**
   * Legacy method for backward compatibility
   */
  static calculateLegacyComplianceScore(input: {
    openCritical: number;
    openWarning: number;
    openInfo: number;
    avgEmissions?: number;
    outstandingFines?: number;
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

