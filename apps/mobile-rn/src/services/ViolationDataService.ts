/**
 * 🏛️ Violation Data Service
 * Real violation data from NYC APIs
 */

export const realViolationData = {
  "1": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "3": {
    "hpd": 0,
    "dob": 1,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "4": {
    "hpd": 4,
    "dob": 71,
    "dsny": 50,
    "outstanding": 1027,
    "score": 75
  },
  "5": {
    "hpd": 0,
    "dob": 1,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "6": {
    "hpd": 0,
    "dob": 61,
    "dsny": 22,
    "outstanding": 2100,
    "score": 45
  },
  "7": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "8": {
    "hpd": 0,
    "dob": 0,
    "dsny": 50,
    "outstanding": 0,
    "score": 100
  },
  "9": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "10": {
    "hpd": 0,
    "dob": 76,
    "dsny": 14,
    "outstanding": 2550,
    "score": 70
  },
  "11": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "13": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "14": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "15": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "16": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "17": {
    "hpd": 0,
    "dob": 3,
    "dsny": 14,
    "outstanding": 14687,
    "score": 30
  },
  "18": {
    "hpd": 0,
    "dob": 0,
    "dsny": 23,
    "outstanding": 1825,
    "score": 60
  },
  "19": {
    "hpd": 0,
    "dob": 0,
    "dsny": 0,
    "outstanding": 0,
    "score": 100
  },
  "21": {
    "hpd": 0,
    "dob": 0,
    "dsny": 50,
    "outstanding": 2425,
    "score": 50
  }
};

export class ViolationDataService {
  static getViolationData(buildingId: string) {
    return realViolationData[buildingId] || { hpd: 0, dob: 0, dsny: 0, outstanding: 0, score: 100 };
  }

  static getComplianceStatus(score: number) {
    if (score >= 90) return { status: 'EXCELLENT', color: '#10b981' };
    if (score >= 70) return { status: 'GOOD', color: '#f59e0b' };
    if (score >= 50) return { status: 'WARNING', color: '#f97316' };
    return { status: 'CRITICAL', color: '#ef4444' };
  }

  static getCriticalBuildings() {
    return Object.entries(realViolationData)
      .filter(([_, data]) => data.outstanding > 1000 || data.score < 70)
      .map(([id, data]) => ({ id, outstanding: data.outstanding, score: data.score }));
  }
}
