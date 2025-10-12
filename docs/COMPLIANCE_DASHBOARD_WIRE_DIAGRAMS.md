# 📱 Compliance Dashboard Wire Diagrams

## Overview
This document provides precise wire diagrams showing exactly how the compliance dashboard is displayed and integrated across different screens and user roles.

---

## 1. 📱 Mobile Compliance Dashboard - Main Screen

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Compliance Dashboard                    ⟳ Refresh        │
│ Real-time compliance data from NYC APIs                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 PORTFOLIO OVERVIEW                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Total        │ │Critical     │ │Overall      │ │Grade    │ │
│ │Buildings    │ │Issues       │ │Score        │ │         │ │
│ │18           │ │3            │ │87%          │ │B+       │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 💰 FINANCIAL IMPACT                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │Total Fines  │ │Outstanding  │ │Paid         │            │
│ │$45,230      │ │$12,450      │ │$32,780      │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                             │
│ 🚨 CRITICAL BUILDINGS                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 123 Main St                    Score: 45%  Grade: D  │ │
│ │ 5 violations • $2,340 fines • CRITICAL                 │ │
│ │ Last inspection: 10/10/2025 • Next: 01/10/2026         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 456 Broadway                   Score: 52%  Grade: D  │ │
│ │ 3 violations • $1,890 fines • HIGH                     │ │
│ │ Last inspection: 10/10/2025 • Next: 01/10/2026         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📋 VIOLATIONS SUMMARY                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │HPD          │ │DSNY         │ │FDNY         │ │311      │ │
│ │Violations   │ │Violations   │ │Inspections  │ │Complaints│ │
│ │12           │ │8            │ │15           │ │7        │
│ │8 open       │ │$5,230    │ │93% pass     │ │4.2/5.0  │ │
│ │4 critical   │ │outstanding  │ │rate         │ │satisfaction│
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 🔔 ACTIVE ALERTS                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 CRITICAL: 123 Main St has 5 HPD violations          │ │
│ │ ⚠️  WARNING: 456 Broadway has $1,890 outstanding fines │ │
│ │ ℹ️  INFO: 789 Park Ave needs next inspection           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📈 COMPLIANCE TRENDS                                         │
│ [Chart showing compliance trends over time]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 🏢 Building Compliance Detail - Tabbed Interface

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back  🏢 123 Main St, New York, NY 10001                 │
│ Score: 45%  Grade: D  CRITICAL                             │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Violations] [Financial] [Inspections]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 OVERVIEW TAB                                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Compliance   │ │Status       │ │Total        │ │Outstanding│ │
│ │Score        │ │             │ │Violations   │ │Fines     │ │
│ │45%          │ │CRITICAL     │ │12           │ │$2,340    │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 📈 QUICK STATS                                               │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │HPD          │ │DSNY         │ │FDNY         │ │311      │ │
│ │Violations   │ │Violations   │ │Inspections  │ │Complaints│ │
│ │8            │ │3            │ │5            │ │2        │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 📅 INSPECTION SCHEDULE                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Last Inspection: 12/15/2024                            │ │
│ │ Next Inspection: 01/15/2025                            │ │
│ │ Status: Overdue                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Violations Tab
```
┌─────────────────────────────────────────────────────────────┐
│ [Overview] [Violations] [Financial] [Inspections]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🏢 HPD VIOLATIONS (8)                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 Class A - Heat/Hot Water Violation                 │ │
│ │ Found: 12/15/2024 • Status: OPEN                      │ │
│ │ Inspector: John Smith • Penalty: $500                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️  Class B - Pest Control Violation                   │ │
│ │ Found: 12/10/2024 • Status: OPEN                       │ │
│ │ Inspector: Jane Doe • Penalty: $250                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🗑️ DSNY VIOLATIONS (3)                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 Improper Waste Disposal                             │ │
│ │ Issued: 12/20/2024 • Status: OPEN                     │ │
│ │ Fine: $1,000 • Paid: $0 • Outstanding: $1,000        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🚒 FDNY INSPECTIONS (5)                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Fire Safety Inspection - PASSED                     │ │
│ │ Date: 11/30/2024 • Inspector: Mike Johnson             │ │
│ │ Issues: None • Re-inspection: Not required             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📞 311 COMPLAINTS (2)                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏠 Noise Complaint                                     │ │
│ │ Created: 12/18/2024 • Status: OPEN                     │ │
│ │ Reporter: Anonymous • Agency: NYPD                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Financial Tab
```
┌─────────────────────────────────────────────────────────────┐
│ [Overview] [Violations] [Financial] [Inspections]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💰 FINANCIAL SUMMARY                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Total Fines  │ │Outstanding  │ │Paid         │ │Estimated│ │
│ │$2,340       │ │$2,340       │ │$0           │ │$1,500   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 📊 PAYMENT BREAKDOWN                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HPD Violations: $750 (3 violations)                    │ │
│ │ DSNY Violations: $1,590 (2 violations)                │ │
│ │ Total Outstanding: $2,340                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📈 PAYMENT HISTORY                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ No recent payments                                     │ │
│ │ Last payment: N/A                                      │ │
│ │ Payment method: N/A                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 🏢 Building Configuration Screen - Enhanced with Compliance

