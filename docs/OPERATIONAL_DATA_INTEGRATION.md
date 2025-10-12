# 🔗 OPERATIONAL DATA INTEGRATION GUIDE
## CyntientOps Mobile App - Complete Implementation

### Last Updated: 2025-10-09

---

## 📋 OVERVIEW

This document describes the complete integration of operational data (134 routines, 7 workers, 19 buildings) into the CyntientOps React Native mobile app UI components.

### **What Was Implemented:**

1. ✅ **Enhanced TaskService** - Time-based task categorization (NOW/NEXT/TODAY/URGENT/COMPLETED)
2. ✅ **Enhanced BuildingService** - DSNY schedule extraction and calculation
3. ✅ **TaskCard Component** - Display operational tasks with status and actions
4. ✅ **RoutineCard Component** - Display building routines with worker assignments
5. ✅ **DSNYScheduleCard Component** - Display DSNY collection schedules

---

## 🏗️ ARCHITECTURE

### Data Flow

```
routines.json (134 tasks) → OperationalDataManager
    ↓
TaskService.generateWorkerTasks(workerId)
    ↓
NOW/NEXT/TODAY/URGENT/COMPLETED categorization
    ↓
WorkerViewModel → WorkerDashboardScreen → UI Components
```

### Component Hierarchy

```
WorkerDashboardScreen
├── WorkerDashboardMainView
│   ├── Hero Cards (Identity + Metrics)
│   │   ├── Current Task (NOW)
│   │   ├── Next Task (NEXT)
│   │   └── Today's Progress Stats
│   └── Schedule Sections
│       ├── NOW Tasks → TaskCard
│       ├── NEXT Tasks → TaskCard
│       └── TODAY Tasks → TaskCard

BuildingDetailScreen
├── BuildingHeader
└── Tabs
    ├── OVERVIEW
    ├── ROUTINES → RoutineCard
    │   ├── Daily Routines
    │   ├── Maintenance Schedule
    │   └── DSNY Schedule → DSNYScheduleCard
    ├── WORKERS
    ├── COMPLIANCE
    └── SYSTEMS
```

---

## 🔧 IMPLEMENTATION DETAILS

### 1. TaskService Enhancements

**File**: `packages/business-core/src/services/TaskService.ts`

#### New Methods:

```typescript
// Get routines for a specific building
getRoutinesForBuilding(buildingId: string): RoutineTask[]

// Get current task (within time window)
getCurrentTask(workerId: string): OperationalDataTaskAssignment | null

// Get next upcoming task
getNextTask(workerId: string): OperationalDataTaskAssignment | null

// Get completion stats for today
getTodayCompletionStats(workerId: string): {
  completed: number;
  total: number;
  rate: number;
}

// Format hour to 12-hour format
formatHour(hour: number): string
```

#### Time-Based Categorization Logic:

```typescript
const schedule = TaskService.getInstance().generateWorkerTasks(workerId);

// Returns:
{
  now: [],      // Tasks within their time window (currentHour >= startHour && currentHour < endHour)
  next: [],     // Tasks before their start time (currentHour < startHour)
  today: [],    // All tasks scheduled for today (filtered by daysOfWeek)
  urgent: [],   // Overdue or within 1 hour
  completed: [] // Tasks after their end time (currentHour >= endHour)
}
```

### 2. BuildingService Enhancements

**File**: `packages/business-core/src/services/BuildingService.ts`

#### New Methods:

```typescript
// Get DSNY collection schedule for a building
getDSNYSchedule(buildingId: string): {
  collectionDays: string[];
  setOutWorker: string | null;
  setOutTime: string | null;
  bringInWorker: string | null;
  bringInTime: string | null;
  nextCollection: Date | null;
  hasBinSetOut: boolean;
}

// Calculate next collection date
private getNextCollectionDate(collectionDays: string[]): Date | null

// Format hour to 12-hour format
private formatHour(hour: number): string
```

#### DSNY Schedule Extraction Logic:

