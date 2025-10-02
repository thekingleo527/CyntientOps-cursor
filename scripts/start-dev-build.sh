#!/bin/bash
# Development Build Startup Script (Fixes TurboModule Issues)

echo "🔧 Starting CyntientOps with Development Build..."
echo "================================================"

# Create optimized cache directory
OPTIMIZED_CACHE_DIR="/Volumes/FastSSD/Developer/_devdata/metro-cache"
mkdir -p "$OPTIMIZED_CACHE_DIR"
echo "📁 Creating optimized cache directory..."

# Clear problematic caches
if [ "$1" = "--clear-cache" ]; then
    echo "🧹 Clearing problematic caches..."
    rm -rf "$OPTIMIZED_CACHE_DIR"
    rm -rf "$TMPDIR/metro-cache"
    rm -rf "$TMPDIR/react-*"
    rm -rf apps/mobile-rn/.expo
    rm -rf apps/mobile-rn/node_modules/.cache
fi

cd apps/mobile-rn

echo "⚡ Starting Metro with Development Build Configuration..."
export NODE_ENV=development
export EXPO_FAST_REFRESH=true
export EXPO_FAST_REFRESH_OVERLAY=false
export EXPO_FAST_REFRESH_LOGGING=false
export EXPO_OPTIMIZE_BUNDLE=false  # Disable for dev build
export EXPO_SKIP_BUNDLE_ANALYSIS=true
export METRO_MAX_WORKERS=4
export METRO_CACHE_ENABLED=true
export METRO_CACHE_DIR="$OPTIMIZED_CACHE_DIR"
export RCT_METRO_PORT=8081

# Development build specific settings
export EXPO_USE_DEV_SERVER=true
export EXPO_USE_FAST_RESOLVER=true

echo "📊 Max Workers: $METRO_MAX_WORKERS"
echo "💾 Cache Directory: $METRO_CACHE_DIR"
echo "🔧 Port: $RCT_METRO_PORT"
echo "🏗️  Development Build Mode: Enabled"

echo ""
echo "🔧 Using development build Metro configuration..."
echo "💡 This fixes TurboModule PlatformConstants errors"

# Start with development build (not Expo Go)
METRO_CONFIG=metro.config.js npx expo start --dev-client --clear --dev --no-minify
