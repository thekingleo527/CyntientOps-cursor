#!/bin/bash

# CyntientOps iOS Build Script
# Builds and installs the development client on iOS simulator

set -e

PROJECT_ROOT="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP"
APP_DIR="$PROJECT_ROOT/apps/mobile-rn"

echo "🔨 Building CyntientOps Development Client for iOS"
echo ""

# Check if Metro is running
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✓ Metro bundler is running on port 8081"
else
    echo "⚠️  Metro bundler is NOT running!"
    echo "   Run ./start-ios.sh in another terminal first"
    exit 1
fi
echo ""

# Check simulator
echo "📱 Checking iOS Simulator..."
if xcrun simctl list devices | grep -q "Booted"; then
    BOOTED=$(xcrun simctl list devices | grep "Booted" | head -1)
    echo "✓ Simulator is booted: $BOOTED"
else
    echo "⚠️  No simulator is booted. Starting iPhone 16 Pro..."
    xcrun simctl boot "iPhone 16 Pro" 2>/dev/null || true
    sleep 3
fi
echo ""

# Navigate to app directory
cd "$APP_DIR"

# Build and install
echo "🔧 Building native iOS app (this may take 3-5 minutes on first build)..."
echo ""

npx expo run:ios

echo ""
echo "✅ Build complete! The app should now be running on the simulator."