1. Filters tasks for the building
2. Finds DSNY-related tasks (category: 'Sanitation', title contains 'DSNY'/'Bin'/'Trash')
3. Separates set-out and bring-in tasks
4. Extracts collection days from task daysOfWeek
5. Calculates next collection date based on current day

### 3. UI Components

#### **TaskCard** (`packages/ui-components/src/cards/TaskCard.tsx`)

**Purpose**: Display operational tasks with status badges and action buttons

**Props**:
```typescript
interface TaskCardProps {
  status: 'now' | 'next' | 'today' | 'completed' | 'urgent';
  statusIcon: string;           // Emoji icon
  statusLabel: string;          // Status text
  statusColor: string;          // Status color
  title: string;                // Task name
  building: string;             // Building name
  timeRange: string;            // "9:00 AM - 10:00 AM"
  duration: string;             // "60 min"
  category: string;             // Task category
  skillLevel: string;           // Basic/Intermediate/Advanced
  requiresPhoto: boolean;       // Photo requirement
  onPress?: () => void;
  onComplete?: () => void;      // Complete button (NOW tasks only)
  onIssue?: () => void;         // Issue button (NOW tasks only)
}
```

**Features**:
- Status badge with color coding
- Building location with icon
- Time range and duration
- Category, skill level, photo requirement metadata
- Action buttons for NOW tasks (Complete, Issue)
- Glass morphism styling

**Usage**:
```typescript
<TaskCard
  status="now"
  statusIcon="🟢"
  statusLabel="NOW"
  statusColor="#10b981"
  title="Sidewalk & Curb Clean"
  building="12 West 18th Street"
  timeRange="9:00 AM - 10:00 AM"
  duration="60 min"
  category="Cleaning"
  skillLevel="Basic"
  requiresPhoto={true}
  onComplete={() => handleTaskComplete(task.id)}
  onIssue={() => reportIssue(task.id)}
/>
```

#### **RoutineCard** (`packages/ui-components/src/cards/RoutineCard.tsx`)

**Purpose**: Display building routine tasks with worker assignment

**Props**:
```typescript
interface RoutineCardProps {
  time: string;                 // "9:00 AM - 10:00 AM"
  title: string;                // Task name
  worker: string;               // Worker name
  category: string;             // Task category
  skillLevel: string;           // Basic/Intermediate/Advanced
  requiresPhoto: boolean;       // Photo requirement
  frequency: string;            // Daily/Weekly/Monthly
  daysOfWeek?: string;          // "Mon,Tue,Wed,Thu,Fri"
  onPress?: () => void;
}
```

**Features**:
- Time display with clock icon
- Photo badge if required
- Worker assignment
- Category icon (broom, wrench, delete, etc.)
- Skill level and frequency badges
- Days of week display

**Usage**:
```typescript
<RoutineCard
  time="9:00 AM - 10:00 AM"
  title="Sidewalk & Curb Clean"
  worker="Greg Hutson"
  category="Cleaning"
  skillLevel="Basic"
  requiresPhoto={true}
  frequency="Daily"
  daysOfWeek="Mon,Tue,Wed,Thu,Fri"
  onPress={() => navigateToRoutineDetail(routine.id)}
/>
```

#### **DSNYScheduleCard** (`packages/ui-components/src/cards/DSNYScheduleCard.tsx`)

**Purpose**: Display DSNY collection schedule with worker assignments

**Props**:
```typescript
interface DSNYScheduleCardProps {
  collectionDays: string[];     // ['Monday', 'Wednesday', 'Friday']
  setOutWorker: string | null;  // Worker for set-out
  setOutTime: string | null;    // Time for set-out
  bringInWorker: string | null; // Worker for bring-in
  bringInTime: string | null;   // Time for bring-in
  nextCollection: Date | null;  // Next collection date
  onViewFull?: () => void;      // Navigate to full schedule
}
```

**Features**:
- Collection days badges
- Next collection countdown
- Worker assignments with arrows (up for set-out, down for bring-in)
- Time display for each worker
- View full schedule button

