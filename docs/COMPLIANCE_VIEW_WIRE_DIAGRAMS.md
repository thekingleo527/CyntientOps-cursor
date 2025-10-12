# 📱 Mobile-First Compliance Section Wire Diagrams

## Overview
Mobile-optimized wire diagrams showing all compliance views that need to be hydrated with real NYC API data for our 18-building portfolio. All views are designed for mobile-first experience with touch-friendly interfaces.

---

## 📱 Mobile Compliance Dashboard Main View

```
┌─────────────────────────────────────┐
│        COMPLIANCE DASHBOARD         │
│         [← Back] [⚙️ Settings]      │
├─────────────────────────────────────┤
│  📊 Portfolio Overview              │
│  ┌─────────────────────────────────┐ │
│  │ Total Buildings: 18             │ │
│  │ Critical Issues: 3              │ │
│  │ Overall Score: 87/100 (B+)     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  🚨 Critical Buildings              │
│  ┌─────────────────────────────────┐ │
│  │ 148 Chambers Street            │ │
│  │ HPD: 3 violations (2 Class A)   │ │
│  │ DSNY: 2 tickets, $1,890      │ │
│  │ Score: 65/100 (C) - CRITICAL │ │
│  │ [View Details] [Take Action]   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ⚠️ High Priority Buildings          │
│  ┌─────────────────────────────────┐ │
│  │ 36 Walker Street               │ │
│  │ DSNY: 2 violations             │ │
│  │ DSNY: $1,890 outstanding       │ │
│  │ Score: 72/100 (C+) - HIGH      │ │
│  │ [View Details] [Take Action]   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📈 Quick Stats                    │
│  ┌─────────────────────────────────┐ │
│  │ [📊 View Trends] [💰 Finances]  │ │
│  │ [📋 All Buildings] [🔍 Search]  │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Data Sources Needed:**
- HPD violations API
- DSNY/ECB violations API
- DOB permits API
- Real-time compliance scoring
- Historical trend data

---

## 📱 Mobile Building Detail Compliance Tab

```
┌─────────────────────────────────────┐
│     BUILDING COMPLIANCE DETAIL     │
│   [← Back] [📋 History] [💰 Fines] │
├─────────────────────────────────────┤
│  12 West 18th Street, Manhattan    │
│                                     │
│  📊 Building Overview              │
│  ┌─────────────────────────────────┐ │
│  │ Units: 16 | Year: 1925         │ │
│  │ Compliance: 95/100 (A)         │ │
│  │ Market Value: $8,500,000       │ │
│  │ Assessed: $4,250,000           │ │
│  │ Tax Status: Current (2024)     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ✅ No Active Violations           │
│  ┌─────────────────────────────────┐ │
│  │ HPD Violations: 0             │ │
│  │ DSNY Violations: 0            │ │
│  │ FDNY Inspections: All Passed  │ │
│  │ 311 Complaints: 0             │ │
│  │ [View History] [View Reports] │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ✅ Clean Records                  │
│  ┌─────────────────────────────────┐ │
│  │ DSNY: 0 violations             │ │
│  │ FDNY: All inspections passed   │ │
│  │ 311: No active complaints      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📋 Recent Activity                │
│  ┌─────────────────────────────────┐ │
│  │ Oct 1: HPD Class A issued      │ │
│  │ Sep 28: Plumbing resolved      │ │
│  │ Sep 25: Heat violation issued  │ │
│  │ [View Full History]            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  💰 Financial Impact               │
│  ┌─────────────────────────────────┐ │
│  │ Outstanding: $0                │ │
│  │ Paid This Year: $0             │ │
│  │ Est. Resolution: $2,500        │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Data Sources Needed:**
- DOF property assessment data (market value, assessed value, tax status)
- HPD violations with classes and due dates
- DSNY violation history
- FDNY inspection records
- 311 complaint history
- Financial tracking data

---

