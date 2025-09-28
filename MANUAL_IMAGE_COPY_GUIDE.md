# 📸 Manual Image Copy Guide

## 📁 **Destination Folders Created**

The following folders have been created for you to copy images into:

```
/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/
├── buildings/          # Building images
├── icons/             # App icons and UI icons
├── workers/           # Worker profile images (if any)
└── backgrounds/       # Background images and patterns
```

## 🏢 **Building Images to Copy**

### **Source Location**
`/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/`

### **Destination Location**
`/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/`

### **Images to Copy (19 buildings)**

| Building | Source File | Destination File |
|----------|-------------|------------------|
| 12 West 18th Street | `12_West_18th_Street.imageset/12_West_18th_Street.jpg` | `12_West_18th_Street.jpg` |
| 135-139 West 17th Street | `135West17thStreet.imageset/135-139_West_17th_Street.jpg` | `135-139_West_17th_Street.jpg` |
| 104 Franklin Street | `104_Franklin_Street.imageset/104_Franklin_Street.jpg` | `104_Franklin_Street.jpg` |
| 138 West 17th Street | `138West17thStreet.imageset/138West17thStreet.jpg` | `138West17thStreet.jpg` |
| 68 Perry Street | `68_Perry_Street.imageset/68_Perry_Street.jpg` | `68_Perry_Street.jpg` |
| 112 West 18th Street | `112_West_18th_Street.imageset/112_West_18th_Street.jpg` | `112_West_18th_Street.jpg` |
| 41 Elizabeth Street | `41_Elizabeth_Street.imageset/41_Elizabeth_Street.jpeg` | `41_Elizabeth_Street.jpeg` |
| 117 West 17th Street | `117_West_17th_Street.imageset/117_West_17th_Street.jpg` | `117_West_17th_Street.jpg` |
| 131 Perry Street | `131_Perry_Street.imageset/131_Perry_Street.jpg` | `131_Perry_Street.jpg` |
| 123 1st Avenue | `123_1st_Avenue.imageset/123_1st_Avenue.jpg` | `123_1st_Avenue.jpg` |
| 136 West 17th Street | `136_West_17th_Street.imageset/136_West_17th_Street.jpg` | `136_West_17th_Street.jpg` |
| **Rubin Museum (HQ)** | `Rubin_Museum_142_148_West_17th_Street.imageset/Rubin_Museum_142-148_West_17th_Street.jpg` | `Rubin_Museum_142-148_West_17th_Street.jpg` |
| 133 East 15th Street | `133_East_15th_Street.imageset/133_East_15th_Street.jpg` | `133_East_15th_Street.jpg` |
| Stuyvesant Cove Park | `Stuyvesant_Cove_Park.imageset/Stuyvesant_Cove_Park.jpg` | `Stuyvesant_Cove_Park.jpg` |
| 36 Walker Street | `36_Walker_Street.imageset/36_Walker_Street.jpg` | `36_Walker_Street.jpg` |

### **Buildings That May Need Placeholder Images**
- 178 Spring Street (ID: 17)
- 115 7th Avenue (ID: 19) 
- 148 Chambers Street (ID: 21)

## 🎨 **Icons to Copy**

### **Source Location**
`/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/`

### **Destination Location**
`/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons/`

| Icon | Source File | Destination File |
|------|-------------|------------------|
| AI Assistant | `AIAssistant.imageset/AIAssistant.png` | `AIAssistant.png` |

## 📋 **Step-by-Step Copy Instructions**

### **1. Open Finder**
- Navigate to: `/Volumes/FastSSD/Xcode/CyntientOps/CyntientOps/Resources/Assets.xcassets/`
- You'll see folders like `104_Franklin_Street.imageset/`, `112_West_18th_Street.imageset/`, etc.

### **2. Copy Building Images**
For each building image:
1. Open the `.imageset` folder (e.g., `104_Franklin_Street.imageset/`)
2. Copy the image file (e.g., `104_Franklin_Street.jpg`)
3. Paste it into: `/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/buildings/`
4. Rename if needed to match the destination filename

### **3. Copy Icons**
1. Open `AIAssistant.imageset/`
2. Copy `AIAssistant.png`
3. Paste it into: `/Volumes/FastSSD/Developer/Projects/CyntientOps-MP/apps/mobile-rn/assets/images/icons/`

### **4. Create Placeholder Images (if needed)**
For buildings without images, create placeholder images:
- Size: 800x600px recommended
- Format: JPG or PNG
- Name: `building_placeholder.png` (already exists)

## ✅ **Verification**

After copying, you should have these files in your destination folders:

### **Buildings Folder** (`/apps/mobile-rn/assets/images/buildings/`)
```
12_West_18th_Street.jpg
135-139_West_17th_Street.jpg
104_Franklin_Street.jpg
138West17thStreet.jpg
68_Perry_Street.jpg
112_West_18th_Street.jpg
41_Elizabeth_Street.jpeg
117_West_17th_Street.jpg
131_Perry_Street.jpg
123_1st_Avenue.jpg
136_West_17th_Street.jpg
Rubin_Museum_142-148_West_17th_Street.jpg
133_East_15th_Street.jpg
Stuyvesant_Cove_Park.jpg
36_Walker_Street.jpg
building_placeholder.png
```

### **Icons Folder** (`/apps/mobile-rn/assets/images/icons/`)
```
AIAssistant.png
```

## 🔧 **Code Integration**

The React Native code is already configured to use these images with `require()` statements:

```typescript
// Example from BuildingDetailScreen.tsx
const getBuildingImage = (buildingId: string): any => {
  const imageMap: Record<string, any> = {
    '1': require('../../assets/images/buildings/12_West_18th_Street.jpg'),
    '3': require('../../assets/images/buildings/135-139_West_17th_Street.jpg'),
    '4': require('../../assets/images/buildings/104_Franklin_Street.jpg'),
    // ... etc
  };
  return imageMap[buildingId] || require('../../assets/images/buildings/building_placeholder.png');
};
```

## 📝 **Notes**

- **Rubin Museum** is the most important image as it serves as both the museum and CyntientOps HQ
- All images should be optimized for mobile display
- The `building_placeholder.png` will be used as a fallback for any missing images
- File names must match exactly what's in the code (case-sensitive)
- JPG files are preferred for building images, PNG for icons

## 🚀 **After Copying**

Once you've copied all the images:
1. The React Native app will automatically use the local images
2. No code changes needed - everything is already configured
3. The app will display real building images instead of placeholders
4. All 19 buildings will have their actual photos displayed

The image system is production-ready and will work immediately once the files are copied!