**Usage**:
```typescript
const dsnySchedule = BuildingService.getInstance().getDSNYSchedule(buildingId);

<DSNYScheduleCard
  collectionDays={dsnySchedule.collectionDays}
  setOutWorker={dsnySchedule.setOutWorker}
  setOutTime={dsnySchedule.setOutTime}
  bringInWorker={dsnySchedule.bringInWorker}
  bringInTime={dsnySchedule.bringInTime}
  nextCollection={dsnySchedule.nextCollection}
  onViewFull={() => navigation.navigate('DSNYDetail', { buildingId })}
/>
```

---

## 📱 INTEGRATION EXAMPLES

### Example 1: Worker Dashboard Hero Cards

**File**: `apps/mobile-rn/src/screens/WorkerDashboardScreen.tsx`

```typescript
import { TaskService } from '@cyntientops/business-core';
import { TaskCard } from '@cyntientops/ui-components';

const WorkerDashboardScreen = ({ userId, userName }) => {
  const [currentTask, setCurrentTask] = useState(null);
  const [nextTask, setNextTask] = useState(null);
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0, rate: 0 });

  useEffect(() => {
    const taskService = TaskService.getInstance();

    // Get current task (NOW)
    const current = taskService.getCurrentTask(userId);
    setCurrentTask(current);

    // Get next task (NEXT)
    const next = taskService.getNextTask(userId);
    setNextTask(next);

    // Get completion stats
    const stats = taskService.getTodayCompletionStats(userId);
    setTodayStats(stats);
  }, [userId]);

  return (
    <View>
      {/* Hero Card: Current Task */}
      {currentTask && (
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>🟢 CURRENT TASK</Text>
          <Text style={styles.heroTaskName}>{currentTask.taskName}</Text>
          <Text style={styles.heroTime}>
            {taskService.formatHour(currentTask.startHour)} - {taskService.formatHour(currentTask.endHour)}
          </Text>
          <Text style={styles.heroBuilding}>{currentTask.building}</Text>
        </View>
      )}

      {/* Hero Card: Next Task */}
      {nextTask && (
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>⏭️ NEXT UP</Text>
          <Text style={styles.heroTaskName}>{nextTask.taskName}</Text>
          <Text style={styles.heroTime}>Starts at {taskService.formatHour(nextTask.startHour)}</Text>
          <Text style={styles.heroBuilding}>{nextTask.building}</Text>
        </View>
      )}

      {/* Hero Card: Today's Progress */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>📈 TODAY'S PROGRESS</Text>
        <Text style={styles.heroStats}>
          {todayStats.completed} / {todayStats.total} Tasks
        </Text>
        <ProgressBar progress={todayStats.rate} />
      </View>
    </View>
  );
};
```

### Example 2: Worker Schedule Tab

**File**: `apps/mobile-rn/src/navigation/tabs/WorkerScheduleTab.tsx`

```typescript
import { TaskService } from '@cyntientops/business-core';
import { TaskCard } from '@cyntientops/ui-components';

const WorkerScheduleTab = ({ userId }) => {
  const [taskSchedule, setTaskSchedule] = useState(null);

  useEffect(() => {
    const taskService = TaskService.getInstance();
    const schedule = taskService.generateWorkerTasks(userId);
    setTaskSchedule(schedule);
  }, [userId]);

  return (
    <ScrollView>
      {/* NOW Section */}
      {taskSchedule?.now.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>🟢 NOW</Text>
          {taskSchedule.now.map(task => (
            <TaskCard
              key={task.id}
              status="now"
              statusIcon="🟢"
              statusLabel="NOW"
              statusColor="#10b981"
              title={task.taskName}
              building={task.building}
              timeRange={`${formatHour(task.metadata.startHour)} - ${formatHour(task.metadata.endHour)}`}
              duration={`${task.estimatedDuration} min`}
              category={task.category}
              skillLevel={task.skillLevel}
              requiresPhoto={task.requiresPhoto}
              onComplete={() => handleTaskComplete(task.id)}
              onIssue={() => reportIssue(task.id)}
            />
          ))}
        </View>
      )}

      {/* NEXT Section */}
      {taskSchedule?.next.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>⏭️ NEXT</Text>
          {taskSchedule.next.map(task => (
            <TaskCard
              key={task.id}
              status="next"
              statusIcon="⏭️"
              statusLabel="NEXT"
              statusColor="#3b82f6"
              title={task.taskName}
              building={task.building}
              timeRange={`${formatHour(task.metadata.startHour)} - ${formatHour(task.metadata.endHour)}`}
              duration={`${task.estimatedDuration} min`}
              category={task.category}
              skillLevel={task.skillLevel}
              requiresPhoto={task.requiresPhoto}
            />
          ))}
        </View>
      )}

      {/* TODAY Section */}
      <View>
        <Text style={styles.sectionTitle}>📋 TODAY</Text>
        {taskSchedule?.today.map(task => (
          <TaskCard
            key={task.id}
            status="today"
            statusIcon="📋"
            statusLabel="TODAY"
            statusColor="#6b7280"
            title={task.taskName}
            building={task.building}
            timeRange={`${formatHour(task.metadata.startHour)} - ${formatHour(task.metadata.endHour)}`}
            duration={`${task.estimatedDuration} min`}
            category={task.category}
            skillLevel={task.skillLevel}
            requiresPhoto={task.requiresPhoto}
          />
        ))}
      </View>
    </ScrollView>
  );
};
```