```
┌─────────────────────────────────────────────────────────────┐
│ Building Configuration                    19 buildings       │
├─────────────────────────────────────────────────────────────┤
│ [Search buildings...]                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 123 Main St                    ID: 1    ACTIVE      │ │
│ │ 📍 123 Main St, New York, NY 10001                     │ │
│ │ 🗺️ Manhattan                                            │ │
│ │                                                         │ │
│ │ 📊 Stats: 20 Units • 25,000 sq ft • Built 1985         │ │
│ │ 🏛️ J&M Realty LLC                                       │ │
│ │ 👤 David Edelman • (212) 555-0200                      │ │
│ │                                                         │ │
│ │ 🏢 COMPLIANCE SCORE                                      │ │
│ │ Score: 45% • Grade: D • Status: CRITICAL               │ │
│ │ 🚨 5 violations • $2,340 fines                          │ │
│ │                                                         │ │
│ │ 📍 40.7589, -73.9851                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 456 Broadway                  ID: 2    ACTIVE      │ │
│ │ 📍 456 Broadway, New York, NY 10002                   │ │
│ │ 🗺️ Manhattan                                            │ │
│ │                                                         │ │
│ │ 📊 Stats: 15 Units • 18,000 sq ft • Built 1990         │ │
│ │ 🏛️ Weber Farhat Realty                                 │ │
│ │ 👤 Moises Farhat • (212) 555-0201                      │ │
│ │                                                         │ │
│ │ 🏢 COMPLIANCE SCORE                                      │ │
│ │ Score: 78% • Grade: C+ • Status: MEDIUM              │ │
│ │ ⚠️ 2 violations • $890 fines                            │ │
│ │                                                         │ │
│ │ 📍 40.7589, -73.9851                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 👤 Client Dashboard - Portfolio Compliance Integration

```
┌─────────────────────────────────────────────────────────────┐
│ Client Dashboard                    Edelman Properties LLC  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 PORTFOLIO OVERVIEW                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Buildings    │ │Workers      │ │Completion   │ │Critical │ │
│ │18           │ │12           │ │87%          │ │3        │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 🏢 COMPLIANCE INTEGRATION                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 View Portfolio Compliance                            │ │
│ │ Real-time compliance data from NYC APIs                │ │
│ │                                                         │ │
│ │ 📊 Portfolio Compliance Score: 87% • Grade: B+         │ │
│ │ 🚨 3 Critical Buildings • 12 Total Violations         │ │
│ │ 💰 $45,230 Total Fines • $12,450 Outstanding          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🏢 BUILDING PORTFOLIO                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 123 Main St                    Score: 45%  Grade: D │ │
│ │ 🚨 5 violations • $2,340 fines • CRITICAL             │ │
│ │ Last inspection: 12/15/2024 • Next: 01/15/2025        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 456 Broadway                   Score: 78%  Grade: C+│ │
│ │ ⚠️ 2 violations • $890 fines • MEDIUM                  │ │
│ │ Last inspection: 11/28/2024 • Next: 02/28/2025        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 👨‍💼 Admin Dashboard - System Compliance Integration

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard                    System Overview          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 SYSTEM METRICS                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │Buildings    │ │Workers      │ │Completion   │ │Compliance│ │
│ │18           │ │12/15        │ │87%          │ │78%       │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 🏢 SYSTEM COMPLIANCE INTEGRATION                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 View System Compliance                              │ │
│ │ Real-time compliance data from NYC APIs for all buildings│ │
│ │                                                         │ │
│ │ 📊 System Compliance Score: 78% • Grade: C+            │ │
│ │ 🚨 5 Critical Buildings • 23 Total Violations         │ │
│ │ 💰 $67,890 Total Fines • $18,450 Outstanding          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🏢 ALL BUILDINGS COMPLIANCE                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 123 Main St (Client: Edelman)    Score: 45%  Grade: D│ │
│ │ 🚨 5 violations • $2,340 fines • CRITICAL             │ │
│ │ Last inspection: 12/15/2024 • Next: 01/15/2025        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 456 Broadway (Client: Edelman)  Score: 78%  Grade: C+│ │
│ │ ⚠️ 2 violations • $890 fines • MEDIUM                   │ │
│ │ Last inspection: 11/28/2024 • Next: 02/28/2025        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 789 Park Ave (Client: Weber)    Score: 92%  Grade: A│ │
│ │ ✅ 0 violations • $0 fines • LOW                      │ │
│ │ Last inspection: 10/10/2025 • Next: 01/10/2026        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 👷 Worker Dashboard - Building Compliance Integration

