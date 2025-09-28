#!/bin/bash

echo "📁 Verifying image folder structure..."
echo ""

BASE_PATH="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images"

echo "📂 Main images directory:"
ls -la "$BASE_PATH"
echo ""

echo "🏢 Buildings directory:"
if [ -d "$BASE_PATH/buildings" ]; then
    ls -la "$BASE_PATH/buildings"
else
    echo "❌ Buildings directory not found"
fi
echo ""

echo "🎨 Icons directory:"
if [ -d "$BASE_PATH/icons" ]; then
    ls -la "$BASE_PATH/icons"
else
    echo "❌ Icons directory not found"
fi
echo ""

echo "👷 Workers directory:"
if [ -d "$BASE_PATH/workers" ]; then
    ls -la "$BASE_PATH/workers"
else
    echo "❌ Workers directory not found"
fi
echo ""

echo "🖼️ Backgrounds directory:"
if [ -d "$BASE_PATH/backgrounds" ]; then
    ls -la "$BASE_PATH/backgrounds"
else
    echo "❌ Backgrounds directory not found"
fi
echo ""

echo "✅ Folder structure verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy building images from SwiftUI Resources to: $BASE_PATH/buildings/"
echo "2. Copy AI Assistant icon to: $BASE_PATH/icons/"
echo "3. See MANUAL_IMAGE_COPY_GUIDE.md for detailed instructions"
