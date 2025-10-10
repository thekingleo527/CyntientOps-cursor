'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
}

interface BuildingsViewProps {
  user: User | null;
}

interface Building {
  id: string;
  name: string;
  address: string;
  type: string;
  units: number;
  compliance: number;
  status: 'good' | 'warning' | 'critical';
  lastInspection: string;
  assignedWorkers: number;
}

export const BuildingsView: React.FC<BuildingsViewProps> = ({ user }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    // Load real buildings data from data files
    const loadBuildings = async () => {
      try {
        // Import real data from the data-seed package
        const buildingsData = await import('@cyntientops/data-seed/buildings.json');
        const routinesData = await import('@cyntientops/data-seed/routines.json');
        
        const buildings = buildingsData.default || buildingsData;
        const routines = routinesData.default || routinesData;
        
        // Transform real building data to match component interface
        const transformedBuildings: Building[] = buildings.map((building: any) => {
          // Count assigned workers for this building
          const assignedWorkers = new Set(
            routines.filter((r: any) => r.buildingId === building.id).map((r: any) => r.workerId)
          ).size;
          
          // Determine status based on compliance score
          let status: 'good' | 'warning' | 'critical' = 'good';
          if (building.compliance_score < 0.7) {
            status = 'critical';
          } else if (building.compliance_score < 0.85) {
            status = 'warning';
          }
          
          // Calculate last inspection (simplified - in real app this would come from inspection logs)
          const lastInspection = building.compliance_score > 0.9 ? '1 day ago' : 
                                building.compliance_score > 0.8 ? '3 days ago' : '1 week ago';
          
          // Determine building type
          let type = 'Residential';
          if (building.name.includes('Museum') || building.name.includes('Rubin')) {
            type = 'Museum';
          } else if (building.numberOfUnits === 0 && building.commercialUnits > 0) {
            type = 'Commercial';
          } else if (building.commercialUnits > 0) {
            type = 'Mixed Use';
          }
          
          return {
            id: building.id,
            name: building.name,
            address: building.address,
            type,
            units: building.numberOfUnits,
            compliance: Math.round(building.compliance_score * 100),
            status,
            lastInspection,
            assignedWorkers,
          };
        });
        
        setBuildings(transformedBuildings);
      } catch (error) {
        console.error('Failed to load real buildings data, using fallback:', error);
        // Fallback to known building data
        const fallbackBuildings: Building[] = [
          {
            id: '10',
            name: '131 Perry Street',
            address: '131 Perry St, New York, NY 10014',
            type: 'Residential',
            units: 6,
            compliance: 85,
            status: 'good',
            lastInspection: '2 days ago',
            assignedWorkers: 2,
          },
          {
            id: '4',
            name: 'Rubin Museum',
            address: '104 Franklin St, New York, NY 10013',
            type: 'Museum',
            units: 0,
            compliance: 95,
            status: 'good',
            lastInspection: '1 day ago',
            assignedWorkers: 1,
          },
          {
            id: '3',
            name: '136 West 17th Street',
            address: '136 W 17th St, New York, NY 10011',
            type: 'Mixed Use',
            units: 12,
            compliance: 92,
            status: 'good',
            lastInspection: '3 days ago',
            assignedWorkers: 2,
          },
          {
            id: '1',
            name: '41 Elizabeth Street',
            address: '41 Elizabeth St, New York, NY 10013',
            type: 'Residential',
            units: 7,
            compliance: 78,
            status: 'warning',
            lastInspection: '5 days ago',
            assignedWorkers: 1,
          },
          {
            id: '5',
            name: '115 7th Avenue',
            address: '115 7th Ave, New York, NY 10011',
            type: 'Commercial',
            units: 0,
            compliance: 65,
            status: 'critical',
            lastInspection: '1 week ago',
            assignedWorkers: 0,
          },
          {
            id: '20',
            name: '224 East 14th Street',
            address: '224 East 14th Street, New York, NY 10003',
            type: 'Residential',
            units: 4,
            compliance: 87,
            status: 'good',
            lastInspection: '2 days ago',
            assignedWorkers: 1,
          },
        ];
        setBuildings(fallbackBuildings);
      }
    };

    loadBuildings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good':
        return 'Good';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return 'text-green-400';
    if (compliance >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Buildings Management</h1>
          <button className="btn btn-primary">
            <span>+</span>
            Add Building
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Buildings</p>
                <p className="text-2xl font-bold text-white">{buildings.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Good Status</p>
                <p className="text-2xl font-bold text-white">
                  {buildings.filter(b => b.status === 'good').length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Warnings</p>
                <p className="text-2xl font-bold text-white">
                  {buildings.filter(b => b.status === 'warning').length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Critical</p>
                <p className="text-2xl font-bold text-white">
                  {buildings.filter(b => b.status === 'critical').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {buildings.map((building, index) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{building.name}</h3>
                    <p className="text-white/60 text-sm">{building.address}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-white/60 text-sm">{building.type}</span>
                      <span className="text-white/60 text-sm">{building.units} units</span>
                      <span className="text-white/60 text-sm">{building.assignedWorkers} workers</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Compliance</p>
                    <p className={`text-xl font-bold ${getComplianceColor(building.compliance)}`}>
                      {building.compliance}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Last Inspection</p>
                    <p className="text-sm text-white">{building.lastInspection}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(building.status)}`}></div>
                    <span className="text-white text-sm">{getStatusText(building.status)}</span>
                  </div>
                  <button className="btn btn-secondary text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