## 📋 Violation History View

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIOLATION HISTORY                           │
│             12 West 18th Street, Manhattan                     │
├─────────────────────────────────────────────────────────────────┤
│  📊 Summary Statistics                                         │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │ Total: 24       │ Open: 6         │ Closed: 18              │ │
│  │ Outstanding: $0 │ Paid: $0        │ Compliance: 82/100      │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
│                                                                 │
│  🔍 Search & Filters                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [Search violations...] [Filters ▼] [Export] [Refresh]      │ │
│  │                                                             │ │
│  │ Type: [All ▼] Status: [All ▼] Severity: [All ▼]           │ │
│  │ Date Range: [Last 30 days ▼]                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📋 Violation List                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏠 HPD VIOLATION - Class A - OPEN - CRITICAL               │ │
│  │ Heat/Hot Water Violation                                   │ │
│  │ Issued: Oct 1, 2025 | Due: Oct 8, 2025                    │ │
│  │ Description: No heat or hot water in multiple units        │ │
│  │ [View Details] [Add Note] [Mark Resolved]                  │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ 🏠 HPD VIOLATION - Class B - OPEN - HIGH                   │ │
│  │ Plumbing Violation                                         │ │
│  │ Issued: Sep 25, 2025 | Due: Oct 25, 2025                  │ │
│  │ Description: Leaking pipes in basement                     │ │
│  │ [View Details] [Add Note] [Mark Resolved]                  │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ 🗑️ DSNY VIOLATION - CLOSED - MEDIUM                       │ │
│  │ Improper Setout                                            │ │
│  │ Issued: Aug 15, 2025 | Resolved: Aug 20, 2025             │ │
│  │ Fine: $100 | Paid: $100                                    │ │
│  │ [View Details] [View Receipt]                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources Needed:**
- Complete violation history from all NYC APIs
- Search and filtering capabilities
- Export functionality
- Resolution tracking
- Financial payment tracking

---

## 🏛️ HPD Violations Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│                    HPD VIOLATIONS                              │
│             12 West 18th Street, Manhattan                     │
├─────────────────────────────────────────────────────────────────┤
│  📊 HPD Summary                                                │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │ Total: 6        │ Open: 6         │ Closed: 0               │ │
│  │ Class A: 2      │ Class B: 3      │ Class C: 1              │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
│                                                                 │
│  🚨 Class A Violations (Critical - 24 Hour Response)           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Violation #1234567890                                      │ │
│  │ Type: Heat/Hot Water                                       │ │
│  │ Issued: Oct 1, 2025 | Due: Oct 8, 2025                    │ │
│  │ Status: OPEN | Priority: CRITICAL                          │ │
│  │ Description: No heat or hot water in units 2A, 3B, 4C     │ │
│  │ Inspector: John Smith | HPD ID: 12345                      │ │
│  │ [View Full Details] [Add Resolution Note] [Upload Photo]   │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ Violation #1234567891                                      │ │
│  │ Type: Heat/Hot Water                                       │ │
│  │ Issued: Sep 28, 2025 | Due: Oct 5, 2025                   │ │
│  │ Status: OPEN | Priority: CRITICAL                          │ │
│  │ Description: Boiler malfunction affecting entire building  │ │
│  │ Inspector: Jane Doe | HPD ID: 12346                        │ │
│  │ [View Full Details] [Add Resolution Note] [Upload Photo]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ⚠️ Class B Violations (Hazardous - 30 Day Response)           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Violation #1234567892                                      │ │
│  │ Type: Plumbing                                             │ │
│  │ Issued: Sep 25, 2025 | Due: Oct 25, 2025                  │ │
│  │ Status: OPEN | Priority: HIGH                              │ │
│  │ Description: Leaking pipes in basement causing water damage│ │
│  │ Inspector: Bob Johnson | HPD ID: 12347                     │ │
│  │ [View Full Details] [Add Resolution Note] [Upload Photo]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources Needed:**
- HPD violations API with full details
- Inspector information
- Violation class and priority mapping
- Due date calculations
- Resolution tracking

---

