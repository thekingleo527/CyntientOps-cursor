# Building Images Index

This document lists all building images that need to be copied from the SwiftUI Resources folder to the React Native assets folder.

## Source Location
`/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/`

## Destination Location
`/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/`

## Building Images to Copy

### Active Buildings (19 total)

1. **12 West 18th Street** (ID: 1)
   - Source: `12_West_18th_Street.imageset/12_West_18th_Street.jpg`
   - Destination: `12_West_18th_Street.jpg`

2. **135-139 West 17th Street** (ID: 3)
   - Source: `135West17thStreet.imageset/135-139_West_17th_Street.jpg`
   - Destination: `135-139_West_17th_Street.jpg`

3. **104 Franklin Street** (ID: 4)
   - Source: `104_Franklin_Street.imageset/104_Franklin_Street.jpg`
   - Destination: `104_Franklin_Street.jpg`

4. **138 West 17th Street** (ID: 5)
   - Source: `138West17thStreet.imageset/138West17thStreet.jpg`
   - Destination: `138West17thStreet.jpg`

5. **68 Perry Street** (ID: 6)
   - Source: `68_Perry_Street.imageset/68_Perry_Street.jpg`
   - Destination: `68_Perry_Street.jpg`

6. **112 West 18th Street** (ID: 7)
   - Source: `112_West_18th_Street.imageset/112_West_18th_Street.jpg`
   - Destination: `112_West_18th_Street.jpg`

7. **41 Elizabeth Street** (ID: 8)
   - Source: `41_Elizabeth_Street.imageset/41_Elizabeth_Street.jpeg`
   - Destination: `41_Elizabeth_Street.jpeg`

8. **117 West 17th Street** (ID: 9)
   - Source: `117_West_17th_Street.imageset/117_West_17th_Street.jpg`
   - Destination: `117_West_17th_Street.jpg`

9. **131 Perry Street** (ID: 10)
   - Source: `131_Perry_Street.imageset/131_Perry_Street.jpg`
   - Destination: `131_Perry_Street.jpg`

10. **123 1st Avenue** (ID: 11)
    - Source: `123_1st_Avenue.imageset/123_1st_Avenue.jpg`
    - Destination: `123_1st_Avenue.jpg`

11. **136 West 17th Street** (ID: 13)
    - Source: `136_West_17th_Street.imageset/136_West_17th_Street.jpg`
    - Destination: `136_West_17th_Street.jpg`

12. **Rubin Museum (142–148 W 17th) - CyntientOps HQ** (ID: 14)
    - Source: `Rubin_Museum_142_148_West_17th_Street.imageset/Rubin_Museum_142-148_West_17th_Street.jpg`
    - Destination: `Rubin_Museum_142-148_West_17th_Street.jpg`

13. **133 East 15th Street** (ID: 15)
    - Source: `133_East_15th_Street.imageset/133_East_15th_Street.jpg`
    - Destination: `133_East_15th_Street.jpg`

14. **Stuyvesant Cove Park** (ID: 16)
    - Source: `Stuyvesant_Cove_Park.imageset/Stuyvesant_Cove_Park.jpg`
    - Destination: `Stuyvesant_Cove_Park.jpg`

15. **178 Spring Street** (ID: 17)
    - Source: `178_Spring_Street.imageset/` (needs to be created)
    - Destination: `178_Spring_Street.jpg`

16. **36 Walker Street** (ID: 18)
    - Source: `36_Walker_Street.imageset/36_Walker_Street.jpg`
    - Destination: `36_Walker_Street.jpg`

17. **115 7th Avenue** (ID: 19)
    - Source: `115_7th_Avenue.imageset/` (needs to be created)
    - Destination: `115_7th_Avenue.jpg`

18. **148 Chambers Street** (ID: 21)
    - Source: `148_Chambers_Street.imageset/` (needs to be created)
    - Destination: `148_Chambers_Street.jpg`

## Icons to Copy

1. **AI Assistant Icon**
   - Source: `AIAssistant.imageset/AIAssistant.png`
   - Destination: `/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons/AIAssistant.png`

## Copy Commands

```bash
# Create destination directories
mkdir -p /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings
mkdir -p /Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons

# Copy building images
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/12_West_18th_Street.imageset/12_West_18th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/135West17thStreet.imageset/135-139_West_17th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/104_Franklin_Street.imageset/104_Franklin_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/138West17thStreet.imageset/138West17thStreet.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/68_Perry_Street.imageset/68_Perry_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/112_West_18th_Street.imageset/112_West_18th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/41_Elizabeth_Street.imageset/41_Elizabeth_Street.jpeg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/117_West_17th_Street.imageset/117_West_17th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/131_Perry_Street.imageset/131_Perry_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/123_1st_Avenue.imageset/123_1st_Avenue.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/136_West_17th_Street.imageset/136_West_17th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/Rubin_Museum_142_148_West_17th_Street.imageset/Rubin_Museum_142-148_West_17th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/133_East_15th_Street.imageset/133_East_15th_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/Stuyvesant_Cove_Park.imageset/Stuyvesant_Cove_Park.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/36_Walker_Street.imageset/36_Walker_Street.jpg" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/"

# Copy AI Assistant icon
cp "/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/AIAssistant.imageset/AIAssistant.png" "/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons/"
```

## Notes

- Some buildings (178 Spring Street, 115 7th Avenue, 148 Chambers Street) may not have images in the SwiftUI Resources folder and will need placeholder images
- The Rubin Museum image is the most important as it serves as both the museum and CyntientOps HQ
- All images should be optimized for mobile display (recommended: 800x600px or similar aspect ratio)
- The building_placeholder.png should be used as a fallback for any missing images

## Status

- ✅ Image mapping system implemented in BuildingDetailScreen.tsx
- ✅ Local require() statements configured for all building images
- ⏳ Physical image files need to be copied from SwiftUI Resources
- ⏳ Placeholder images need to be created for missing buildings
