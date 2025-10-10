#!/bin/bash
set -e

echo "🔧 Fixing CyntientOps Dependencies..."
echo ""

# Step 1: Update app package.json with correct versions for Expo 54
echo "1️⃣  Updating dependencies to Expo 54 compatible versions..."
cd apps/mobile-rn

# Update expo-image-manipulator to version 14 (for Expo 54)
npx expo install expo-image-manipulator@~14.0.9

# Install expo-image which is required
npx expo install expo-image

# Step 2: Clean everything
echo ""
echo "2️⃣  Cleaning build artifacts..."
cd /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn
rm -rf ios/Pods ios/Podfile.lock ios/build
rm -rf ~/Library/Caches/CocoaPods

# Step 3: Run expo doctor
echo ""
echo "3️⃣  Running expo doctor..."
npx expo-doctor

echo ""
echo "✅ Dependencies fixed! Now run: npx expo run:ios"
