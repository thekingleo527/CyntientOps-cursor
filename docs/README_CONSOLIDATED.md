# 🏗️ CyntientOps-MP - Enterprise Field Operations Management

> **Multiplatform field operations management system for building maintenance teams**
> Enterprise-grade React Native (Expo) application with AI-powered intelligence, offline-first architecture, and real-time synchronization.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-black.svg)](https://expo.dev/)
[![Nx](https://img.shields.io/badge/Nx-Monorepo-lightgrey.svg)](https://nx.dev/)
[![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)](#-project-status)

---

## ⚠️ Project Status

**This is a private development repository.** 

- **No external contributions** are being accepted at this time
- **No licensing** is available for commercial or personal use
- **Access is restricted** to authorized development team members only
- **All code and intellectual property** remains proprietary

This repository is maintained exclusively by the CyntientOps development team and authorized AI assistants for internal development purposes only.

---

## 📖 About

**CyntientOps-MP** is the React Native/TypeScript implementation of CyntientOps, achieving **100% feature parity** with the original SwiftUI application while adding enhanced ML/AI capabilities and cross-platform support. Built as a production-ready Nx monorepo, it delivers sophisticated field operations management for building maintenance teams across iOS, Android, and web platforms.

### 🔄 Relationship to SwiftUI Version

This project is the **multiplatform successor** to the SwiftUI version located at `../cyntientops/`. Key improvements include:

- **Cross-platform support**: iOS, Android, and web from a single codebase
- **Advanced ML/AI**: Enhanced predictive maintenance and intelligent scheduling
- **Monorepo architecture**: Modular, testable, and scalable package structure
- **Complete data parity**: Synchronized with SwiftUI implementation via shared data seed
- **Enhanced offline support**: YJS-based CRDT synchronization with conflict resolution
- **Rich developer experience**: Nx workspace with comprehensive tooling

---

## 🎯 Core Features

### 🤖 AI-Powered Intelligence
- **Nova AI Assistant**: Voice-activated AI for hands-free task management
- **Predictive Maintenance**: ML-based failure prediction using historical data, seasonal patterns, and building characteristics
- **Smart Scheduling**: AI-driven route optimization and task prioritization
- **Natural Language Processing**: Context-aware task creation and parsing
- **Weather Intelligence**: Automatic task generation based on weather conditions and forecasts (Open‑Meteo via WeatherAPIClient)

### 📱 Field Operations
- **Real-time Task Management**: NOW/NEXT/TODAY/URGENT task categorization with intelligent prioritization
- **Photo Evidence + Intelligent Tagging**: Guided capture flow with space selection, suggested/common tags, compression, and smart location verification
- **Multi-Site Departure Mode**: Batch task completion across multiple buildings
- **Offline-First Architecture**: Full functionality without network connectivity
- **Background Sync**: Automatic data synchronization with conflict resolution

### 🗺️ Map & Location Intelligence
- **Building Markers**: Interactive map with 18 NYC building locations
- **Asset Coverage Visualization**: Heatmaps and cluster views
- **Route Optimization**: AI-powered multi-stop routing
- **Geofencing + On‑Site Intelligence**: Location-based task triggers, and on‑site status pill (clock‑in + geofence proximity)
- **Map Reveal Animations**: Smooth MapKit-inspired interactions

### 📊 Role-Based Dashboards
- **Worker Dashboard**: Task lists, schedule view, time tracking, and performance metrics
- **Admin Dashboard**: Portfolio overview, team management, analytics, and compliance monitoring
- **Client Dashboard**: Building status, service history, and real-time updates
- **Intelligence Panels**: Contextual insights and actionable recommendations

### 🔐 Authentication & Security
- **Glass Card Login**: Quick-access authentication for 6 primary users
- **Role-Based Access Control**: Worker, Admin, and Client role separation
- **Biometric Authentication**: Face ID / Touch ID support
- **Session Management**: Secure token-based authentication with refresh

---

## 🏗️ Architecture

### Monorepo Structure

```
cyntientops-mp/
├── apps/
│   ├── mobile-rn/              # React Native Expo mobile app
│   │   ├── src/
│   │   │   ├── app/           # Expo Router file-based navigation
│   │   │   ├── components/    # React Native UI components
│   │   │   ├── services/      # Business logic layer
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   └── utils/        # Utility functions
│   │   ├── assets/            # Images, fonts, and static resources
│   │   ├── ios/               # iOS native configuration
│   │   ├── android/           # Android native configuration
│   │   └── app.json           # Expo configuration
│   ├── web-dashboard/          # Next.js admin web portal
│   └── admin-portal/           # Alternative admin interface
│
├── packages/
│   ├── design-tokens/          # Design system (colors, spacing, typography)
│   ├── domain-schema/          # Core TypeScript domain models
│   ├── database/               # SQLite database layer with migrations
│   ├── business-core/          # Core business logic and rules
│   ├── ui-components/          # Shared React Native UI components
│   ├── intelligence-services/  # ML/AI services (predictive, NLP, clustering)
│   ├── realtime-sync/          # YJS-based CRDT synchronization
│   ├── offline-support/        # Offline queue and conflict resolution
│   ├── api-clients/            # NYC API integrations (311, Buildings, etc.)
│   ├── managers/               # State management (Zustand/Redux)
│   ├── command-chains/         # Command pattern for complex operations
│   ├── context-engines/        # Context awareness and intelligent routing
│   ├── data-seed/              # Database seeding and validation
│   └── testing/                # E2E testing utilities and fixtures
│
├── scripts/                    # Build and deployment scripts
├── nx.json                     # Nx workspace configuration
├── tsconfig.base.json          # TypeScript base configuration
└── package.json                # Root package with workspace scripts
```

### Package Descriptions

| Package | Purpose | Key Technologies |
|---------|---------|------------------|
| **mobile-rn** | Main React Native application with Expo Router | React Native, Expo, React Navigation |
| **design-tokens** | Centralized design system tokens | CSS-in-JS, Theme Provider |
| **domain-schema** | TypeScript models for all entities (Buildings, Workers, Tasks, etc.) | TypeScript, Zod |
| **database** | SQLite database with migrations and query builders | SQLite, TypeORM-style queries |
| **business-core** | Core business logic independent of UI | TypeScript, Validation |
| **ui-components** | Reusable React Native components (Button, Card, Modal, etc.) | React Native, Styled Components |
| **intelligence-services** | ML/AI services for predictions and insights | Brain.js, ML-Matrix, Natural |
| **realtime-sync** | CRDT-based real-time synchronization | YJS, y-indexeddb, lib0 |
| **offline-support** | Offline queue, conflict resolution, background sync | IndexedDB, Service Workers |
| **api-clients** | NYC Open Data API clients (311, Buildings, DOB, HPD) | Axios, Rate Limiting |
| **managers** | State management with stores and contexts | Zustand, React Context |
| **command-chains** | Command pattern for undo/redo and complex workflows | TypeScript, Memento Pattern |
| **context-engines** | Context awareness and intelligent decision-making | Geospatial, Time-based logic |
| **data-seed** | Database seeding with 19 buildings, 7 workers, 134 routines | JSON, Validation |
| **testing** | E2E testing with Detox, fixtures, and test utilities | Detox, Jest, Testing Library |

---

## 🎨 Design System - CyntientOps Dark Glassmorphism

### **Color Palette**
```
🌙 Dark Base: #0F0F23 (Deep Navy)
🔮 Glass Primary: rgba(59, 130, 246, 0.15) (Blue Glass)
✨ Glass Secondary: rgba(139, 92, 246, 0.12) (Purple Glass)
💎 Glass Accent: rgba(16, 185, 129, 0.18) (Green Glass)
🌟 Text Primary: #FFFFFF (Pure White)
🌫️ Text Secondary: rgba(255, 255, 255, 0.7) (70% White)
🔍 Text Tertiary: rgba(255, 255, 255, 0.5) (50% White)
```

### **Glass Effects**
- **Backdrop Blur**: 20px blur intensity
- **Border Radius**: 16px for cards, 12px for buttons
- **Border**: 1px solid rgba(255, 255, 255, 0.1)
- **Shadow**: 0 8px 32px rgba(0, 0, 0, 0.3)
- **Gradient Overlays**: Subtle gradients for depth

---

## 🚀 Getting Started

**⚠️ Internal Development Only - Repository access required**

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Xcode**: >= 15.0 (for iOS development)
- **Android Studio**: >= 2023.1.1 (for Android development)
- **Expo CLI**: Installed globally (`npm install -g expo-cli`)
- **Repository Access**: Authorized team member with private repository access

### Installation

```bash
# Clone the repository (requires authorized access)
git clone https://github.com/thekingleo527/CyntientOps-cursor.git
cd CyntientOps-MP

# Install all dependencies
npm install

# Validate data seed integrity
npm run validate:data
```

### Running the Application

#### Mobile (iOS/Android)
```bash
# Start the Expo development server
npm run dev:mobile

# In the Expo CLI, press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code with Expo Go app for physical device
```

#### Web Dashboard
```bash
# Start the Next.js web dashboard
npm run dev:web

# Open http://localhost:3000 in your browser
```

### Building Packages

```bash
# Build all packages in dependency order
npm run build:all

# Build specific packages
npm run build:design-tokens
npm run build:ui-components
npm run build:database
npm run build:managers
npm run build:intelligence
```

---

## 📊 Data Infrastructure

### Buildings Portfolio
- **18 Total Buildings**: Distributed across NYC boroughs including Rubin Museum (CyntientOps HQ)
- **19 Client Buildings**: All active with complete management data
- **Complete Metadata**: Addresses, BINs, contact information, compliance scores

### Worker Assignments
- **7 Active Workers**: Kevin Dutan, Greg Hutson, Edwin Lema, Mercedes Inamagua, Luis Lopez, Angel Guirachocha, Shawn Magloire (Admin)
- **134 Routine Tasks**: Scheduled across all buildings with time-based triggers
- **Dynamic Task Generation**: Real-time task creation based on schedules and conditions

### Data Seed Source
All data is centralized in `packages/data-seed/` with validation:
- `buildings.json` - 19 buildings with full metadata
- `workers.json` - 7 workers with assignments
- `routines.json` - 134 scheduled maintenance routines
- `clients.json` - 7 client accounts with building portfolios

**Single Source of Truth**: All dashboards and services pull from data-seed, ensuring consistency.

---

## 🧠 Intelligence Services

### Machine Learning Capabilities
- **Predictive Maintenance**: Predicts maintenance needs using historical data, seasonal factors, building age, and compliance scores
- **K-Means Clustering**: Groups buildings by characteristics for optimized routing
- **NLP Task Parser**: Extracts structured task data from natural language input
- **Route Optimization**: AI-powered multi-stop routing
- **Anomaly Detection**: Identifies unusual patterns in maintenance history

### ML Models
- **MLEngine**: Core TensorFlow.js wrapper with model persistence
- **PredictiveMaintenanceService**: Failure prediction with confidence scoring
- **RouteOptimizationService**: Multi-stop route planning with constraints
- **TaskPrioritizationService**: Intelligent task ordering based on urgency, deadline, and worker capacity

---

## 🗺️ NYC API Integrations

### Connected APIs (via `api-clients` package)
- **NYC 311**: Service request tracking and historical data
- **NYC Buildings API**: Building information, permits, violations
- **DOB (Department of Buildings)**: Permits, inspections, violations
- **HPD (Housing Preservation)**: Complaints, registrations, violations
- **NOAA Weather**: Real-time weather data and forecasts

### API Features
- **Rate Limiting**: Automatic throttling to respect API limits
- **Caching**: Intelligent caching with TTL for reduced API calls
- **Error Handling**: Retry logic with exponential backoff
- **Offline Queue**: Store requests when offline, sync when online

---

## 📱 Platform Support

### iOS (>= 13.4)
- ✅ Full native module support
- ✅ Face ID / Touch ID biometric authentication
- ✅ Background location and task execution
- ✅ Push notifications with rich media
- ✅ MapKit integration for native maps
- ✅ Camera and photo library access
- ✅ Offline-first with IndexedDB persistence

### Android (>= API 23)
- ✅ Full native module support
- ✅ Fingerprint / Face Unlock biometric authentication
- ✅ Background services and geofencing
- ✅ Push notifications with actions
- ✅ Google Maps integration
- ✅ Camera and media storage access
- ✅ Offline-first with IndexedDB persistence

### Web (Progressive Web App)
- ✅ Responsive web dashboard (Next.js)
- ✅ Service Worker for offline support
- ✅ IndexedDB for local storage
- ✅ Web Push notifications
- ✅ Mapbox GL JS for interactive maps
- ⚠️ Limited camera access (WebRTC only)

---

## 🔧 Technology Stack

### Core Technologies
- **React Native**: 0.76+ (New Architecture enabled)
- **Expo**: SDK 52+ with Expo Router
- **TypeScript**: 5.9+ with strict mode
- **Nx**: 18+ for monorepo management

### UI & Design
- **React Navigation**: 6+ with Expo Router
- **Styled Components**: CSS-in-JS styling
- **React Native Reanimated**: High-performance animations
- **Expo GL**: WebGL-based custom rendering

### Data & State
- **Zustand**: Lightweight state management
- **React Context**: Component-level state
- **SQLite**: Local database with react-native-sqlite-storage
- **YJS**: CRDT-based synchronization

### ML & AI
- **Brain.js**: Neural network library
- **ml-matrix**: Matrix operations for ML
- **ml-kmeans**: K-means clustering
- **Natural**: Natural language processing
- **Compromise**: NLP text understanding

### Networking & APIs
- **Axios**: HTTP client with interceptors
- **React Query**: Server state management
- **WebSocket**: Real-time communication
- **Firebase**: Backend services (optional)
- **Supabase**: PostgreSQL backend (optional)

### DevOps & Testing
- **Jest**: Unit testing
- **Detox**: E2E testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

---

## 📋 Available Scripts

### Development
- `npm run dev:mobile` - Start Expo mobile development server
- `npm run dev:web` - Start Next.js web dashboard
- `npm run validate:data` - Validate data seed integrity

### Building
- `npm run build:all` - Build all packages
- `npm run build:design-tokens` - Build design tokens
- `npm run build:ui-components` - Build UI components
- `npm run build:database` - Build database layer
- `npm run build:managers` - Build state managers
- `npm run build:intelligence` - Build intelligence services
- `npm run build:context` - Build context engines
- `npm run build:commands` - Build command chains
- `npm run build:offline` - Build offline support
- `npm run build:realtime` - Build realtime sync
- `npm run build:testing` - Build testing utilities

### Testing
- `npm run test:all` - Run all tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint:all` - Lint all packages

### Maintenance
- `npm run clean` - Clean Nx cache and node_modules
- `npm run install:all` - Install all workspace dependencies

---

## 🔐 Authentication

The application supports three user roles with demo credentials:

### Quick Access Glass Cards (6 Workers)
1. **Kevin Dutan** (Worker) - `kevin.dutan@francomanagement.com` / `password`
2. **Greg Hutson** (Worker) - `greg.hutson@francomanagement.com` / `password`
3. **Edwin Lema** (Worker) - `edwin.lema@francomanagement.com` / `password`
4. **Mercedes Inamagua** (Worker) - `mercedes.inamagua@francomanagement.com` / `password`
5. **Luis Lopez** (Worker) - `luis.lopez@francomanagement.com` / `password`
6. **Shawn Magloire** (Admin) - `shawn.magloire@francomanagement.com` / `password`

### All Users (14 Total)
- **7 Workers**: Greg Hutson, Edwin Lema, Kevin Dutan, Mercedes Inamagua, Luis Lopez, Angel Guirachocha, Shawn Magloire (Admin)
- **7 Clients/Property Managers**: david@jmrealty.org, mfarhat@farhatrealtymanagement.com, facilities@solarone.org, management@grandelizabeth.com, property@citadelrealty.com, admin@corbelproperty.com, management@chelsea115.com

**Note**: All users use `password` for demo purposes. Configure real authentication in production.

---

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
npm run test:all

# Run tests for a specific package
nx test design-tokens
nx test ui-components
nx test intelligence-services
```

### E2E Tests
```bash
# Run E2E tests (requires iOS simulator or Android emulator)
npm run test:e2e
```

### Data Validation
```bash
# Validate data seed integrity
npm run validate:data
```

---

## 🚢 Deployment

### EAS Build (Expo Application Services)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store / Play Store
eas submit --platform ios
eas submit --platform android
```

### Web Deployment (Next.js)
```bash
# Build web dashboard
cd apps/web-dashboard
npm run build

# Deploy to Vercel (recommended)
vercel deploy

# Or deploy to custom server
npm run start
```

---

## 🤝 Contributing

**This is a private repository. External contributions are not accepted.**

### Internal Development Guidelines

For authorized team members and AI assistants:

1. **Follow TypeScript strict mode** conventions
2. **Write tests** for new features
3. **Update documentation** (CONTINUITY_REPORT_CONSOLIDATED.md and package READMEs)
4. **Run linting and tests** before committing
5. **Use conventional commit messages** for clear history

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules (`.eslintrc.js`)
- Use Prettier for formatting
- Write meaningful commit messages (Conventional Commits)
- Maintain code quality and documentation standards

---

## 📄 License

**All Rights Reserved - Private Development**

This software and all associated intellectual property is proprietary and confidential. No license is granted for use, modification, or distribution. All rights are reserved by CyntientOps.

**Unauthorized use, copying, or distribution is strictly prohibited.**

---

## 👥 Team

**CyntientOps Team** - Enterprise field operations management

- **Project Lead**: [Your Name]
- **Architecture**: [Your Name]
- **ML/AI**: [Your Name]
- **Mobile Development**: [Your Name]

---

## 🙏 Acknowledgments

- **NYC Open Data**: For providing comprehensive building and 311 data APIs
- **Expo Team**: For the excellent React Native framework and tooling
- **Nx Team**: For powerful monorepo management
- **React Native Community**: For continuous innovation and support

---

## 📞 Support

**This is a private repository. Support is not available to external users.**

For authorized team members:
- **Internal Documentation**: See `docs/` directory
- **Development Issues**: Contact project lead directly
- **Technical Questions**: Use internal communication channels

---

## 📚 Documentation

### Primary Documentation
- **[CONTINUITY_REPORT_CONSOLIDATED.md](./CONTINUITY_REPORT_CONSOLIDATED.md)** (Comprehensive): Complete project status, architecture details, and data infrastructure
- **[Package READMEs](./packages/)**: Individual package documentation in each package directory
- **[Wire Diagrams](./docs/)**: Complete dashboard wireframes and design specifications

### Development Guides
- **[Contributing Guidelines](./CONTRIBUTING.md)**: How to contribute to the project (coming soon)
- **[Architecture Decision Records](./docs/adr/)**: Key architectural decisions (coming soon)
- **[Deployment Guide](./docs/deployment/)**: Production deployment instructions (coming soon)

---

**Built with ❤️ by the CyntientOps Team**
*Empowering building maintenance teams with AI-driven field operations management*
