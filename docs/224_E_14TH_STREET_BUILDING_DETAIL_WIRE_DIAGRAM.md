# 🏢 224 East 14th Street - Unified Building Detail Screen

## 📱 Consolidated 6-Tab Interface with Role-Based Intelligence

**Incorporates ALL existing building management functionality:**
- **Overview** - Building stats, compliance, basic worker reference
- **Operations** - Tasks, Routes, Worker assignments (consolidated operational management)
- **Compliance** - History, Sanitation, DSNY compliance (all compliance-related)
- **Resources** - Inventory, Spaces, Media management (all resource management)
- **Emergency** - Safety procedures and contacts
- **Settings** - Building configuration and preferences

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                    [Building Banner Image]                      │
│  [← Back]                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                CONSOLIDATED 6-TAB INTERFACE            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │Overview │ │Operations│ │Compliance│ │Resources│      │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │   │
│  │  ┌─────────┐ ┌─────────┐                             │   │
│  │  │Emergency│ │ Reports │                             │   │
│  │  └─────────┘ └─────────┘                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  (Content of selected tab will be displayed here)              │
│                                                                 │
│  Example: Overview Tab (Default for Client)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                BUILDING DETAILS                        │   │
│  │  🏢 224 East 14th Street, New York, NY 10003            │   │
│  │  📍 8 Units • 9,000 sq ft • Built 1920                │   │
│  │  🏛️ J&M Realty • 📞 +1-212-721-0424                   │   │
│  │  📍 Coordinates: 40.733245, -73.985678                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                BUILDING STATISTICS                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ Market Value│ │ Assessed    │ │ Tax Class   │      │   │
│  │  │ $9,600,000  │ │ $4,800,000  │ │ Class 2     │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                COMPLIANCE STATUS                        │   │
│  │  🎯 COMPLIANCE SCORE: 90% (A- Grade)                    │   │
│  │  Status: EXCELLENT • Last Updated: 10/09/2025          │   │
│  │  Trend: Stable • Next Review: 01/09/2026               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                ASSIGNED TEAM (Basic Reference)        │   │
│  │  👤 Edwin Lema - Lead Maintenance • Status: Available  │   │
│  │  📞 +1-212-555-0101 • Current Task: HVAC Maintenance │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  👤 Kevin Dutan - Assistant • Status: Available       │   │
│  │  📞 +1-212-555-0102 • Current Task: Stairwell Cleaning│   │
│  │  [View Full Team] [Contact Team] [Assign Task] [💬 Chat] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                QUICK ACTIONS                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 📊 View     │ │ 📋 Schedule │ │ 🔧 Request  │      │   │
│  │  │ Reports     │ │ Inspection  │ │ Maintenance │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 1: OVERVIEW (Default for Client) - Enhanced with Worker Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                    OVERVIEW & STATISTICS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                BUILDING STATISTICS                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ Units       │ │ Year Built  │ │ Sq Footage  │      │   │
│  │  │ 8           │ │ 1920        │ │ 9,000       │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ Market Value│ │ Assessed    │ │ Tax Class   │      │   │
│  │  │ $9,600,000  │ │ $4,800,000  │ │ Class 2     │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                COMPLIANCE STATUS                        │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 🎯 COMPLIANCE SCORE: 90% (A- Grade)                │ │   │
│  │  │ Status: EXCELLENT • Last Updated: 12/01/2024      │ │   │
│  │  │ Trend: Stable • Next Review: 03/01/2025           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                SPECIAL NOTES                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 📝 Building Characteristics:                       │ │   │
│  │  │ • Small building with stairwell and elevator        │ │   │
│  │  │ • <9 units - bins set out on sidewalk              │ │   │
│  │  │ • Residential building in East Village             │ │   │
│  │  │ • Historic building (built 1920)                   │ │   │
│  │  │ • Well-maintained with excellent compliance        │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                QUICK ACTIONS                           │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 📊 View     │ │ 📋 Schedule │ │ 🔧 Request  │      │   │
│  │  │ Reports     │ │ Inspection  │ │ Maintenance │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 2: COMPLIANCE & ALERTS

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                    COMPLIANCE & ALERTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                COMPLIANCE OVERVIEW                     │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 🎯 COMPLIANCE SCORE: 90% (A- Grade)                │ │   │
│  │  │ Status: EXCELLENT • Last Updated: 12/01/2024      │ │   │
│  │  │ Trend: Stable • Next Review: 03/01/2025           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                VIOLATIONS SUMMARY                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │HPD          │ │DSNY          │ │FDNY          │      │   │
│  │  │Violations   │ │Violations    │ │Inspections   │      │   │
│  │  │0            │ │0             │ │100% Pass     │      │   │
│  │  │✅ Clean     │ │✅ Clean      │ │✅ All Pass   │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                ACTIVE ALERTS                            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ ✅ NO ACTIVE ALERTS                                 │ │   │
│  │  │ All systems operational                         │ │   │
│  │  │ No violations or issues                             │ │   │
│  │  │ Next inspection: 03/01/2025                         │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 3: SYSTEMS & MAINTENANCE

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                    SYSTEMS & MAINTENANCE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                HVAC SYSTEM                              │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 🔥 HVAC STATUS: OPERATIONAL                         │ │   │
│  │  │ • Boiler: 1 unit (basement)                       │ │   │
│  │  │ • Hot Water Tank: Active                          │ │   │
│  │  │ • Filters: Last changed 10/08/2025                │ │   │
│  │  │ • Next Change Due: 11/08/2025                     │ │   │
│  │  │ • Assigned Worker: Edwin Lema                     │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                WASTE MANAGEMENT                         │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 🗑️ WASTE STATUS: ON SCHEDULE                       │ │   │
│  │  │ • Garbage Bin Set Out: Yes                         │ │   │
│  │  │ • Collection Schedule: Weekly                      │ │   │
│  │  │ • Last Collection: 12/15/2024                      │ │   │
│  │  │ • Next Collection: 12/22/2024                     │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                DRAINAGE SYSTEM                         │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 🌧️ DRAINAGE STATUS: CLEAR                          │ │   │
│  │  │ • Roof Drains: Yes                                  │ │   │
│  │  │ • Backyard Drains: No                              │ │   │
│  │  │ • Drain Check: Seasonal                            │ │   │
│  │  │ • Last Check: 10/15/2024                          │ │   │
│  │  │ • Next Check: 04/15/2025                          │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 4: FINANCIAL & REPORTS

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                    FINANCIAL & REPORTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                FINANCIAL OVERVIEW                      │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 💰 PROPERTY VALUES                                 │ │   │
│  │  │ • Market Value: $9,600,000                         │ │   │
│  │  │ • Assessed Value: $4,800,000                       │ │   │
│  │  │ • Taxable Value: $4,320,000                        │ │   │
│  │  │ • Exemptions: $480,000                            │ │   │
│  │  │ • Current Tax Owed: $0                            │ │   │
│  │  │ • Assessment Trend: Stable                        │ │   │
│  │  │ • Per Unit Value: $1,200,000                       │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                RECENT ACTIVITY                         │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 📅 ACTIVITY TIMELINE                               │ │   │
│  │  │ • 10/08/2025: HPD inspection - PASSED              │ │   │
│  │  │ • 10/07/2025: FDNY inspection - PASSED             │ │   │
│  │  │ • 10/08/2025: HVAC filters changed (Edwin Lema)    │ │   │
│  │  │ • 10/09/2025: Drain system check - CLEAR          │ │   │
│  │  │ • 10/09/2025: Property value updated               │ │   │
│  │  │ • 10/08/2025: DSNY collection - COMPLETED          │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 2: OPERATIONS (Default for Worker) - Routes, Tasks & Team

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        OPERATIONS CENTER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                TODAY'S ROUTES                          │   │
│  │  🚴 Bike Route: 12 min • 🚶 Walking: 15 min           │   │
│  │  🚗 Driving: 8 min • 🚌 Transit: 12 min               │   │
│  │  [Get Directions] [Start Navigation] [Share Location]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                YOUR TASKS TODAY                        │   │
│  │  ✅ HVAC Filters Changed (10/09/2025) - Edwin Lema     │   │
│  │  ✅ Stairwell Cleaning (10/09/2025) - Kevin Dutan     │   │
│  │  ✅ Recycling Collection (10/09/2025) - Kevin Dutan   │   │
│  │  ✅ Garbage Collection (10/09/2025) - Kevin Dutan     │   │
│  │  ✅ Bins Returned to Location (10/09/2025) - Kevin    │   │
│  │  [View All Tasks] [Add Task] [Mark Complete]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                TEAM STATUS                             │   │
│  │  👤 Edwin Lema - Lead (2h 15m) • Available            │   │
│  │  📞 +1-212-555-0101 • Current: HVAC Maintenance       │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  👤 Kevin Dutan - Assistant (1h 45m) • Available      │   │
│  │  📞 +1-212-555-0102 • Current: Stairwell Cleaning     │   │
│  │  [Contact Team] [Assign Task] [View Schedule] [💬 Chat] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                ROUTE TO NEXT LOCATION                   │   │
│  │  🎯 Choose Destination:                                  │   │
│  │  [🏢 224 E 14th St] [🏢 12 W 18th St] [🏢 135-139 W 17th] │   │
│  │  [📍 Custom Location] [📍 Home] [📍 Office]              │   │
│  │  [Get Directions] [Start Navigation] [Save Route]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                TEAM MESSAGING                          │   │
│  │  💬 [Edwin Lema] "HVAC filters changed, all good"      │   │
│  │  📅 10/09/2025 2:15 PM • ✅ Read by Kevin             │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  💬 [Kevin Dutan] "Stairwell cleaning done, found     │   │
│  │      small crack in step 3, need to report"            │   │
│  │  📅 10/09/2025 3:45 PM • ✅ Read by Edwin             │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  💬 [Admin] "Good work today team, keep it up!"        │   │
│  │  📅 10/09/2025 4:30 PM • ✅ Read by Edwin, Kevin     │   │
│  │  [Send Message] [View All Messages] [Mark as Read]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 3: COMPLIANCE (Default for Client) - History, Sanitation & DSNY

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        COMPLIANCE STATUS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                COMPLIANCE OVERVIEW                     │   │
│  │  🎯 Score: 90% (A- Grade) • Status: EXCELLENT         │   │
│  │  📅 Last Updated: 10/09/2025 • Next Review: 01/09/2026 │   │
│  │  [View Full Report] [Export Data] [Schedule Inspection] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                VIOLATIONS & INSPECTIONS                 │   │
│  │  ✅ HPD Violations: 0 • Status: CLEAR                  │   │
│  │  ✅ DSNY Violations: 0 • Status: CLEAR                  │   │
│  │  ✅ FDNY Inspections: PASSED • Status: CLEAR            │   │
│  │  ✅ 311 Complaints: 0 • Status: CLEAR                    │   │
│  │  [View History] [Report Issue] [Contact Agency]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                SANITATION COMPLIANCE                   │   │
│  │  🗑️ Collection Schedule: Monday, Wednesday, Friday      │   │
│  │  📅 Last Collection: 10/08/2025 • Status: COMPLETED    │   │
│  │  📅 Next Collection: 10/14/2025 • Time: 6:00 AM        │   │
│  │  [View Schedule] [Report Issue] [Contact DSNY]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                FINANCIAL IMPACT                         │   │
│  │  💰 Outstanding Fines: $0 • Status: CLEAR             │   │
│  │  💰 Total Fines This Year: $0 • Status: EXCELLENT       │   │
│  │  💰 Estimated Savings: $2,400 • Status: ON TRACK        │   │
│  │  [View Financial Report] [Payment History] [Set Alerts] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 4: WORKERS (Default for Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        TEAM MANAGEMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                TEAM STATISTICS                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ Total: 2    │ │ Active: 2   │ │ On Site: 1  │      │   │
│  │  │ Available:  │ │ Busy: 0     │ │ Offline: 0  │      │   │
│  │  │ 2           │ │             │ │             │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                ACTIVE WORKERS                          │   │
│  │  👤 Edwin Lema                                        │   │
│  │  Role: Maintenance • Status: AVAILABLE • Clocked In    │   │
│  │  Phone: +1-212-555-0101 • Email: edwin@cyntientops.com │   │
│  │  Current Task: Daily Lobby Cleaning                    │   │
│  │  Performance: 94% • This Week: 12 tasks • Streak: 5   │   │
│  │  [View Profile] [Assign Task] [Clock Out]            │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  👤 Kevin Dutan                                       │   │
│  │  Role: Supervisor • Status: AVAILABLE • Clocked In     │   │
│  │  Phone: +1-212-555-0102 • Email: kevin@cyntientops.com │   │
│  │  Current Task: None                                   │   │
│  │  Performance: 98% • This Week: 8 tasks • Streak: 12  │   │
│  │  [View Profile] [Assign Task] [Clock Out]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                TEAM PERFORMANCE                        │   │
│  │  📊 Average Completion Rate: 96%                       │   │
│  │  ⏱️ Average Response Time: 2.3 minutes                 │   │
│  │  🎯 Team Efficiency: 94%                               │   │
│  │  📈 This Week: 20 tasks completed                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 5: HISTORY

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        ACTIVITY HISTORY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                RECENT ACTIVITY                         │   │
│  │  📅 10/08/2025: HPD inspection - PASSED                │   │
│  │  📅 10/07/2025: FDNY inspection - PASSED              │   │
│  │  📅 10/08/2025: HVAC filters changed (Edwin Lema)     │   │
│  │  📅 10/09/2025: Drain system check - CLEAR            │   │
│  │  📅 10/09/2025: Property value updated                │   │
│  │  📅 10/08/2025: DSNY collection - COMPLETED           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                MAINTENANCE HISTORY                    │   │
│  │  🔧 HVAC System Maintenance                           │   │
│  │  Last Service: 10/08/2025 • Next Due: 01/08/2026     │   │
│  │  Status: Excellent • Service Provider: Edwin Lema     │   │
│  │  [View Details] [Schedule Next]                       │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  🧹 Deep Cleaning                                     │   │
│  │  Last Service: 10/07/2025 • Next Due: 01/07/2026     │   │
│  │  Status: Good • Service Provider: Edwin Lema         │   │
│  │  [View Details] [Schedule Next]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                COMPLIANCE HISTORY                     │   │
│  │  🛡️ HPD Violations: 0 (Last 12 months)               │   │
│  │  🗑️ DSNY Violations: 0 (Last 12 months)               │   │
│  │  🚒 FDNY Inspections: 2 passed (Last 12 months)       │   │
│  │  📞 311 Complaints: 0 (Last 12 months)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 6: SANITATION

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        SANITATION SCHEDULE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                COLLECTION SCHEDULE                     │   │
│  │  🗑️ Trash Collection: Monday                          │   │
│  │  Next: Oct 14, 2025 • Set out by 6:00 AM               │   │
│  │  Worker: Edwin Lema • Status: Scheduled               │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  ♻️ Recycling: Wednesday                              │   │
│  │  Next: Oct 16, 2025 • Set out by 6:00 AM             │   │
│  │  Worker: Edwin Lema • Status: Scheduled               │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  🍃 Organics: Friday                                  │   │
│  │  Next: Oct 18, 2025 • Set out by 6:00 AM             │   │
│  │  Worker: Edwin Lema • Status: Scheduled               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                SPECIAL INSTRUCTIONS                    │   │
│  │  • Set out bins by 6:00 AM on collection day          │   │
│  │  • Separate recycling per local guidelines             │   │
│  │  • Bulk pickups may require 311 scheduling            │   │
│  │  • Small building with stairwell and elevator          │   │
│  │  • <9 units - bins set out on sidewalk                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                DSNY COMPLIANCE                         │   │
│  │  ✅ No Active Violations                              │   │
│  │  📊 Compliance Score: 100%                            │   │
│  │  💰 Outstanding Fines: $0                            │   │
│  │  📅 Last Inspection: 10/08/2025                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 7: INVENTORY

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        INVENTORY MANAGEMENT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                INVENTORY OVERVIEW                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ Items: 12   │ │ Low Stock:  │ │ Last        │      │   │
│  │  │ Available:  │ │ 2           │ │ Restock:    │      │   │
│  │  │ 10          │ │             │ │ 10/08/2025  │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                SUPPLIES & EQUIPMENT                    │   │
│  │  🧹 Cleaning Supplies                                 │   │
│  │  • All-Purpose Cleaner: 3 bottles (Good)              │   │
│  │  • Paper Towels: 2 rolls (Low Stock) ⚠️              │   │
│  │  • Trash Bags: 1 box (Low Stock) ⚠️                   │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  🔧 Maintenance Tools                                 │   │
│  │  • HVAC Filters: 2 (MERV-8) • Next Change: 11/08/2025│   │
│  │  • Light Bulbs: 8 (LED) • Status: Good               │   │
│  │  • Plumbing Tools: Complete Set • Status: Good        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                REORDER ALERTS                         │   │
│  │  ⚠️ Paper Towels: Reorder when < 1 roll               │   │
│  │  ⚠️ Trash Bags: Reorder when < 1 box                  │   │
│  │  📧 [Send Reorder Request] [View Suppliers]           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 8: SPACES

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        BUILDING RESOURCES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                BUILDING GALLERY                          │   │
│  │  🔍 [Search Photos...] [Filter] [Sort] [Grid/List]     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │Building  │ │Basement  │ │Roof      │ │Garbage   │      │   │
│  │  │Exterior  │ │Boiler    │ │Drains    │ │Set-Out   │      │   │
│  │  │[Building]│ │[Boiler]  │ │[Drains]  │ │[Bins]    │      │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │Hot Water│ │Stairwell │ │Unit     │ │Maintenance│      │   │
│  │  │System   │ │Access    │ │Entrance │ │Areas     │      │   │
│  │  │[Tank]   │ │[Stairs]  │ │[Door]   │ │[Maint]   │      │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │   │
│  │  📸 [Add Photo] [Edit Gallery] [Export] [Share]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                BUILDING SPACES                          │   │
│  │  🏢 Lobby (Floor 1)                                   │   │
│  │  Access: Key • Status: Accessible • Last: 10/09/2025  │   │
│  │  Photos: 15 • Videos: 3 • Documents: 2                │   │
│  │  [View Media] [Access Log] [Add Photo]                │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  🔧 Mechanical Room (Basement)                       │   │
│  │  Access: Code • Status: Restricted • Last: 10/08/2025│   │
│  │  Photos: 8 • Videos: 1 • Documents: 5                 │   │
│  │  [View Media] [Access Log] [Add Photo]                │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  🗑️ Trash Room (Basement)                            │   │
│  │  Access: Key • Status: Accessible • Last: 10/09/2025  │   │
│  │  Photos: 12 • Videos: 2 • Documents: 1                 │   │
│  │  [View Media] [Access Log] [Add Photo]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                SUPPLIES INVENTORY                       │   │
│  │  🧽 Cleaning: 6 bottles • 🧹 Paper Towels: 12 rolls    │   │
│  │  🔧 Maintenance: Complete • 🚨 Safety: Full Set         │   │
│  │  📊 Inventory Status: GOOD • Last Updated: 10/09/2025  │   │
│  │  [View Full Inventory] [Request Supplies] [Update Stock]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                DOCUMENTATION                            │   │
│  │  📋 Building Plans: Available • 📊 Compliance Reports    │   │
│  │  🔧 Maintenance Logs: Current • 📚 Manuals: Complete    │   │
│  │  [View Documents] [Download PDF] [Share Files]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 TAB 9: EMERGENCY

```
┌─────────────────────────────────────────────────────────────────┐
│                    224 EAST 14TH STREET                        │
│                        EMERGENCY PROCEDURES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                EMERGENCY CONTACTS                     │   │
│  │  🚨 Primary Contact: David Edelman                    │   │
│  │  Role: J&M Realty Portfolio Manager                   │   │
│  │  Phone: +1 (212) 555-0200 • [Call] [Message]         │   │
│  │  Email: David@jmrealty.org                            │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  🚨 Emergency Response: Franco Response Team          │   │
│  │  Role: 24/7 Emergency Response                        │   │
│  │  Phone: (212) 555-0911 • [Call] [Message]            │   │
│  │  Notes: 24/7 emergency response team                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                EMERGENCY PROCEDURES                    │   │
│  │  🚨 Fire Emergency: Call 911, Evacuate Building      │   │
│  │  🚨 Medical Emergency: Call 911, Administer First Aid│   │
│  │  🚨 Gas Leak: Evacuate Building, Call 911            │   │
│  │  🚨 Power Outage: Check Circuit Breakers, Call Utility│   │
│  │  🚨 Water Leak: Shut Off Main Valve, Call Plumber    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                EMERGENCY EQUIPMENT                    │   │
│  │  🧯 Fire Extinguishers: 2 (Lobby, Basement)          │   │
│  │  🚨 Fire Alarms: 8 (All Floors)                      │   │
│  │  🚪 Emergency Exits: 2 (Main, Service)               │   │
│  │  📞 Emergency Phone: Lobby (Direct to 911)           │   │
│  │  [View Equipment Map] [Test Equipment] [Report Issue]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                EMERGENCY REPORTS                      │   │
│  │  📋 [Report Emergency] [View Reports] [Emergency Log] │   │
│  │  📊 Last Emergency: None (Last 12 months)            │   │
│  │  🎯 Emergency Response Time: N/A                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Role-Based Intelligence Logic**

### **👷 WORKER VIEW (Edwin Lema)**
- **Default Tab**: Tasks (Task management and completion)
- **Priority Content**: 
  - **Tasks Tab**: Assigned maintenance routines, task completion, photo requirements
  - **Routes Tab**: Navigation to building, route optimization, travel times
  - **Workers Tab**: Team coordination, worker assignments, communication
  - **Emergency Tab**: Safety procedures, emergency contacts, evacuation plans
- **Quick Actions**: Mark tasks complete, request supplies, report issues, clock in/out
- **Hidden Content**: Financial data, detailed compliance reports (unless relevant to tasks)

### **👤 CLIENT VIEW (J&M Realty)**
- **Default Tab**: Overview (Building performance and compliance)
- **Priority Content**:
  - **Overview Tab**: Building performance, compliance status, financial metrics
  - **History Tab**: Maintenance history, compliance records, inspection reports
  - **Spaces Tab**: Media spaces, common areas, facility management
  - **Inventory Tab**: Equipment status, supply levels, maintenance resources
- **Quick Actions**: View reports, schedule inspections, contact management, share building info
- **Hidden Content**: Granular maintenance schedules, individual worker assignments

### **👨‍💼 ADMIN VIEW (System Admin)**
- **Default Tab**: Workers (Team management and performance)
- **Priority Content**:
  - **Workers Tab**: Team management, performance metrics, assignment optimization
  - **Tasks Tab**: Task scheduling, routine management, completion tracking
  - **Sanitation Tab**: DSNY compliance, waste management, collection schedules
  - **Emergency Tab**: Safety protocols, emergency preparedness, contact management
- **Quick Actions**: Full access to all actions, system configuration, user management
- **Hidden Content**: None (full access to all data)

---

## 📱 **Mobile-First Design Principles**

### **Tabbed Interface Benefits:**
1. **No Infinite Scroll**: Content organized into digestible tabs
2. **Role-Based Defaults**: Each user type sees relevant content first
3. **Touch-Friendly**: Large tab targets (44px minimum)
4. **Swipe Navigation**: Horizontal swiping between tabs
5. **Contextual Actions**: Tab-specific quick actions

### **Intelligent Content Organization:**
1. **Overview Tab**: Essential building info and compliance status
2. **Routes Tab**: Navigation and waypoint management
3. **Tasks Tab**: Maintenance routines and task completion
4. **Workers Tab**: Team management and performance tracking
5. **History Tab**: Activity logs and maintenance records
6. **Sanitation Tab**: DSNY schedules and waste management
7. **Inventory Tab**: Supplies and equipment management
8. **Spaces Tab**: Media spaces and facility management
9. **Emergency Tab**: Safety procedures and emergency contacts

### **Portfolio-Wide Persistence:**
- **User Preferences**: Remember default tab per user role
- **Building Context**: Maintain building selection across navigation
- **Tab State**: Remember last viewed tab per building
- **Quick Access**: Consistent navigation patterns across all 22 buildings

---

## 🔧 **Technical Implementation**

### **Tab State Management:**
```typescript
interface BuildingDetailState {
  activeTab: 'overview' | 'compliance' | 'systems' | 'financial';
  userRole: 'worker' | 'client' | 'admin';
  buildingId: string;
  lastViewedTab: Record<string, string>; // buildingId -> tab
}
```

### **Role-Based Tab Defaults:**
```typescript
const getDefaultTab = (userRole: string): string => {
  switch (userRole) {
    case 'worker': return 'systems';
    case 'client': return 'overview';
    case 'admin': return 'compliance';
    default: return 'overview';
  }
};
```

### **Portfolio Persistence:**
- **Local Storage**: Remember user preferences and tab states
- **Building Context**: Maintain building selection across app navigation
- **Tab Memory**: Remember last viewed tab for each building
- **Quick Navigation**: Consistent patterns across all 22 buildings

This mobile-first tabbed approach eliminates infinite scroll, provides role-based intelligence, and maintains context across the entire portfolio while being touch-friendly and accessible.