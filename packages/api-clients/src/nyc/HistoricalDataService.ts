import { NYCAPIService } from './NYCAPIService';

export interface Building { id: string; bbl?: string; bin?: string; address?: string; name?: string }
export interface BuildingHistoricalData { buildingId: string; month: string; violations: number; permits: number; dsny: number }
export interface ComplianceTrend { month: string; total: number }

export class HistoricalDataService {
  constructor(private nyc: NYCAPIService) {}

  async loadHistoricalData(buildings: Building[], months = 12): Promise<BuildingHistoricalData[]> {
    const out: BuildingHistoricalData[] = [];
    const now = new Date();
    const monthsKeys: string[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    for (const b of buildings) {
      const bbl = b.bbl || '';
      const bin = b.bin || '';
      try {
        const [violations, permits] = await Promise.all([
          this.nyc.getHPDViolations(bbl),
          this.nyc.getDOBPermits(bin)
        ]);
        const counts: Record<string, { v: number; p: number; d: number }> = {};
        monthsKeys.forEach(k => (counts[k] = { v: 0, p: 0, d: 0 }));
        violations.forEach((v: any) => {
          const dd = new Date(v.novissueddate || v.inspectiondate || Date.now());
          const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
          if (key in counts) counts[key].v += 1;
        });
        permits.forEach((p: any) => {
          const dd = new Date(p.job_status_date || p.job_start_date || Date.now());
          const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
          if (key in counts) counts[key].p += 1;
        });
        // DSNY left as zero unless a follow-up service fetch is added
        monthsKeys.forEach(k => out.push({ buildingId: b.id, month: k, violations: counts[k].v, permits: counts[k].p, dsny: counts[k].d }));
      } catch {
        monthsKeys.forEach(k => out.push({ buildingId: b.id, month: k, violations: 0, permits: 0, dsny: 0 }));
      }
    }
    return out;
  }

  async calculateComplianceTrend(data: BuildingHistoricalData[]): Promise<ComplianceTrend[]> {
    const byMonth: Record<string, number> = {};
    data.forEach(row => { byMonth[row.month] = (byMonth[row.month] || 0) + row.violations; });
    return Object.keys(byMonth).sort().map(m => ({ month: m, total: byMonth[m] }));
  }
}