```
┌─────────────────────────────────────────────────────────────┐
│ Worker Dashboard                    Current Building         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🏢 CURRENT BUILDING                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 123 Main St, New York, NY 10001                    │ │
│ │ 📍 Manhattan • 20 Units • 25,000 sq ft               │ │
│ │ 🏛️ J&M Realty LLC • 👤 David Edelman                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🏢 BUILDING COMPLIANCE STATUS                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 Building Compliance                                 │ │
│ │ HPD, DSNY, FDNY, and 311 violations data              │ │
│ │                                                         │ │
│ │ 📊 Compliance Score: 45% • Grade: D • Status: CRITICAL│ │
│ │ 🚨 5 violations • $2,340 fines • 3 critical          │ │
│ │ 📅 Last inspection: 12/15/2024 • Next: 01/15/2025     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📋 TODAY'S TASKS                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Morning cleaning routine (8:00 AM)                 │ │
│ │ ⏳ Trash collection (10:00 AM)                         │ │
│ │ ⏳ Lobby maintenance (2:00 PM)                        │ │
│ │ ⏳ Evening security check (6:00 PM)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🚨 COMPLIANCE ALERTS                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 CRITICAL: Heat/Hot Water Violation (Class A)       │ │
│ │ ⚠️  WARNING: Pest Control Violation (Class B)          │ │
│ │ ℹ️  INFO: Next inspection due 01/15/2025              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 📱 Mobile Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATION FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Client Dashboard                                            │
│     ↓                                                       │
│ [View Portfolio Compliance]                                │
│     ↓                                                       │
│ Compliance Dashboard Screen                                 │
│     ↓                                                       │
│ [Select Building]                                           │
│     ↓                                                       │
│ Building Compliance Detail                                  │
│     ↓                                                       │
│ [Overview] [Violations] [Financial] [Inspections]          │
│                                                             │
│ Admin Dashboard                                             │
│     ↓                                                       │
│ [View System Compliance]                                    │
│     ↓                                                       │
│ Compliance Dashboard Screen                                 │
│     ↓                                                       │
│ [Select Building]                                           │
│     ↓                                                       │
│ Building Compliance Detail                                  │
│                                                             │
│ Worker Dashboard                                            │
│     ↓                                                       │
│ [View Building Compliance]                                  │
│     ↓                                                       │
│ Building Compliance Detail                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ NYC APIs                                                    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │HPD          │ │DSNY         │ │FDNY         │ │311      │ │
│ │Violations   │ │Violations   │ │Inspections  │ │Complaints│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│     ↓               ↓               ↓               ↓       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              APIClientManager                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│     ↓                                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │           ComplianceDashboardService                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│     ↓                                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Mobile UI Components                       │ │
│ │  ComplianceDashboard • BuildingComplianceDetail        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 📱 Mobile-Specific Features

### Touch-Friendly Interface
```
┌─────────────────────────────────────────────────────────────┐
│                    TOUCH TARGETS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [44px min] [44px min] [44px min] [44px min]           │ │
│ │ Touch targets meet accessibility guidelines            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Swipe gestures for navigation                          │ │
│ │ Pull-to-refresh functionality                          │ │
│ │ Touch-friendly compliance cards                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Design
```
┌─────────────────────────────────────────────────────────────┐
│                 RESPONSIVE LAYOUT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Portrait Mode (375px)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Single column layout                                    │ │
│ │ Stacked compliance cards                                │ │
│ │ Full-width touch targets                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Landscape Mode (812px)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Two-column layout                                       │ │
│ │ Side-by-side compliance cards                           │ │
│ │ Optimized for landscape viewing                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. 🎯 Integration Summary

### Component Hierarchy
```
ComplianceDashboardScreen
├── MobileComplianceDashboard
│   ├── ComplianceDashboard (Main Dashboard)
│   └── BuildingComplianceDetail (Building Detail)
└── Integration Components
    ├── ClientDashboardComplianceIntegration
    ├── AdminDashboardComplianceIntegration
    └── BuildingDetailComplianceIntegration
```

### Data Integration Points
- **Building Details**: Real-time compliance scores in building cards
- **Client Dashboard**: Portfolio compliance overview with critical buildings
- **Admin Dashboard**: System-wide compliance management across all clients
- **Worker Dashboard**: Building-specific compliance status and alerts

### Mobile Optimization
- **Touch-friendly interface** with 44px minimum touch targets
- **Responsive design** for portrait and landscape orientations
- **Performance optimization** with lazy loading and caching
- **Accessibility compliance** with proper contrast and navigation

The compliance dashboard is now fully integrated and mobile-ready across all user roles with precise wire diagrams showing exactly how it's displayed and integrated.
