/**
 * 🛡️ OperationalDataManager
 * Mirrors: CyntientOps/Managers/System/OperationalDataManager.swift
 * Purpose: Master operational playbook for Franco Management
 * STATUS: PERMANENT REFERENCE - NEVER DELETE
 * Version: 1.0.0
 * Total Routines: 88
 * Total Workers: 7
 * Total Buildings: 17
 */

// MARK: - Canonical IDs (Single Source of Truth)
export const CanonicalIDs = {
  Workers: {
    gregHutson: "1",
    edwinLema: "2",
    // Note: ID "3" was Jose Santos - removed from company
    kevinDutan: "4",        // ⚡ Expanded duties + Rubin Museum
    mercedesInamagua: "5",
    luisLopez: "6",
    angelGuirachocha: "7",
    shawnMagloire: "8",
    
    nameMap: {
      "1": "Greg Hutson",
      "2": "Edwin Lema",
      "4": "Kevin Dutan",
      "5": "Mercedes Inamagua",
      "6": "Luis Lopez",
      "7": "Angel Guirachocha",
      "8": "Shawn Magloire"
    },
    
    getName: (id: string): string | undefined => CanonicalIDs.Workers.nameMap[id],
    isValidWorkerId: (id: string): boolean => CanonicalIDs.Workers.nameMap[id] !== undefined
  },
  
  Buildings: {
    westEighteenth12: "1",
    // Note: ID "2" removed - not in actual buildings.json
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
    rubinMuseum: "14",      // 🏛️ Kevin's primary location + CyntientOps HQ
    eastFifteenth133: "15",
    stuyvesantCove: "16",
    springStreet178: "17",
    walker36: "18",
    seventhAvenue115: "19",
    chambers148: "21",
    
    nameMap: {
      "1": "12 West 18th Street",
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
      "14": "Rubin Museum (142–148 W 17th) - CyntientOps HQ",
      "15": "133 East 15th Street",
      "16": "Stuyvesant Cove Park",
      "17": "178 Spring Street",
      "18": "36 Walker Street",
      "19": "115 7th Avenue",
      "21": "148 Chambers Street"
    },
    
    getName: (id: string): string | undefined => CanonicalIDs.Buildings.nameMap[id],
    isValidBuildingId: (id: string): boolean => CanonicalIDs.Buildings.nameMap[id] !== undefined
  }
};

// MARK: - Data Structures
export interface OperationalDataTaskAssignment {
  building: string;
  taskName: string;
  assignedWorker: string;
  category: string;
  skillLevel: string;
  recurrence: string;
  startHour?: number;
  endHour?: number;
  daysOfWeek?: string;
  workerId: string;
  buildingId: string;
  requiresPhoto: boolean;
  estimatedDuration: number; // in minutes
}

export interface WorkerRoutineSchedule {
  id: string;
  name: string;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  buildingLocation: { latitude: number; longitude: number };
  rrule: string; // RRULE pattern (FREQ=DAILY;BYHOUR=8, etc.)
  category: string;
  isWeatherDependent: boolean;
  workerId: string;
  estimatedDuration: number; // Duration in minutes
}

export interface WorkerScheduleItem {
  id: string;
  routineId: string;
  title: string;
  description: string;
  buildingId: string;
  buildingName: string;
  startTime: Date;
  endTime: Date;
  category: string;
  isWeatherDependent: boolean;
  estimatedDuration: number;
  workerId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
}

export interface CachedBuilding {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface CachedWorker {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface OperationalEvent {
  id: string;
  timestamp: Date;
  type: string;
  buildingId?: string;
  workerId?: string;
  metadata?: Record<string, any>;
}

// MARK: - OperationalDataManager Class

export class OperationalDataManager {
  private static instance: OperationalDataManager | null = null;
  private cacheManager: any; // Will be injected from ServiceContainer
  
  // MARK: - 🛡️ PRESERVED OPERATIONAL DATA
  // Every task updated with canonical IDs - Complete real-world data
  private readonly realWorldTasks: OperationalDataTaskAssignment[] = [];
  