## 🗑️ DSNY Violations Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│                    DSNY VIOLATIONS                             │
│             68 Perry Street, Manhattan                         │
├─────────────────────────────────────────────────────────────────┤
│  📊 DSNY Summary                                               │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │ Total: 11       │ Open: 11        │ Closed: 0               │ │
│  │ Outstanding:    │ Paid: $0        │ Total Fines: $2,100     │ │
│  │ $2,100          │                 │                         │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
│                                                                 │
│  🚨 Active Violations                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Ticket #DSNY-2025-001234                                  │ │
│  │ Type: Improper Setout                                     │ │
│  │ Issued: Oct 3, 2025 | Hearing: Nov 15, 2025              │ │
│  │ Fine: $100 | Status: OPEN | Severity: HIGH                │ │
│  │ Description: Trash placed out before 6:00 PM on day before │ │
│  │ collection. Violation occurred at 5:30 PM.                │ │
│  │ Officer: Officer Smith | Badge: 12345                      │ │
│  │ [Pay Fine] [Request Hearing] [View Evidence]               │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ Ticket #DSNY-2025-001235                                  │ │
│  │ Type: Recycling Violation                                  │ │
│  │ Issued: Sep 28, 2025 | Hearing: Nov 10, 2025              │ │
│  │ Fine: $150 | Status: OPEN | Severity: MEDIUM              │ │
│  │ Description: Mixed recyclables with regular trash in same  │ │
│  │ container. Glass bottles found in regular trash bag.       │ │
│  │ Officer: Officer Johnson | Badge: 12346                    │ │
│  │ [Pay Fine] [Request Hearing] [View Evidence]               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  💰 Payment Options                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [Pay All Outstanding] [Pay Individual] [Payment Plan]      │ │
│  │ Total Outstanding: $2,100                                  │ │
│  │ Due Date: Varies by ticket                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources Needed:**
- DSNY/ECB violations API
- Officer information and badge numbers
- Hearing scheduling
- Payment tracking
- Evidence photos

---

## 🚒 FDNY Inspections Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│                    FDNY INSPECTIONS                            │
│             178 Spring Street, Manhattan                       │
├─────────────────────────────────────────────────────────────────┤
│  📊 FDNY Summary                                               │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │ Total: 8        │ Passed: 5       │ Failed: 3               │ │
│  │ Last Inspection:│ Next Due:       │ Compliance: 62%         │ │
│  │ Sep 15, 2025    │ Dec 15, 2025    │                         │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
│                                                                 │
│  🚨 Failed Inspections (Require Immediate Action)              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Inspection #FDNY-2025-001                                  │ │
│  │ Type: Fire Safety System                                   │ │
│  │ Date: Sep 15, 2025 | Status: FAILED | Severity: HIGH       │ │
│  │ Inspector: Captain Smith | FDNY ID: 12345                  │ │
│  │ Issues Found:                                               │ │
│  │ • Fire alarm system not functioning properly               │ │
│  │ • Emergency exit signs not illuminated                     │ │
│  │ • Fire extinguisher missing from 3rd floor                 │ │
│  │ Re-inspection Required: Oct 15, 2025                       │ │
│  │ [Schedule Re-inspection] [View Full Report] [Upload Fixes] │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ Inspection #FDNY-2025-002                                  │ │
│  │ Type: Emergency Exits                                      │ │
│  │ Date: Sep 10, 2025 | Status: FAILED | Severity: CRITICAL   │ │
│  │ Inspector: Lieutenant Johnson | FDNY ID: 12346             │ │
│  │ Issues Found:                                               │ │
│  │ • Emergency exit door blocked by storage                   │ │
│  │ • Exit lighting not working                                │ │
│  │ • Fire escape access obstructed                            │ │
│  │ Re-inspection Required: Oct 10, 2025                       │ │
│  │ [Schedule Re-inspection] [View Full Report] [Upload Fixes] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ✅ Passed Inspections                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Inspection #FDNY-2025-003 - Sprinkler System - PASSED      │ │
│  │ Date: Aug 20, 2025 | Next Due: Aug 20, 2026               │ │
│  │ [View Report]                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources Needed:**
- FDNY inspections API
- Inspector information
- Detailed inspection reports
- Re-inspection scheduling
- Compliance tracking

---

