pull # 📱 68 Perry Street - Mobile Wire Diagram

## 🏗️ **Mobile Interface Architecture Wire Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           📱 MOBILE SCREEN LAYOUT                              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        🏢 HERO SECTION                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  🏢 68 Perry Street                                            │   │   │
│  │  │  📍 68 Perry Street, New York, NY 10014                       │   │   │
│  │  │  [Compliance: 45%] [Units: 6] [Sq Ft: 4,200]                 │   │   │
│  │  │  [Building Image]                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    📊 COMPLIANCE OVERVIEW SECTION                      │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  🚨 CRITICAL STATUS                                            │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │  Score: 45/100  [🔴 RED CIRCLE]                        │   │   │   │
│  │  │  │  Status: "Needs Attention"                              │   │   │   │
│  │  │  │  Current Status: 23 active violations                   │   │   │   │
│  │  │  │  $2,100 outstanding                                    │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  📋 VIOLATIONS BY TYPE                                         │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │  HPD: 12  [🔴 RED BADGE]                               │   │   │   │
│  │  │  │  Housing Preservation & Development                    │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │  DOB: 0   [⚪ GRAY BADGE]                              │   │   │   │
│  │  │  │  Department of Buildings                               │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │  DSNY: 11 [🔴 RED BADGE]                              │   │   │   │
│  │  │  │  Sanitation & Waste Management                         │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  📋 ACTION REQUIRED                                            │   │   │
│  │  │  Please contact building management to address active violations │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    🔧 MAINTENANCE ROUTINES SECTION                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  🏠 Heat/Hot Water Check                                       │   │   │
│  │  │  Daily                                                          │   │   │
│  │  │  🪟 Window Guards Inspection                                   │   │   │
│  │  │  Weekly                                                         │   │   │
│  │  │  🗑️ Trash Set-Out Management                                   │   │   │
│  │  │  Daily                                                          │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    📅 UPCOMING SCHEDULE SECTION                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  🗑️ Next DSNY Pickup                                          │   │   │
│  │  │  Tomorrow, 6:00 AM                                            │   │   │
│  │  │  Set out bins by 5:30 AM                                      │   │   │
│  │  │  🔧 HPD Inspection                                            │   │   │
│  │  │  January 20, 2025                                             │   │   │
│  │  │  Prepare documentation                                        │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                  │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   NYC APIs  │───▶│ ViolationData│───▶│BuildingDetail│───▶│ComplianceStatus│   │
│  │             │    │   Service   │    │   Screen    │    │     Card    │     │
│  │ HPD/DOB/DSNY│    │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Real-time   │    │ Cached Data │    │ Mobile UI   │    │ User Display│     │
│  │ Violations  │    │ & Offline   │    │ Components  │    │ & Actions   │     │
│  │ Updates     │    │ Queue       │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🧩 **Component Hierarchy**

```
BuildingDetailScreen
├── Hero Section
│   ├── Building Name
│   ├── Address
│   ├── Key Stats (Compliance, Units, Sq Ft)
│   └── Building Image
├── Compliance Overview Section
│   ├── ComplianceStatusCard
│   │   ├── Score Circle (45/100)
│   │   ├── Status Text ("Needs Attention")
│   │   ├── Violation Summary (23 active)
│   │   ├── Outstanding Fines ($2,100)
│   │   └── Action Banner
│   └── Violation Breakdown
│       ├── HPD Violations (12)
│       ├── DOB Violations (0)
│       └── DSNY Violations (11)
├── Maintenance Routines Section
│   ├── Heat/Hot Water Check
│   ├── Window Guards Inspection
│   └── Trash Set-Out Management
└── Upcoming Schedule Section
    ├── Next DSNY Pickup
    └── HPD Inspection
```

## 🎨 **UI Component Wire Frames**

### **ComplianceStatusCard Component**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🚨 CRITICAL STATUS                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │  Score: 45/100  [🔴 RED CIRCLE]                      │   │   │   │
│  │  │  │  Status: "Needs Attention"                            │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  │  Current Status: 23 active violations                         │   │   │   │
│  │  │  $2,100 outstanding                                          │   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📋 VIOLATIONS BY TYPE                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  HPD: 12  [🔴 RED BADGE]                                       │   │   │
│  │  │  Housing Preservation & Development                            │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  DOB: 0   [⚪ GRAY BADGE]                                      │   │   │
│  │  │  Department of Buildings                                       │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  DSNY: 11 [🔴 RED BADGE]                                       │   │   │
│  │  │  Sanitation & Waste Management                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📋 ACTION REQUIRED                                                    │   │
│  │  Please contact building management to address active violations       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **Hero Section Component**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🏢 68 Perry Street                                                    │   │
│  │  📍 68 Perry Street, New York, NY 10014                               │   │
│  │                                                                         │   │
│  │  [Compliance: 45%] [Units: 6] [Sq Ft: 4,200]                          │   │
│  │                                                                         │   │
│  │  [Building Image]                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **User Interaction Flow**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION FLOW                              │
│                                                                                 │
│  User Opens Building Detail                                                    │
│         │                                                                       │
│         ▼                                                                       │
│  Hero Section Loads                                                             │
│         │                                                                       │
│         ▼                                                                       │
│  Compliance Section Shows Critical Status                                       │
│         │                                                                       │
│         ▼                                                                       │
│  User Sees 23 Active Violations                                                │
│         │                                                                       │
│         ▼                                                                       │
│  User Taps on Specific Violation Type                                           │
│         │                                                                       │
│         ▼                                                                       │
│  Detailed Violation Information Appears                                        │
│         │                                                                       │
│         ▼                                                                       │
│  User Can Take Action or Contact Management                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📱 **Mobile-Specific Features**

### **Touch Interactions**
- **Tap to Expand**: Violation details
- **Swipe Navigation**: Between building sections
- **Pull to Refresh**: Update violation data
- **Long Press**: Additional violation information

### **Responsive Design**
- **Portrait Mode**: Vertical scrolling layout
- **Landscape Mode**: Optimized for tablet viewing
- **Dark Mode**: Native iOS dark theme support
- **Accessibility**: VoiceOver support for compliance data

### **Real-Time Updates**
- **WebSocket Connection**: Live violation updates
- **Push Notifications**: New violation alerts
- **Background Sync**: Offline queue management
- **Photo Evidence**: Encrypted photo storage

This wire diagram shows the complete mobile interface architecture for displaying 68 Perry Street's compliance data with all components, data flow, and user interactions.
