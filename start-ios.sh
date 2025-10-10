#!/bin/bash

# CyntientOps iOS Simulator Startup Script
# This bypasses Cursor's auto-install to prevent freezing

set -e

PROJECT_ROOT="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP"
APP_DIR="$PROJECT_ROOT/apps/mobile-rn"

echo "🚀 Starting CyntientOps iOS Simulator"
echo ""

# Step 1: Kill any stuck processes
echo "1️⃣  Cleaning up stuck processes..."
pkill -9 -f "expo start" 2>/dev/null || true
pkill -9 -f "yarn mobile" 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
echo "   ✓ Cleanup complete"
echo ""

# Step 2: Verify we're in the right directory
echo "2️⃣  Checking project structure..."
if [ ! -d "$APP_DIR" ]; then
    echo "   ✗ Error: apps/mobile-rn directory not found"
    exit 1
fi
echo "   ✓ Project structure OK"
echo ""

# Step 3: Check if expo is available
echo "3️⃣  Checking Expo CLI..."
if ! command -v npx &> /dev/null; then
    echo "   ✗ Error: npx not found"
    exit 1
fi
echo "   ✓ Expo CLI available (via npx)"
echo ""

# Step 4: Navigate and start
echo "4️⃣  Starting Metro bundler..."
cd "$APP_DIR"

# Set up environment
export METRO_CACHE_ROOT="/Volumes/FastSSD/Developer/_devdata/metro-cache"
export NO_FLIPPER=1

# Start with clear cache
echo ""
echo "📱 Opening http://localhost:8081"
echo "💡 Press 'i' to open iOS simulator"
echo "💡 Press Ctrl+C to stop"
echo ""

npx expo start -c --dev-client
