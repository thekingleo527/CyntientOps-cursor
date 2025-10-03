/**
 * 📍 Building Marker
 * Mirrors: CyntientOps/Views/Maps/BuildingMarker.swift
 * Purpose: Custom building marker with task count and status indicators
 */

import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Building } from '@cyntientops/domain-schema';

interface BuildingMarkerProps {
  building: Building;
  color: string;
  size: number;
  isSelected: boolean;
  taskCount: number;
}

export const BuildingMarker: React.FC<BuildingMarkerProps> = ({
  building,
  color,
  size,
  isSelected,
  taskCount
}) => {
  const markerSize = Math.max(size, 30);
  const innerSize = markerSize * 0.7;
  const pulseSize = isSelected ? markerSize * 1.3 : markerSize;

  return (
    <View style={styles.container}>
      {/* Pulse Animation for Selected Marker */}
      {isSelected && (
        <View style={[
          styles.pulse,
          {
            width: pulseSize,
            height: pulseSize,
            borderRadius: pulseSize / 2,
            backgroundColor: color,
            opacity: 0.3,
          }
        ]} />
      )}
      
      {/* Main Marker */}
      <View style={[
        styles.marker,
        {
          width: markerSize,
          height: markerSize,
          borderRadius: markerSize / 2,
          backgroundColor: color,
          borderWidth: isSelected ? 3 : 2,
          borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
        }
      ]}>
        {/* Inner Circle */}
        <View style={[
          styles.innerCircle,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }
        ]}>
          {/* Building Image */}
          {building.imageAssetName ? (
            <Image
              source={{ uri: `https://example.com/images/${building.imageAssetName}.jpg` }}
              style={[
                styles.buildingImage,
                {
                  width: innerSize * 0.8,
                  height: innerSize * 0.8,
                  borderRadius: (innerSize * 0.8) / 2,
                }
              ]}
              defaultSource={require('../../../../apps/mobile-rn/assets/images/icon.png')}
            />
          ) : (
            /* Building Type Icon Fallback */
            <Text style={styles.buildingIcon}>
              {getBuildingIcon(building.building_type)}
            </Text>
          )}
          
          {/* Task Count Badge */}
          {taskCount > 0 && (
            <View style={styles.taskBadge}>
              <Text style={styles.taskCount}>{taskCount}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Status Indicator */}
      <View style={[
        styles.statusIndicator,
        {
          backgroundColor: getStatusColor(building),
          borderColor: color,
        }
      ]} />
    </View>
  );
};

const getBuildingIcon = (buildingType?: string): string => {
  if (!buildingType) return '🏢';
  
  const type = buildingType.toLowerCase();
  if (type.includes('residential')) return '🏠';
  if (type.includes('commercial')) return '🏢';
  if (type.includes('industrial')) return '🏭';
  if (type.includes('office')) return '🏢';
  if (type.includes('retail')) return '🛍️';
  if (type.includes('warehouse')) return '🏭';
  return '🏢';
};

const getStatusColor = (building: Building): string => {
  // This would be determined by building status, compliance, etc.
  // For now, we'll use a default color
  return '#10b981';
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  taskBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  taskCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buildingIcon: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  buildingImage: {
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});

export default BuildingMarker;