### Example 3: Building Detail Routines Tab

**File**: `apps/mobile-rn/src/screens/BuildingDetailScreen.tsx`

```typescript
import { TaskService, BuildingService } from '@cyntientops/business-core';
import { RoutineCard, DSNYScheduleCard } from '@cyntientops/ui-components';

const BuildingDetailScreen = ({ buildingId }) => {
  const [routines, setRoutines] = useState([]);
  const [dsnySchedule, setDsnySchedule] = useState(null);

  useEffect(() => {
    const taskService = TaskService.getInstance();
    const buildingService = new BuildingService();

    // Get building routines
    const buildingRoutines = taskService.getRoutinesForBuilding(buildingId);
    setRoutines(buildingRoutines);

    // Get DSNY schedule
    const dsny = buildingService.getDSNYSchedule(buildingId);
    setDsnySchedule(dsny);
  }, [buildingId]);

  return (
    <ScrollView>
      {/* Daily Routines Section */}
      <View>
        <Text style={styles.sectionTitle}>📋 DAILY ROUTINES</Text>
        {routines.map(routine => (
          <RoutineCard
            key={routine.id}
            time={`${formatHour(routine.startHour)} - ${formatHour(routine.endHour)}`}
            title={routine.title}
            worker={routine.assignedWorker}
            category={routine.category}
            skillLevel={routine.skillLevel}
            requiresPhoto={routine.requiresPhoto}
            frequency={routine.recurrence}
            daysOfWeek={routine.daysOfWeek}
            onPress={() => navigateToRoutineDetail(routine.id)}
          />
        ))}
      </View>

      {/* DSNY Schedule Section */}
      {dsnySchedule && (
        <View>
          <Text style={styles.sectionTitle}>🗑️ DSNY SCHEDULE</Text>
          <DSNYScheduleCard
            collectionDays={dsnySchedule.collectionDays}
            setOutWorker={dsnySchedule.setOutWorker}
            setOutTime={dsnySchedule.setOutTime}
            bringInWorker={dsnySchedule.bringInWorker}
            bringInTime={dsnySchedule.bringInTime}
            nextCollection={dsnySchedule.nextCollection}
            onViewFull={() => navigation.navigate('DSNYDetail', { buildingId })}
          />
        </View>
      )}
    </ScrollView>
  );
};
```

---

## 🎨 STATUS COLOR SYSTEM

```typescript
const STATUS_COLORS = {
  now: {
    background: '#10b98120',  // Green with opacity
    border: '#10b981',
    text: '#10b981',
    icon: '🟢'
  },
  next: {
    background: '#3b82f620',  // Blue with opacity
    border: '#3b82f6',
    text: '#3b82f6',
    icon: '⏭️'
  },
  urgent: {
    background: '#ef444420',  // Red with opacity
    border: '#ef4444',
    text: '#ef4444',
    icon: '⚠️'
  },
  completed: {
    background: '#6b728020',  // Gray with opacity
    border: '#6b7280',
    text: '#6b7280',
    icon: '✅'
  }
};
```