## 📞 311 Complaints Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│                    311 COMPLAINTS                              │
│             104 Franklin Street, Manhattan                     │
├─────────────────────────────────────────────────────────────────┤
│  📊 311 Summary                                                │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │ Total: 15       │ Open: 3         │ Closed: 12              │ │
│  │ Response Time:  │ Resolution:     │ Satisfaction:           │ │
│  │ 2.3 days        │ 78%             │ 4.2/5.0                 │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
│                                                                 │
│  🚨 Active Complaints                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Complaint #311-2025-001234                                │ │
│  │ Type: Noise Complaint                                      │ │
│  │ Created: Oct 2, 2025 | Status: OPEN | Priority: MEDIUM     │ │
│  │ Reporter: Anonymous | Source: Phone                        │ │
│  │ Description: Loud construction noise after 6 PM on weekdays│ │
│  │ Assigned To: Inspector Smith | Agency: DOB                 │ │
│  │ [Add Response] [View History] [Mark Resolved]              │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ Complaint #311-2025-001235                                │ │
│  │ Type: Heat/Hot Water                                       │ │
│  │ Created: Sep 30, 2025 | Status: IN PROGRESS | Priority: HIGH│ │
│  │ Reporter: Tenant (Unit 2A) | Source: Mobile App            │ │
│  │ Description: No heat in apartment since Sep 28, 2025       │ │
│  │ Assigned To: Inspector Johnson | Agency: HPD               │ │
│  │ [Add Response] [View History] [Mark Resolved]              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📈 Complaint Trends                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [Chart: Complaints by Type] [Chart: Response Times]        │ │
│  │ [Chart: Resolution Rates] [Chart: Satisfaction Scores]     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources Needed:**
- 311 complaints API
- Reporter information
- Assignment tracking
- Response time metrics
- Satisfaction scores

---

## 💰 Financial Impact Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                  FINANCIAL IMPACT DASHBOARD                    │
│                    Portfolio Overview                           │
├─────────────────────────────────────────────────────────────────┤
│  💰 Portfolio Financial Summary                                │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐ │
│  │ Total Fines:    │ Paid: $0        │ Outstanding: $30,114    │ │
│  │ $30,114         │                 │                         │ │
│  │ Properties with │ Properties with │ Properties with         │ │
│  │ Fines: 4        │ Clean Record: 14│ Critical Issues: 3      │ │
│  └─────────────────┴─────────────────┴─────────────────────────┘ │
│                                                                 │
│  🏠 Building Financial Breakdown                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 178 Spring Street (Building #17)                          │ │
│  │ Outstanding: $14,687 (39% of total)                       │ │
│  │ Violations: 1 DSNY ticket                                  │ │
│  │ Status: CRITICAL - Immediate payment required              │ │
│  │ [Pay Now] [Payment Plan] [View Details]                   │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ 148 Chambers Street (Building #21)                        │ │
│  │ Outstanding: $12,000 (32% of total)                       │ │
│  │ Violations: 13 DSNY tickets                                │ │
│  │ Status: CRITICAL - Multiple violations                     │ │
│  │ [Pay Now] [Payment Plan] [View Details]                   │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ 68 Perry Street (Building #6)                             │ │
│  │ Outstanding: $2,100 (6% of total)                         │ │
│  │ Violations: 11 DSNY tickets                                │ │
│  │ Status: HIGH PRIORITY - Multiple violations                │ │
│  │ [Pay Now] [Payment Plan] [View Details]                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📊 Payment Analytics                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [Chart: Fines by Month] [Chart: Payment Trends]            │ │
│  │ [Chart: Violation Costs] [Chart: Resolution ROI]           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources Needed:**
- Financial tracking from all violation sources
- Payment history
- Cost analysis
- ROI calculations
- Budget impact assessments

---

## 🎯 Action Items & Next Steps

### **Immediate Hydration Required:**
1. **Property Values Integration** - DOF assessment data for all 19 buildings
2. **Real Violation Data** - Live HPD, DSNY, FDNY, 311 APIs
3. **Financial Tracking** - Outstanding fines and payment status
4. **Compliance Scoring** - Real-time calculation based on actual violations
5. **Historical Data** - Complete violation history for trend analysis

### **Data Sources to Implement:**
- **DOF API**: Property assessments, market values, tax status
- **HPD API**: Violations with classes, due dates, inspector info
- **DSNY/ECB API**: Tickets, fines, hearing schedules
- **FDNY API**: Inspections, compliance status, re-inspection dates
- **311 API**: Complaints, response times, resolution tracking

### **Views to Hydrate:**
1. Compliance Dashboard Main View
2. Building Detail Compliance Tab
3. Violation History View
4. HPD Violations Detail View
5. DSNY Violations Detail View
6. FDNY Inspections Detail View
7. 311 Complaints Detail View
8. Financial Impact Dashboard

---

**Status**: All wire diagrams completed - Ready for implementation with real NYC API data
