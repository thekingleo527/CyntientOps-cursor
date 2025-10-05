#!/bin/bash
# FastSSD Development Startup Script for CyntientOps-MP

echo "🚀 Starting CyntientOps-MP on FastSSD..."

# Set FastSSD environment variables
export PROJECT_ROOT="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP"
export MOBILE_APP_ROOT="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn"
export METRO_CACHE_ROOT="/Volumes/FastSSD/Developer/_devdata/metro-cache"
export EXPO_CACHE_DIR="/Volumes/FastSSD/Developer/_devdata/expo-cache"
export TMPDIR="/Volumes/FastSSD/Developer/_devdata/tmp"
export RCT_METRO_PORT=8081
export EXPO_DEV_SERVER_PORT=19000
export EXPO_DEV_SERVER_HOSTNAME="192.168.6.246"

# Create cache directories if they don't exist
mkdir -p "$METRO_CACHE_ROOT"
mkdir -p "$EXPO_CACHE_DIR"
mkdir -p "$TMPDIR"

echo "✅ FastSSD environment configured"
echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 Metro Cache: $METRO_CACHE_ROOT"
echo "📁 Expo Cache: $EXPO_CACHE_DIR"
echo "📁 Temp Dir: $TMPDIR"

# Change to mobile app directory
cd "$MOBILE_APP_ROOT"

echo "🔧 Starting Expo development server with FastSSD configuration..."

# Start Expo with FastSSD configuration
npx expo start --dev-client --clear