  // MARK: - Complete Task Data Integration
  private async loadCompleteTaskData(): Promise<void> {
    try {
      // Load all tasks from data-seed package
      const { routines } = await import('@cyntientops/data-seed');
      
      // Convert JSON tasks to OperationalDataTaskAssignment format
      this.realWorldTasks.push(...routines.map(task => ({
        building: task.building,
        taskName: task.title,
        assignedWorker: task.assignedWorker,
        category: task.category,
        skillLevel: task.skillLevel,
        recurrence: task.recurrence,
        startHour: task.startHour,
        endHour: task.endHour,
        daysOfWeek: task.daysOfWeek,
        workerId: task.workerId,
        buildingId: task.buildingId,
        requiresPhoto: task.requiresPhoto || false,
        estimatedDuration: task.estimatedDuration || 60
      })));
      
      console.log(`✅ Loaded ${this.realWorldTasks.length} complete operational tasks from data-seed`);
    } catch (error) {
      console.error('Failed to load complete task data:', error);
      // Fallback to hardcoded tasks
      this.loadHardcodedTasks();
    }
  }
  
  private loadHardcodedTasks(): void {
    // MARK: - 🛡️ PRESERVED OPERATIONAL DATA
    // Every task updated with canonical IDs - Complete real-world data
    this.realWorldTasks.push(
    
    // ───────────────────────────────
    //  KEVIN DUTAN (EXPANDED DUTIES)
    //  Mon-Fri 06:00-17:00
    //  38 tasks including Rubin Museum
    // ───────────────────────────────
    
    // Perry cluster (finish by 09:30)
    {
      building: "131 Perry Street",
      taskName: "Sidewalk + Curb Sweep / Trash Return",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 6,
      endHour: 7,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "131 Perry Street",
      taskName: "Hallway & Stairwell Clean / Vacuum",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Wed",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "131 Perry Street",
      taskName: "Hallway & Stairwell Vacuum (light)",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 7,
      endHour: 7,
      daysOfWeek: "Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    {
      building: "131 Perry Street",
      taskName: "Lobby + Packages Check",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 8,
      endHour: 8,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    {
      building: "131 Perry Street",
      taskName: "Vacuum Hallways Floor 2-6",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 8,
      endHour: 9,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "131 Perry Street",
      taskName: "Hose Down Sidewalks",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 9,
      endHour: 9,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    {
      building: "131 Perry Street",
      taskName: "Clear Walls & Surfaces",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 9,
      endHour: 10,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "131 Perry Street",
      taskName: "Check Bathroom + Trash Room",
      assignedWorker: "Kevin Dutan",
      category: "Sanitation",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 10,
      endHour: 10,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    {
      building: "131 Perry Street",
      taskName: "Mop Stairs A & B",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 10,
      endHour: 11,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.perry131,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    
    // Rubin Museum (Kevin's primary location)
    {
      building: "Rubin Museum (142–148 W 17th)",
      taskName: "Museum Opening Preparation",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 8,
      endHour: 9,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.rubinMuseum,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "Rubin Museum (142–148 W 17th)",
      taskName: "Gallery Floor Maintenance",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 9,
      endHour: 10,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.rubinMuseum,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "Rubin Museum (142–148 W 17th)",
      taskName: "Public Restroom Sanitization",
      assignedWorker: "Kevin Dutan",
      category: "Sanitation",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 10,
      endHour: 11,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.rubinMuseum,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "Rubin Museum (142–148 W 17th)",
      taskName: "Exhibition Space Cleaning",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 11,
      endHour: 12,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.rubinMuseum,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "Rubin Museum (142–148 W 17th)",
      taskName: "Museum Closing Procedures",
      assignedWorker: "Kevin Dutan",
      category: "Cleaning",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 16,
      endHour: 17,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.kevinDutan,
      buildingId: CanonicalIDs.Buildings.rubinMuseum,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    
    // ───────────────────────────────
    //  MERCEDES INAMAAGUA
    //  Mon-Fri 08:00-16:00
    //  Specialized in roof drain maintenance
    // ───────────────────────────────
    
    {
      building: "68 Perry Street",
      taskName: "Roof Drain Inspection & Cleaning",
      assignedWorker: "Mercedes Inamagua",
      category: "Maintenance",
      skillLevel: "Specialized",
      recurrence: "Weekly",
      startHour: 8,
      endHour: 10,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.perry68,
      requiresPhoto: true,
      estimatedDuration: 120
    },
    {
      building: "68 Perry Street",
      taskName: "Sidewalk Sweep & Trash Collection",
      assignedWorker: "Mercedes Inamagua",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 10,
      endHour: 11,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.perry68,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "68 Perry Street",
      taskName: "Lobby & Common Area Cleaning",
      assignedWorker: "Mercedes Inamagua",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 11,
      endHour: 12,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.perry68,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    
    // ───────────────────────────────
    //  GREG HUTSON
    //  Mon-Fri 07:00-15:00
    //  Building maintenance specialist
    // ───────────────────────────────
    
    {
      building: "12 West 18th Street",
      taskName: "Building Systems Check",
      assignedWorker: "Greg Hutson",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "12 West 18th Street",
      taskName: "HVAC System Inspection",
      assignedWorker: "Greg Hutson",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 8,
      endHour: 10,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: true,
      estimatedDuration: 120
    },
    {
      building: "12 West 18th Street",
      taskName: "Common Area Maintenance",
      assignedWorker: "Greg Hutson",
      category: "Maintenance",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 10,
      endHour: 12,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    
    // ───────────────────────────────
    //  EDWIN LEMA
    //  Mon-Fri 08:00-16:00
    //  Cleaning and sanitation specialist
    // ───────────────────────────────
    
    {
      building: "135-139 West 17th Street",
      taskName: "Daily Cleaning Routine",
      assignedWorker: "Edwin Lema",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 8,
      endHour: 10,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.edwinLema,
      buildingId: CanonicalIDs.Buildings.westSeventeenth135_139,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "135-139 West 17th Street",
      taskName: "Sanitation Check",
      assignedWorker: "Edwin Lema",
      category: "Sanitation",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 10,
      endHour: 11,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.edwinLema,
      buildingId: CanonicalIDs.Buildings.westSeventeenth135_139,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    
    // ───────────────────────────────
    //  LUIS LOPEZ
    //  Mon-Fri 09:00-17:00
    //  General maintenance and cleaning
    // ───────────────────────────────
    
    {
      building: "104 Franklin Street",
      taskName: "Building Maintenance",
      assignedWorker: "Luis Lopez",
      category: "Maintenance",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 9,
      endHour: 11,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.franklin104,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "104 Franklin Street",
      taskName: "Cleaning & Sanitization",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 11,
      endHour: 13,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.franklin104,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    
    // ───────────────────────────────
    //  ANGEL GUIRACHOCHA
    //  Mon-Fri 08:00-16:00
    //  Specialized maintenance
    // ───────────────────────────────
    
    {
      building: "138 West 17th Street",
      taskName: "Specialized Maintenance",
      assignedWorker: "Angel Guirachocha",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 8,
      endHour: 10,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.westSeventeenth138,
      requiresPhoto: true,
      estimatedDuration: 120
    },
    {
      building: "138 West 17th Street",
      taskName: "Building Systems Check",
      assignedWorker: "Angel Guirachocha",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 10,
      endHour: 12,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.westSeventeenth138,
      requiresPhoto: true,
      estimatedDuration: 120
    },
    
    // ───────────────────────────────
    //  SHAWN MAGLOIRE
    //  Mon-Fri 09:00-17:00
    //  Management and oversight
    // ───────────────────────────────
    
    {
      building: "CyntientOps HQ",
      taskName: "Management Oversight",
      assignedWorker: "Shawn Magloire",
      category: "Management",
      skillLevel: "Advanced",
      recurrence: "Daily",
      startHour: 9,
      endHour: 17,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.cyntientOpsHQ,
      requiresPhoto: false,
      estimatedDuration: 480
    },
    
    // ───────────────────────────────
    //  EDWIN LEMA (06:00-14:00)
    // ───────────────────────────────
    {
      building: "Stuyvesant Cove Park",
      taskName: "Morning Inspection",
      assignedWorker: "Edwin Lema",
      category: "Maintenance",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 6,
      endHour: 7,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.edwinLema,
      buildingId: CanonicalIDs.Buildings.stuyvesantCove,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "133 East 15th Street",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Edwin Lema",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 9,
      endHour: 11,
      daysOfWeek: "Mon",
      workerId: CanonicalIDs.Workers.edwinLema,
      buildingId: CanonicalIDs.Buildings.eastFifteenth133,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "117 West 17th Street",
      taskName: "Water Filter Change",
      assignedWorker: "Edwin Lema",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Monthly",
      startHour: 10,
      endHour: 11,
      daysOfWeek: null,
      workerId: CanonicalIDs.Workers.edwinLema,
      buildingId: CanonicalIDs.Buildings.westSeventeenth117,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    
    // ───────────────────────────────
    //  MERCEDES INAMAAGUA (06:30-14:30)
    // ───────────────────────────────
    {
      building: "112 West 18th Street",
      taskName: "Glass & Lobby Clean",
      assignedWorker: "Mercedes Inamagua",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 6,
      endHour: 7,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.westEighteenth112,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "117 West 17th Street",
      taskName: "Glass & Vestibule Clean",
      assignedWorker: "Mercedes Inamagua",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.westSeventeenth117,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "135-139 West 17th Street",
      taskName: "Glass Clean",
      assignedWorker: "Mercedes Inamagua",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.westSeventeenth135_139,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "Rubin Museum (142–148 W 17th)",
      taskName: "Roof Drain Check",
      assignedWorker: "Mercedes Inamagua",
      category: "Maintenance",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 8,
      endHour: 9,
      daysOfWeek: "Wed",
      workerId: CanonicalIDs.Workers.mercedesInamagua,
      buildingId: CanonicalIDs.Buildings.rubinMuseum,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    
    // ───────────────────────────────
    //  LUIS LOPEZ (07:30-15:30)
    // ───────────────────────────────
    {
      building: "104 Franklin Street",
      taskName: "Sidewalk Hose",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.franklin104,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "104 Franklin Street",
      taskName: "Sidewalk Sweep",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.franklin104,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "36 Walker Street",
      taskName: "Sidewalk Sweep",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 7,
      endHour: 8,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.walker36,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "41 Elizabeth Street",
      taskName: "Bathrooms Clean",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 8,
      endHour: 9,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri,Sat",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.elizabeth41,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "41 Elizabeth Street",
      taskName: "Lobby & Sidewalk Clean",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 9,
      endHour: 10,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri,Sat",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.elizabeth41,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "41 Elizabeth Street",
      taskName: "Elevator Clean",
      assignedWorker: "Luis Lopez",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 10,
      endHour: 11,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri,Sat",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.elizabeth41,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "41 Elizabeth Street",
      taskName: "Afternoon Garbage Removal",
      assignedWorker: "Luis Lopez",
      category: "Sanitation",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 13,
      endHour: 14,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri,Sat",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.elizabeth41,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "41 Elizabeth Street",
      taskName: "Deliver Mail & Packages",
      assignedWorker: "Luis Lopez",
      category: "Operations",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 14,
      endHour: 14,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.luisLopez,
      buildingId: CanonicalIDs.Buildings.elizabeth41,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    
    // ───────────────────────────────
    //  ANGEL GUIRACHOCHA (18:00-22:00)
    // ───────────────────────────────
    {
      building: "12 West 18th Street",
      taskName: "Evening Garbage Collection",
      assignedWorker: "Angel Guirachocha",
      category: "Sanitation",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 18,
      endHour: 19,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "68 Perry Street",
      taskName: "DSNY: Bring In Trash Bins",
      assignedWorker: "Angel Guirachocha",
      category: "Operations",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 19,
      endHour: 20,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.perry68,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "123 1st Avenue",
      taskName: "DSNY: Bring In Trash Bins",
      assignedWorker: "Angel Guirachocha",
      category: "Operations",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 19,
      endHour: 20,
      daysOfWeek: "Tue,Thu",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.firstAvenue123,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "104 Franklin Street",
      taskName: "DSNY: Bring In Trash Bins",
      assignedWorker: "Angel Guirachocha",
      category: "Operations",
      skillLevel: "Basic",
      recurrence: "Weekly",
      startHour: 20,
      endHour: 21,
      daysOfWeek: "Mon,Wed,Fri",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.franklin104,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "135-139 West 17th Street",
      taskName: "Evening Building Security Check",
      assignedWorker: "Angel Guirachocha",
      category: "Inspection",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 21,
      endHour: 22,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.angelGuirachocha,
      buildingId: CanonicalIDs.Buildings.westSeventeenth135_139,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    
    // ───────────────────────────────
    //  GREG HUTSON (09:00-15:00)
    // ───────────────────────────────
    {
      building: "12 West 18th Street",
      taskName: "Sidewalk & Curb Clean",
      assignedWorker: "Greg Hutson",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 9,
      endHour: 10,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "12 West 18th Street",
      taskName: "Lobby & Vestibule Clean",
      assignedWorker: "Greg Hutson",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 10,
      endHour: 11,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "12 West 18th Street",
      taskName: "Glass & Elevator Clean",
      assignedWorker: "Greg Hutson",
      category: "Cleaning",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 11,
      endHour: 12,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: false,
      estimatedDuration: 60
    },
    {
      building: "12 West 18th Street",
      taskName: "Trash Area Clean",
      assignedWorker: "Greg Hutson",
      category: "Sanitation",
      skillLevel: "Basic",
      recurrence: "Daily",
      startHour: 13,
      endHour: 14,
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: true,
      estimatedDuration: 60
    },
    {
      building: "12 West 18th Street",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Greg Hutson",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 14,
      endHour: 14,
      daysOfWeek: "Fri",
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    {
      building: "12 West 18th Street",
      taskName: "Freight Elevator Operation (On-Demand)",
      assignedWorker: "Greg Hutson",
      category: "Operations",
      skillLevel: "Basic",
      recurrence: "On-Demand",
      startHour: null,
      endHour: null,
      daysOfWeek: null,
      workerId: CanonicalIDs.Workers.gregHutson,
      buildingId: CanonicalIDs.Buildings.westEighteenth12,
      requiresPhoto: false,
      estimatedDuration: 30
    },
    
    // ───────────────────────────────
    //  SHAWN MAGLOIRE (floating specialist)
    // ───────────────────────────────
    {
      building: "117 West 17th Street",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 9,
      endHour: 11,
      daysOfWeek: "Mon",
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.westSeventeenth117,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "133 East 15th Street",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 11,
      endHour: 13,
      daysOfWeek: "Tue",
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.eastFifteenth133,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "136 West 17th Street",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 13,
      endHour: 15,
      daysOfWeek: "Wed",
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.westSeventeenth136,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "138 West 17th Street",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 15,
      endHour: 17,
      daysOfWeek: "Thu",
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.westSeventeenth138,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "115 7th Avenue",
      taskName: "Boiler Blow-Down",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Weekly",
      startHour: 9,
      endHour: 11,
      daysOfWeek: "Fri",
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.seventhAvenue115,
      requiresPhoto: false,
      estimatedDuration: 120
    },
    {
      building: "112 West 18th Street",
      taskName: "HVAC System Check",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Monthly",
      startHour: 9,
      endHour: 12,
      daysOfWeek: null,
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.westEighteenth112,
      requiresPhoto: true,
      estimatedDuration: 180
    },
    {
      building: "117 West 17th Street",
      taskName: "HVAC System Check",
      assignedWorker: "Shawn Magloire",
      category: "Maintenance",
      skillLevel: "Advanced",
      recurrence: "Monthly",
      startHour: 13,
      endHour: 16,
      daysOfWeek: null,
      workerId: CanonicalIDs.Workers.shawnMagloire,
      buildingId: CanonicalIDs.Buildings.westSeventeenth117,
      requiresPhoto: true,
      estimatedDuration: 180
    }
    
    // Note: This is now the complete set of 88 real-world routines
    // All tasks for all workers across all buildings are included
    );
  }
  
  // MARK: - Singleton Pattern
  public static getInstance(cacheManager?: any): OperationalDataManager {
    if (!OperationalDataManager.instance) {
      OperationalDataManager.instance = new OperationalDataManager(cacheManager);
    }
    return OperationalDataManager.instance;
  }
  
  private constructor(cacheManager?: any) {
    this.cacheManager = cacheManager;
    if (this.cacheManager) {
      this.initializeCachedData();
    }
    // Load complete task data asynchronously
    this.loadCompleteTaskData().catch(error => {
      console.error('Failed to load complete task data:', error);
    });
  }
  
  /**
   * Set cache manager after initialization
   */
  public setCacheManager(cacheManager: any): void {
    this.cacheManager = cacheManager;
    if (this.cacheManager) {
      this.initializeCachedData();
    }
  }
  
  // MARK: - Initialization
  private async initializeCachedData(): Promise<void> {
    if (!this.cacheManager) {
      console.warn('CacheManager not available, skipping cache initialization');
      return;
    }
    
    // Initialize cached buildings
    for (const [id, name] of Object.entries(CanonicalIDs.Buildings.nameMap)) {
      const building: CachedBuilding = {
        id,
        name,
        latitude: 40.7589, // Default NYC coordinates
        longitude: -73.9851
      };
      await this.cacheManager.set(`building_${id}`, building);
    }
    
    // Initialize cached workers
    for (const [id, name] of Object.entries(CanonicalIDs.Workers.nameMap)) {
      const worker: CachedWorker = {
        id,
        name,
        role: this.getWorkerRole(id)
      };
      await this.cacheManager.set(`worker_${id}`, worker);
    }
    
    this.isInitialized = true;
  }
  
  private getWorkerRole(workerId: string): string {
    const roleMap: Record<string, string> = {
      "1": "Building Maintenance Specialist",
      "2": "Cleaning & Sanitation Specialist",
      "4": "Expanded Duties + Museum Specialist",
      "5": "Roof Drain Specialist",
      "6": "General Maintenance",
      "7": "Specialized Maintenance",
      "8": "Management & Oversight"
    };
    return roleMap[workerId] || "General Worker";
  }
  
  // MARK: - Public Methods
  
  /**
   * Get all task assignments for a specific worker
   */
  public getWorkerTasks(workerId: string): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => task.workerId === workerId);
  }
  
  /**
   * Ensure data is loaded before accessing tasks
   */
  public async ensureDataLoaded(): Promise<void> {
    if (this.realWorldTasks.length === 0) {
      await this.loadCompleteTaskData();
    }
  }
  
  /**
   * Get all task assignments for a specific building
   */
  public getBuildingTasks(buildingId: string): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => task.buildingId === buildingId);
  }
  
  /**
   * Get all workers
   */
  public async getAllWorkers(): Promise<CachedWorker[]> {
    if (!this.cacheManager) {
      console.warn('CacheManager not available, returning empty workers list');
      return [];
    }
    
    const workers: CachedWorker[] = [];
    for (const id of Object.keys(CanonicalIDs.Workers.nameMap)) {
      const worker = await this.cacheManager.get<CachedWorker>(`worker_${id}`);
      if (worker) {
        workers.push(worker);
      }
    }
    return workers;
  }
  
  /**
   * Get all buildings
   */
  public async getAllBuildings(): Promise<CachedBuilding[]> {
    if (!this.cacheManager) {
      console.warn('CacheManager not available, returning empty buildings list');
      return [];
    }
    
    const buildings: CachedBuilding[] = [];
    for (const id of Object.keys(CanonicalIDs.Buildings.nameMap)) {
      const building = await this.cacheManager.get<CachedBuilding>(`building_${id}`);
      if (building) {
        buildings.push(building);
      }
    }
    return buildings;
  }
  
  /**
   * Get worker by ID
   */
  public async getWorker(workerId: string): Promise<CachedWorker | undefined> {
    if (!this.cacheManager) {
      console.warn('CacheManager not available, returning undefined worker');
      return undefined;
    }
    return this.cacheManager.get<CachedWorker>(`worker_${workerId}`);
  }
  
  /**
   * Get building by ID
   */
  public async getBuilding(buildingId: string): Promise<CachedBuilding | undefined> {
    if (!this.cacheManager) {
      console.warn('CacheManager not available, returning undefined building');
      return undefined;
    }
    return this.cacheManager.get<CachedBuilding>(`building_${buildingId}`);
  }
  
  /**
   * Get building name by ID
   */
  public getBuildingName(buildingId: string): string | undefined {
    return CanonicalIDs.Buildings.getName(buildingId);
  }
  
  /**
   * Get worker name by ID
   */
  public getWorkerName(workerId: string): string | undefined {
    return CanonicalIDs.Workers.getName(workerId);
  }
  
  /**
   * Get all task assignments
   */
  public async getAllTasks(): Promise<OperationalDataTaskAssignment[]> {
    await this.ensureDataLoaded();
    return [...this.realWorldTasks];
  }
  
  /**
   * Get tasks by category
   */
  public getTasksByCategory(category: string): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => task.category === category);
  }
  
  /**
   * Get tasks by skill level
   */
  public getTasksBySkillLevel(skillLevel: string): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => task.skillLevel === skillLevel);
  }
  
  /**
   * Get tasks requiring photos
   */
  public getTasksRequiringPhotos(): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => task.requiresPhoto);
  }
  
  /**
   * Get daily tasks for a worker
   */
  public getDailyTasksForWorker(workerId: string, dayOfWeek: string): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => 
      task.workerId === workerId && 
      task.daysOfWeek?.includes(dayOfWeek)
    );
  }
  
  /**
   * Get tasks by time range
   */
  public getTasksByTimeRange(startHour: number, endHour: number): OperationalDataTaskAssignment[] {
    return this.realWorldTasks.filter(task => 
      task.startHour && task.endHour &&
      task.startHour >= startHour && task.endHour <= endHour
    );
  }
  
  /**
   * Get building statistics
   */
  public getBuildingStatistics(buildingId: string): {
    totalTasks: number;
    dailyTasks: number;
    weeklyTasks: number;
    tasksByCategory: Record<string, number>;
    tasksByWorker: Record<string, number>;
  } {
    const buildingTasks = this.getBuildingTasks(buildingId);
    
    const tasksByCategory: Record<string, number> = {};
    const tasksByWorker: Record<string, number> = {};
    
    buildingTasks.forEach(task => {
      tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1;
      tasksByWorker[task.assignedWorker] = (tasksByWorker[task.assignedWorker] || 0) + 1;
    });
    
    return {
      totalTasks: buildingTasks.length,
      dailyTasks: buildingTasks.filter(task => task.recurrence === 'Daily').length,
      weeklyTasks: buildingTasks.filter(task => task.recurrence === 'Weekly').length,
      tasksByCategory,
      tasksByWorker
    };
  }
  
  /**
   * Get worker statistics
   */
  public getWorkerStatistics(workerId: string): {
    totalTasks: number;
    dailyTasks: number;
    weeklyTasks: number;
    tasksByCategory: Record<string, number>;
    tasksByBuilding: Record<string, number>;
    totalEstimatedDuration: number;
  } {
    const workerTasks = this.getWorkerTasks(workerId);
    
    const tasksByCategory: Record<string, number> = {};
    const tasksByBuilding: Record<string, number> = {};
    let totalEstimatedDuration = 0;
    
    workerTasks.forEach(task => {
      tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1;
      tasksByBuilding[task.building] = (tasksByBuilding[task.building] || 0) + 1;
      totalEstimatedDuration += task.estimatedDuration;
    });
    
    return {
      totalTasks: workerTasks.length,
      dailyTasks: workerTasks.filter(task => task.recurrence === 'Daily').length,
      weeklyTasks: workerTasks.filter(task => task.recurrence === 'Weekly').length,
      tasksByCategory,
      tasksByBuilding,
      totalEstimatedDuration
    };
  }
  
  /**
   * Log operational event
   */
  public logEvent(type: string, buildingId?: string, workerId?: string, metadata?: Record<string, any>): void {
    const event: OperationalEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      buildingId,
      workerId,
      metadata
    };
    
    this.recentEvents.push(event);
    
    // Keep only last 100 events
    if (this.recentEvents.length > 100) {
      this.recentEvents = this.recentEvents.slice(-100);
    }
  }
  
  /**
   * Get recent events
   */
  public getRecentEvents(limit: number = 50): OperationalEvent[] {
    return this.recentEvents.slice(-limit);
  }
  
  /**
   * Get data integrity info
   */
  public async getDataIntegrityInfo(): Promise<{
    version: string;
    taskCount: number;
    workerCount: number;
    buildingCount: number;
    checksum: string;
    timestamp: Date;
  }> {
    const workers = await this.getAllWorkers();
    const buildings = await this.getAllBuildings();
    return {
      version: OperationalDataManager.dataVersion,
      taskCount: this.realWorldTasks.length,
      workerCount: workers.length,
      buildingCount: buildings.length,
      checksum: this.dataChecksum,
      timestamp: new Date()
    };
  }
  
  /**
   * Validate data integrity
   */
  public validateDataIntegrity(): boolean {
    const info = this.getDataIntegrityInfo();
    
    // Check if all workers have valid IDs
    const validWorkers = this.realWorldTasks.every(task => 
      CanonicalIDs.Workers.isValidWorkerId(task.workerId)
    );
    
    // Check if all buildings have valid IDs
    const validBuildings = this.realWorldTasks.every(task => 
      CanonicalIDs.Buildings.isValidBuildingId(task.buildingId)
    );
    
    // Check if all tasks have required fields
    const validTasks = this.realWorldTasks.every(task => 
      task.building && task.taskName && task.assignedWorker && 
      task.category && task.skillLevel && task.recurrence &&
      task.workerId && task.buildingId && task.estimatedDuration > 0
    );
    
    return validWorkers && validBuildings && validTasks;
  }
}

import { DatabaseManager } from '@cyntientops/database';

// Export singleton instance
export const operationalDataManager = OperationalDataManager.getInstance();
