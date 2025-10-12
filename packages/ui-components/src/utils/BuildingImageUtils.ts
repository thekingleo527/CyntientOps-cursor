/**
 * 🏢 Building Image Utilities
 * Purpose: Centralized mapping of building names to local image assets
 * Features: Intelligent image loading, fallback handling, asset management
 */

export const getBuildingImage = (building: any) => {
  if (!building?.imageAssetName) return null;
  
  // Map building imageAssetName to local image assets
  const imageMap: { [key: string]: any } = {
    // Elizabeth Street
    '41_Elizabeth_Street': require('../../../../apps/mobile-rn/assets/images/buildings/41_Elizabeth_Street.jpeg'),
    
    // 1st Avenue
    '123_1st_Avenue': require('../../../../apps/mobile-rn/assets/images/buildings/123_1st_Avenue.jpg'),
    
    // 7th Avenue
    '115_7th_Avenue': require('../../../../apps/mobile-rn/assets/images/buildings/115_7th_ave.jpg'),
    
    // Perry Street
    '68_Perry_Street': require('../../../../apps/mobile-rn/assets/images/buildings/68_Perry_Street.jpg'),
    '131_Perry_Street': require('../../../../apps/mobile-rn/assets/images/buildings/131_Perry_Street.jpg'),
    
    // West 17th Street
    '136_West_17th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/136_West_17th_Street.jpg'),
    '138_West_17th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/138West17thStreet.jpg'),
    '117_West_17th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/117_West_17th_Street.jpg'),
    '135_139_West_17th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/135West17thStreet.jpg'),
    
    // East 15th Street
    '133_East_15th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/133_East_15th_Street.jpg'),
    
    // East 14th Street
    '224_East_14th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/224_east_14th_Street.jpg'),
    
    // Walker Street
    '36_Walker_Street': require('../../../../apps/mobile-rn/assets/images/buildings/36_Walker_Street.jpg'),
    
    // Franklin Street (Rubin Museum)
    '104_Franklin_Street': require('../../../../apps/mobile-rn/assets/images/buildings/104_Franklin_Street.jpg'),
    'Rubin_Museum': require('../../../../apps/mobile-rn/assets/images/buildings/Rubin_Museum_142_148_West_17th_Street.jpg'),
    
    // Spring Street
    '178_Spring_Street': require('../../../../apps/mobile-rn/assets/images/buildings/178_Spring_st.jpg'),
    
    // Chambers Street
    '148_Chambers_Street': require('../../../../apps/mobile-rn/assets/images/buildings/148chambers.jpg'),
    
    // West 18th Street
    '12_West_18th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/12_West_18th_Street.jpg'),
    '112_West_18th_Street': require('../../../../apps/mobile-rn/assets/images/buildings/112_West_18th_Street.jpg'),
    
    // Special Locations
    'Stuyvesant_Cove_Park': require('../../../../apps/mobile-rn/assets/images/buildings/Stuyvesant_Cove_Park.jpg'),
  };
  
  return imageMap[building.imageAssetName] || null;
};

export const getBuildingImageName = (building: any): string => {
  if (!building?.imageAssetName) return 'Unknown Building';
  
  // Convert imageAssetName to display name
  const nameMap: { [key: string]: string } = {
    '41_Elizabeth_Street': '41 Elizabeth Street',
    '123_1st_Avenue': '123 1st Avenue',
    '115_7th_Avenue': '115 7th Avenue',
    '68_Perry_Street': '68 Perry Street',
    '131_Perry_Street': '131 Perry Street',
    '136_West_17th_Street': '136 West 17th Street',
    '138_West_17th_Street': '138 West 17th Street',
    '117_West_17th_Street': '117 West 17th Street',
    '135_139_West_17th_Street': '135-139 West 17th Street',
    '133_East_15th_Street': '133 East 15th Street',
    '224_East_14th_Street': '224 East 14th Street',
    '36_Walker_Street': '36 Walker Street',
    '104_Franklin_Street': '104 Franklin Street (Rubin Museum)',
    'Rubin_Museum': 'Rubin Museum',
    '178_Spring_Street': '178 Spring Street',
    '148_Chambers_Street': '148 Chambers Street',
    '12_West_18th_Street': '12 West 18th Street',
    '112_West_18th_Street': '112 West 18th Street',
    'Stuyvesant_Cove_Park': 'Stuyvesant Cove Park',
  };
  
  return nameMap[building.imageAssetName] || building.name || 'Unknown Building';
};

export const hasBuildingImage = (building: any): boolean => {
  return getBuildingImage(building) !== null;
};
