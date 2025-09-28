#!/bin/bash

# Copy building images from SwiftUI Resources to React Native assets
SOURCE_DIR="/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets"
DEST_DIR="/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Copy building images
echo "Copying building images..."

# Copy each building image
cp "$SOURCE_DIR/104_Franklin_Street.imageset/104_Franklin_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "104_Franklin_Street.jpg not found"
cp "$SOURCE_DIR/112_West_18th_Street.imageset/112_West_18th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "112_West_18th_Street.jpg not found"
cp "$SOURCE_DIR/117_West_17th_Street.imageset/117_West_17th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "117_West_17th_Street.jpg not found"
cp "$SOURCE_DIR/12_West_18th_Street.imageset/12_West_18th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "12_West_18th_Street.jpg not found"
cp "$SOURCE_DIR/123_1st_Avenue.imageset/123_1st_Avenue.jpg" "$DEST_DIR/" 2>/dev/null || echo "123_1st_Avenue.jpg not found"
cp "$SOURCE_DIR/131_Perry_Street.imageset/131_Perry_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "131_Perry_Street.jpg not found"
cp "$SOURCE_DIR/133_East_15th_Street.imageset/133_East_15th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "133_East_15th_Street.jpg not found"
cp "$SOURCE_DIR/135West17thStreet.imageset/135-139_West_17th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "135-139_West_17th_Street.jpg not found"
cp "$SOURCE_DIR/136_West_17th_Street.imageset/136_West_17th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "136_West_17th_Street.jpg not found"
cp "$SOURCE_DIR/138West17thStreet.imageset/138West17thStreet.jpg" "$DEST_DIR/" 2>/dev/null || echo "138West17thStreet.jpg not found"
cp "$SOURCE_DIR/36_Walker_Street.imageset/36_Walker_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "36_Walker_Street.jpg not found"
cp "$SOURCE_DIR/41_Elizabeth_Street.imageset/41_Elizabeth_Street.jpeg" "$DEST_DIR/" 2>/dev/null || echo "41_Elizabeth_Street.jpeg not found"
cp "$SOURCE_DIR/68_Perry_Street.imageset/68_Perry_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "68_Perry_Street.jpg not found"
cp "$SOURCE_DIR/Rubin_Museum_142_148_West_17th_Street.imageset/Rubin_Museum_142-148_West_17th_Street.jpg" "$DEST_DIR/" 2>/dev/null || echo "Rubin_Museum_142-148_West_17th_Street.jpg not found"
cp "$SOURCE_DIR/Stuyvesant_Cove_Park.imageset/Stuyvesant_Cove_Park.jpg" "$DEST_DIR/" 2>/dev/null || echo "Stuyvesant_Cove_Park.jpg not found"

# Copy AI Assistant icon
mkdir -p "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons"
cp "$SOURCE_DIR/AIAssistant.imageset/AIAssistant.png" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons/" 2>/dev/null || echo "AIAssistant.png not found"

echo "Image copying completed!"
echo "Files in destination directory:"
ls -la "$DEST_DIR"
