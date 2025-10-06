import { NYCAPIService } from './NYCAPIService';

export interface Building { id: string; bbl?: string; bin?: string; address?: string; name?: string }
export interface BuildingHistoricalData { buildingId: string; month: string; violations: number; permits: number; dsny: number }
export interface ComplianceTrend { month: string; total: number }

export class HistoricalDataService {
  constructor(private nyc: NYCAPIService) {}

  /**
   * Load monthly counts for HPD violations, DOB permits, and DSNY summons per building.
   * - Uses provided `bbl`/`bin` if present; falls back to `extractBBL/BIN(building.id)` mapping.
   * - DSNY uses address when available.
   */
  async loadHistoricalData(buildings: Building[], months = 12): Promise<BuildingHistoricalData[]> {
    const out: BuildingHistoricalData[] = [];
    const now = new Date();
    const monthsKeys: string[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    for (const b of buildings) {
      // Prefer provided identifiers; fallback to mapping helper
      const bbl = b.bbl && b.bbl.length > 0 ? b.bbl : this.nyc.extractBBL(b.id);
      const bin = b.bin && b.bin.length > 0 ? b.bin : this.nyc.extractBIN(b.id);
      const addr = b.address || '';
      try {
        const [violations, permits, dsnyViolations] = await Promise.all([
          bbl ? this.nyc.getHPDViolations(bbl) : Promise.resolve([]),
          bin ? this.nyc.getDOBPermits(bin) : Promise.resolve([]),
          addr ? this.nyc.getDSNYViolations(addr) : Promise.resolve([]),
        ]);

        const counts: Record<string, { v: number; p: number; d: number }> = {};
        monthsKeys.forEach((k) => (counts[k] = { v: 0, p: 0, d: 0 }));

        // HPD violations monthly count
        violations.forEach((v: any) => {
          const dd = new Date(v.novissueddate || v.inspectiondate || v.date || Date.now());
          const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
          if (key in counts) counts[key].v += 1;
        });

        // DOB permits monthly count
        permits.forEach((p: any) => {
          const dd = new Date(p.job_status_date || p.job_start_date || p.filing_date || Date.now());
          const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
          if (key in counts) counts[key].p += 1;
        });

        // DSNY summons monthly count
        dsnyViolations.forEach((d: any) => {
          const dd = new Date(d.violation_date || d.date || Date.now());
          const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
          if (key in counts) counts[key].d += 1;
        });

        monthsKeys.forEach((k) =>
          out.push({
            buildingId: b.id,
            month: k,
            violations: counts[k].v,
            permits: counts[k].p,
            dsny: counts[k].d,
          }),
        );
      } catch (err) {
        // On error, push zeros for requested window to keep graphs stable
        monthsKeys.forEach((k) => out.push({ buildingId: b.id, month: k, violations: 0, permits: 0, dsny: 0 }));
      }
    }
    return out;
  }

  async calculateComplianceTrend(data: BuildingHistoricalData[]): Promise<ComplianceTrend[]> {
    const byMonth: Record<string, number> = {};
    data.forEach((row) => {
      byMonth[row.month] = (byMonth[row.month] || 0) + row.violations;
    });
    return Object.keys(byMonth)
      .sort()
      .map((m) => ({ month: m, total: byMonth[m] }));
  }
}
