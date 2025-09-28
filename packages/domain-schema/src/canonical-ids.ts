/**
 * 🛡️ CANONICAL ID SYSTEM - SINGLE SOURCE OF TRUTH
 * Ported from: CyntientOps/Core/Models/CanonicalIDs.swift
 * Purpose: Prevent ID mismatches across the entire system
 *
 * CRITICAL: These IDs must match exactly with the Swift implementation
 * NEVER CHANGE without coordinating with the iOS team
 */

export const CanonicalIDs = {
  /**
   * Worker IDs (Never change these!)
   * Note: ID "3" was Jose Santos - removed from company
   */
  Workers: {
    gregHutson: "1",
    edwinLema: "2",
    kevinDutan: "4",        // ⚡ Expanded duties + Rubin Museum
    mercedesInamagua: "5",
    luisLopez: "6",
    angelGuirachocha: "7",
    shawnMagloire: "8",

    // ID to Name mapping for validation
    nameMap: {
      "1": "Greg Hutson",
      "2": "Edwin Lema",
      "4": "Kevin Dutan",
      "5": "Mercedes Inamagua",
      "6": "Luis Lopez",
      "7": "Angel Guirachocha",
      "8": "Shawn Magloire"
    } as const,

    getName: (id: string): string | undefined => {
      return CanonicalIDs.Workers.nameMap[id as keyof typeof CanonicalIDs.Workers.nameMap];
    },

    isValidWorkerId: (id: string): boolean => {
      return id in CanonicalIDs.Workers.nameMap;
    }
  },

  /**
   * Building IDs (Consistent with database)
   */
  Buildings: {
    westEighteenth12: "1",
    eastTwentieth29_31: "2",
    westSeventeenth135_139: "3",
    franklin104: "4",
    westSeventeenth138: "5",
    perry68: "6",
    westEighteenth112: "7",
    elizabeth41: "8",
    westSeventeenth117: "9",
    perry131: "10",
    firstAvenue123: "11",
    // Note: ID "12" not in use
    westSeventeenth136: "13",
    rubinMuseum: "14",      // 🏛️ Kevin's primary location
    eastFifteenth133: "15",
    stuyvesantCove: "16",
    springStreet178: "17",
    walker36: "18",
    seventhAvenue115: "19",
    cyntientOpsHQ: "20",
    chambers148: "21",

    // ID to Name mapping
    nameMap: {
      "1": "12 West 18th Street",
      // "2": Building removed from portfolio,
      "3": "135-139 West 17th Street",
      "4": "104 Franklin Street",
      "5": "138 West 17th Street",
      "6": "68 Perry Street",
      "7": "112 West 18th Street",
      "8": "41 Elizabeth Street",
      "9": "117 West 17th Street",
      "10": "131 Perry Street",
      "11": "123 1st Avenue",
      "13": "136 West 17th Street",
      "14": "Rubin Museum (142–148 W 17th)",
      "15": "133 East 15th Street",
      "16": "Stuyvesant Cove Park",
      "17": "178 Spring Street",
      "18": "36 Walker Street",
      "19": "115 7th Avenue",
      "20": "CyntientOps HQ",
      "21": "148 Chambers Street"
    } as const,

    // Name to ID mapping (for lookups)
    idMap: (() => {
      const map: Record<string, string> = {};
      const nameMap = CanonicalIDs.Buildings.nameMap;

      for (const [id, name] of Object.entries(nameMap)) {
        map[name] = id;
        // Add variations for Rubin Museum
        if (id === "14") {
          map["Rubin Museum"] = id;
          map["Rubin Museum (142-148 W 17th)"] = id;
          map["Rubin Museum (142–148 W 17th)"] = id;
        }
      }
      return map;
    })(),

    getName: (id: string): string | undefined => {
      return CanonicalIDs.Buildings.nameMap[id as keyof typeof CanonicalIDs.Buildings.nameMap];
    },

    getId: (name: string): string | undefined => {
      // Try exact match first
      if (name in CanonicalIDs.Buildings.idMap) {
        return CanonicalIDs.Buildings.idMap[name];
      }

      // Try partial match for Rubin Museum
      if (name.toLowerCase().includes("rubin")) {
        return CanonicalIDs.Buildings.rubinMuseum;
      }

      // Try to find by partial match
      for (const [buildingName, id] of Object.entries(CanonicalIDs.Buildings.idMap)) {
        if (buildingName.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(buildingName.toLowerCase())) {
          return id;
        }
      }

      return undefined;
    },

    isValidBuildingId: (id: string): boolean => {
      return id in CanonicalIDs.Buildings.nameMap;
    }
  },

  /**
   * Task Categories (for consistency)
   */
  TaskCategories: {
    cleaning: "Cleaning",
    maintenance: "Maintenance",
    sanitation: "Sanitation",
    inspection: "Inspection",
    operations: "Operations",
    repair: "Repair",

    all: ["Cleaning", "Maintenance", "Sanitation", "Inspection", "Operations", "Repair"] as const
  },

  /**
   * Skill Levels
   */
  SkillLevels: {
    basic: "Basic",
    intermediate: "Intermediate",
    advanced: "Advanced",

    all: ["Basic", "Intermediate", "Advanced"] as const
  },

  /**
   * Recurrence Types
   */
  RecurrenceTypes: {
    daily: "Daily",
    weekly: "Weekly",
    biWeekly: "Bi-Weekly",
    monthly: "Monthly",
    biMonthly: "Bi-Monthly",
    quarterly: "Quarterly",
    semiannual: "Semiannual",
    annual: "Annual",
    onDemand: "On-Demand",

    all: ["Daily", "Weekly", "Bi-Weekly", "Monthly", "Bi-Monthly", "Quarterly", "Semiannual", "Annual", "On-Demand"] as const
  }
} as const;

/**
 * Validation Functions
 */

export interface TaskAssignmentValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a task assignment has proper IDs
 */
export function validateTaskAssignment(
  workerId?: string,
  buildingId?: string
): TaskAssignmentValidation {
  const errors: string[] = [];

  if (workerId) {
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      errors.push(`Invalid worker ID: '${workerId}'`);
    }
  } else {
    errors.push("Missing worker ID");
  }

  if (buildingId) {
    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      errors.push(`Invalid building ID: '${buildingId}'`);
    }
  } else {
    errors.push("Missing building ID");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get display name for a worker/building pair
 */
export function getDisplayName(workerId?: string, buildingId?: string): string {
  const workerName = workerId ? CanonicalIDs.Workers.getName(workerId) : undefined;
  const buildingName = buildingId ? CanonicalIDs.Buildings.getName(buildingId) : undefined;

  const worker = workerName ?? "Unknown Worker";
  const building = buildingName ?? "Unknown Building";

  return `${worker} at ${building}`;
}

// Type exports
export type WorkerId = keyof typeof CanonicalIDs.Workers.nameMap;
export type BuildingId = keyof typeof CanonicalIDs.Buildings.nameMap;
export type TaskCategory = typeof CanonicalIDs.TaskCategories.all[number];
export type SkillLevel = typeof CanonicalIDs.SkillLevels.all[number];
export type RecurrenceType = typeof CanonicalIDs.RecurrenceTypes.all[number];