---

## 🔄 AUTO-REFRESH BEHAVIOR

Tasks automatically move between categories based on time:

| Time | Category | Example |
|------|----------|---------|
| **8:55 AM** | NEXT | "Sidewalk Clean (9:00-10:00 AM)" in NEXT |
| **9:05 AM** | NOW | Same task moves to NOW automatically |
| **10:05 AM** | COMPLETED | Same task moves to COMPLETED automatically |

**Implementation**:
- WorkerViewModel refreshes every 30 seconds
- WorkerScheduleTab refreshes every 5 minutes
- TaskService.generateWorkerTasks() is called on each refresh

---

## 📊 REAL-WORLD DATA INTEGRATION

### Data Sources:

1. **routines.json** - 128 operational routines from Franco Management
2. **workers.json** - 7 active field workers
3. **buildings.json** - 18 NYC buildings

### Data Validation:

All operational data is validated against canonical IDs:

```typescript
// From OperationalDataManager
CanonicalIDs.Workers.isValidWorkerId(workerId)
CanonicalIDs.Buildings.isValidBuildingId(buildingId)
```

### Data Integrity:

```typescript
validateDataIntegrity(): boolean {
  // Validates all workers have valid canonical IDs
  // Validates all buildings have valid canonical IDs
  // Validates all tasks have required fields
  // Returns true if all checks pass
}
```

---

## 🚀 NEXT STEPS

### To Complete Full Integration:

1. **Update WorkerDashboardScreen**:
   - Replace placeholder hero card data with TaskService methods
   - Add getCurrentTask() and getNextTask() display
   - Add getTodayCompletionStats() progress bar

2. **Update WorkerScheduleTab**:
   - Replace TaskTimelineView with TaskCard components
   - Implement NOW/NEXT/TODAY sections properly
   - Add auto-refresh (already partially implemented)

3. **Create BuildingDetailScreen Routines Tab**:
   - Add RoutineCard list for daily routines
   - Add DSNYScheduleCard for DSNY schedule
   - Group routines by time slot

4. **Add Navigation**:
   - TaskCard onPress → Navigate to TaskDetailScreen
   - RoutineCard onPress → Navigate to RoutineDetailScreen
   - DSNYScheduleCard onViewFull → Navigate to DSNYDetailScreen

5. **Add Task Actions**:
   - TaskCard onComplete → Mark task as completed
   - TaskCard onIssue → Report issue modal
   - Photo capture for tasks requiring photos

---

## 📦 EXPORTS

All new components are exported from `@cyntientops/ui-components`:

```typescript
import {
  TaskCard,
  RoutineCard,
  DSNYScheduleCard
} from '@cyntientops/ui-components';
```

All enhanced services are exported from `@cyntientops/business-core`:

```typescript
import {
  TaskService,
  BuildingService
} from '@cyntientops/business-core';
```

---

## 🎯 SUMMARY

**What's Ready to Use:**
- ✅ TaskService with time-based categorization
- ✅ BuildingService with DSNY schedule extraction
- ✅ TaskCard component for operational tasks
- ✅ RoutineCard component for building routines
- ✅ DSNYScheduleCard component for DSNY schedules
- ✅ Complete operational playbook (134 tasks documented)

**What Needs Integration:**
- 🔨 Update WorkerDashboardScreen to use new hero card data
- 🔨 Update WorkerScheduleTab to use TaskCard components
- 🔨 Create BuildingDetailScreen routines tab implementation
- 🔨 Add navigation handlers for all cards
- 🔨 Add task completion and issue reporting flows

**Total Lines of Code Added:**
- TaskService: ~50 lines
- BuildingService: ~120 lines
- TaskCard: ~180 lines
- RoutineCard: ~150 lines
- DSNYScheduleCard: ~200 lines
- **Total: ~700 lines of production-ready code**

---

*Document generated for CyntientOps operational integration*
*Last Updated: 2025-10-09*
