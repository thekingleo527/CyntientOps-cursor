#!/bin/bash
# CyntientOps Comprehensive Dependency & Build Fix
# This script systematically fixes all compatibility issues

set -e

PROJECT_ROOT="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP"
APP_DIR="$PROJECT_ROOT/apps/mobile-rn"

echo "🔧 CyntientOps Comprehensive Fix"
echo "================================"
echo ""

# ============================================
# STEP 1: Kill all stuck processes
# ============================================
echo "1️⃣  Killing all stuck processes..."
pkill -9 -f "expo" 2>/dev/null || true
pkill -9 -f "metro" 2>/dev/null || true
pkill -9 -f "yarn" 2>/dev/null || true
pkill -9 -f "npm" 2>/dev/null || true
pkill -9 -f "node.*jest-worker" 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:19000 | xargs kill -9 2>/dev/null || true
lsof -ti:19001 | xargs kill -9 2>/dev/null || true
echo "   ✓ All stuck processes killed"
sleep 2
echo ""

# ============================================
# STEP 2: Backup current package.json
# ============================================
echo "2️⃣  Backing up package.json..."
cp "$APP_DIR/package.json" "$APP_DIR/package.json.backup"
echo "   ✓ Backup created at apps/mobile-rn/package.json.backup"
echo ""

# ============================================
# STEP 3: Nuclear clean - remove ALL caches
# ============================================
echo "3️⃣  Nuclear clean - removing all caches and build artifacts..."

# iOS build artifacts
rm -rf "$APP_DIR/ios/Pods"
rm -rf "$APP_DIR/ios/Podfile.lock"
rm -rf "$APP_DIR/ios/build"
rm -rf "$APP_DIR/ios/.xcodebuild.log"
rm -rf "$APP_DIR/ios/DerivedData"

# Node modules
rm -rf "$APP_DIR/node_modules"
rm -rf "$PROJECT_ROOT/node_modules"
rm -rf "$PROJECT_ROOT/packages/*/node_modules"

# Metro cache
rm -rf "$TMPDIR/metro-cache" 2>/dev/null || true
rm -rf "$TMPDIR/haste-map"* 2>/dev/null || true
rm -rf "$TMPDIR/react-"* 2>/dev/null || true
rm -rf "/Volumes/FastSSD/Developer/_devdata/metro-cache"/*

# Expo caches
rm -rf ~/.expo/*
rm -rf ~/.cache/expo/*
rm -rf "$APP_DIR/.expo"

# CocoaPods caches
rm -rf ~/Library/Caches/CocoaPods
pod cache clean --all 2>/dev/null || true

# Yarn caches  
rm -rf ~/.yarn/cache
rm -rf "$PROJECT_ROOT/.yarn"
rm -rf "$PROJECT_ROOT/yarn.lock"

# Watchman
watchman watch-del-all 2>/dev/null || true

echo "   ✓ All caches and artifacts removed"
echo ""

# ============================================
# STEP 4: Fix package.json - remove problematic packages
# ============================================
echo "4️⃣  Fixing package.json - removing incompatible packages..."
cd "$APP_DIR"

# Create a clean package.json with only essential Expo 54 compatible packages
cat > package.json << 'PKG_EOF'
{
  "name": "mobile-rn",
  "main": "index.js",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android"
  },
  "dependencies": {
    "@cyntientops/api-clients": "1.0.0",
    "@cyntientops/business-core": "1.0.0",
    "@cyntientops/compliance-engine": "1.0.0",
    "@cyntientops/context-engines": "1.0.0",
    "@cyntientops/ui-components": "1.0.0",
    "@react-navigation/bottom-tabs": "^7.4.8",
    "@react-navigation/native": "^7.1.18",
    "@react-navigation/native-stack": "^7.3.27",
    "crypto-js": "^4.2.0",
    "expo": "~54.0.0",
    "expo-dev-client": "~6.0.0",
    "expo-status-bar": "~3.0.0",
    "react": "19.1.0",
    "react-native": "0.81.4",
    "react-native-gesture-handler": "^2.28.0",
    "react-native-reanimated": "^4.1.2",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
PKG_EOF

echo "   ✓ Created minimal clean package.json"
echo ""

# ============================================
# STEP 5: Reinstall dependencies from scratch
# ============================================
echo "5️⃣  Installing core dependencies..."
cd "$PROJECT_ROOT"

# Install root dependencies
yarn install --force

cd "$APP_DIR"

# Let Expo manage its own packages
echo "   → Installing Expo SDK 54 packages..."
npx expo install expo-asset
npx expo install expo-blur  
npx expo install expo-crypto
npx expo install expo-file-system
npx expo install expo-haptics
npx expo install expo-linear-gradient
npx expo install expo-secure-store
npx expo install expo-speech
npx expo install expo-sqlite
npx expo install react-native-crypto
npx expo install react-native-randombytes

echo "   ✓ All dependencies installed"
echo ""

# ============================================
# STEP 6: Run Expo Doctor
# ============================================
echo "6️⃣  Running Expo Doctor to verify setup..."
npx expo-doctor || echo "   ⚠️  Some warnings detected (may be non-critical)"
echo ""

# ============================================
# STEP 7: Install iOS Pods
# ============================================
echo "7️⃣  Installing iOS CocoaPods..."
cd "$APP_DIR/ios"

# Update pod repos first
echo "   → Updating CocoaPods repos..."
pod repo update

# Install pods
echo "   → Installing pods..."
pod install --repo-update

echo "   ✓ CocoaPods installed successfully"
echo ""

# ============================================
# STEP 8: Create Metro cache directory
# ============================================
echo "8️⃣  Setting up Metro cache..."
mkdir -p "/Volumes/FastSSD/Developer/_devdata/metro-cache"
echo "   ✓ Metro cache directory ready"
echo ""

# ============================================
# FINAL SUMMARY
# ============================================
echo "================================"
echo "✅ COMPREHENSIVE FIX COMPLETE!"
echo "================================"
echo ""
echo "Summary of changes:"
echo "  • All stuck processes killed"
echo "  • All caches cleared (iOS, Metro, Expo, CocoaPods, Yarn)"
echo "  • package.json cleaned and rebuilt"
echo "  • Dependencies reinstalled with Expo 54 compatibility"
echo "  • CocoaPods updated and installed"
echo ""
echo "Next steps:"
echo "  1. Start Metro: ./start-ios.sh"
echo "  2. In a new terminal, build: cd apps/mobile-rn && npx expo run:ios"
echo ""
echo "Your original package.json was backed up to:"
echo "  apps/mobile-rn/package.json.backup"
echo ""

