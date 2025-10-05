# 🚀 FastSSD Development Environment Setup

**Date:** January 15, 2025  
**Purpose:** Configure CyntientOps-MP development environment for FastSSD drive  

---

## 📁 **FastSSD Directory Structure**

```
/Volumes/FastSSD/Developer/
├── Projects/
│   └── CyntientOps-MP/          # Main project directory
│       ├── apps/mobile-rn/      # React Native mobile app
│       ├── packages/            # Shared packages
│       └── docs/                # Documentation
└── _devdata/                    # Development cache directories
    ├── metro-cache/             # Metro bundler cache
    ├── expo-cache/              # Expo cache
    ├── node-modules-cache/      # Node modules cache
    └── tmp/                     # Temporary files
```

---

## 🔧 **Environment Configuration**

### **FastSSD Environment Variables**
```bash
# Project paths
PROJECT_ROOT=/Volumes/FastSSD/Developer/Projects/CyntientOps-MP
MOBILE_APP_ROOT=/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn

# Metro bundler configuration
METRO_CACHE_ROOT=/Volumes/FastSSD/Developer/_devdata/metro-cache
RCT_METRO_PORT=8081
EXPO_DEV_SERVER_PORT=19000

# Cache and temporary directories
TMPDIR=/Volumes/FastSSD/Developer/_devdata/tmp
EXPO_CACHE_DIR=/Volumes/FastSSD/Developer/_devdata/expo-cache
NODE_MODULES_CACHE=/Volumes/FastSSD/Developer/_devdata/node-modules-cache

# Development flags
EXPO_DEBUG=true
EXPO_DEVELOPMENT_CLIENT=true
EXPO_USE_FAST_REFRESH=true

# Network configuration
EXPO_DEV_SERVER_HOSTNAME=192.168.6.246
EXPO_DEV_SERVER_PORT=8081
```

---

## 🚀 **Quick Start Commands**

### **1. Start Development Server (FastSSD)**
```bash
cd /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn
./start-fastssd.sh
```

### **2. Start iOS Simulator (Recommended)**
```bash
cd /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn
./start-ios-simulator.sh
```

### **3. Use Existing Scripts**
```bash
# From project root
yarn mobile:start:fast:clear

# Or with environment variables
EXPO_DEV_SERVER_PORT=19000 RCT_METRO_PORT=8081 METRO_CACHE_ROOT="/Volumes/FastSSD/Developer/_devdata/metro-cache" npx expo start --dev-client --clear
```

---

## 📱 **Platform-Specific Setup**

### **iOS Simulator (Recommended)**
- ✅ **No additional setup required**
- ✅ **Uses Xcode simulator**
- ✅ **Works with FastSSD configuration**
- ✅ **Press 'i' in Expo CLI to open**

### **Android Emulator (Optional)**
- ⚠️ **Requires Android Studio setup**
- ⚠️ **May need ANDROID_HOME configuration**
- ⚠️ **Consider using iOS simulator instead**

### **Web Browser (Alternative)**
- ✅ **No additional setup required**
- ✅ **Press 'w' in Expo CLI to open**
- ✅ **Works with FastSSD configuration**

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Metro Cache Issues**
```bash
# Clear Metro cache
rm -rf /Volumes/FastSSD/Developer/_devdata/metro-cache
mkdir -p /Volumes/FastSSD/Developer/_devdata/metro-cache
```

#### **2. Expo Cache Issues**
```bash
# Clear Expo cache
rm -rf /Volumes/FastSSD/Developer/_devdata/expo-cache
mkdir -p /Volumes/FastSSD/Developer/_devdata/expo-cache
```

#### **3. Node Modules Issues**
```bash
# Clear node_modules and reinstall
cd /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn
rm -rf node_modules
yarn install
```

#### **4. Android SDK Issues**
```bash
# If you get Android SDK errors, use iOS simulator instead
# Press 'i' in Expo CLI instead of 'a'
```

---

## 📊 **Performance Benefits**

### **FastSSD Advantages**
- **2TB Storage:** Plenty of space for development
- **Fast I/O:** SSD performance for faster builds
- **Dedicated Cache:** Separate cache directories
- **Portable:** Can move between machines

### **Cache Optimization**
- **Metro Cache:** `/Volumes/FastSSD/Developer/_devdata/metro-cache`
- **Expo Cache:** `/Volumes/FastSSD/Developer/_devdata/expo-cache`
- **Node Modules:** Cached on FastSSD
- **Temp Files:** Isolated temp directory

---

## 🎯 **Development Workflow**

### **1. Start Development**
```bash
cd /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn
./start-ios-simulator.sh
```

### **2. Open Simulator**
- Press `i` for iOS simulator
- Press `w` for web browser
- Press `r` to reload app

### **3. Development Commands**
- `r` - Reload app
- `m` - Toggle menu
- `j` - Open debugger
- `o` - Open in editor

---

## 🔐 **Environment Security**

### **FastSSD Permissions**
```bash
# Ensure proper permissions
chmod -R 755 /Volumes/FastSSD/Developer/_devdata/
chown -R $(whoami) /Volumes/FastSSD/Developer/_devdata/
```

### **Cache Cleanup**
```bash
# Regular cleanup script
rm -rf /Volumes/FastSSD/Developer/_devdata/tmp/*
```

---

## 📈 **Performance Monitoring**

### **Cache Usage**
```bash
# Check cache sizes
du -sh /Volumes/FastSSD/Developer/_devdata/*
```

### **Disk Usage**
```bash
# Check FastSSD usage
df -h /Volumes/FastSSD/
```

---

## 🎉 **Success Indicators**

### **✅ Environment Ready When:**
- FastSSD directories created
- Environment variables set
- Expo server starts without errors
- iOS simulator opens successfully
- Metro bundler uses FastSSD cache

### **🚀 Development Ready When:**
- App loads in simulator
- Hot reload works
- No path resolution errors
- Cache directories populated

---

**Status:** ✅ **FASTSSD CONFIGURED**  
**Next Step:** **Start Development Server**

🤖 **Generated for FastSSD Development Environment**
