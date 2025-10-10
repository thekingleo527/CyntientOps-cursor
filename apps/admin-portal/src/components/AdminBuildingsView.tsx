'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
  permissions?: string[];
}

interface AdminBuildingsViewProps {
  user: User | null;
}

interface Building {
  id: string;
  name: string;
  address: string;
  type: string;
  units: number;
  compliance: number;
  status: 'active' | 'inactive' | 'maintenance';
  lastInspection: string;
  assignedWorkers: number;
  managementCompany: string;
}

export const AdminBuildingsView: React.FC<AdminBuildingsViewProps> = ({ user }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    const loadBuildings = async () => {
      const mockBuildings: Building[] = [
        {
          id: '1',
          name: '131 Perry Street',
          address: '131 Perry St, New York, NY 10014',
          type: 'Residential',
          units: 6,
          compliance: 85,
          status: 'active',
          lastInspection: '2 days ago',
          assignedWorkers: 2,
          managementCompany: 'J&M Realty',
        },
        {
          id: '2',
          name: 'Rubin Museum',
          address: '104 Franklin St, New York, NY 10013',
          type: 'Museum',
          units: 0,
          compliance: 95,
          status: 'active',
          lastInspection: '1 day ago',
          assignedWorkers: 1,
          managementCompany: 'Rubin Foundation',
        },
        {
          id: '3',
          name: '136 West 17th Street',
          address: '136 W 17th St, New York, NY 10011',
          type: 'Mixed Use',
          units: 12,
          compliance: 92,
          status: 'active',
          lastInspection: '3 days ago',
          assignedWorkers: 2,
          managementCompany: 'J&M Realty',
        },
        {
          id: '4',
          name: '41 Elizabeth Street',
          address: '41 Elizabeth St, New York, NY 10013',
          type: 'Residential',
          units: 7,
          compliance: 78,
          status: 'maintenance',
          lastInspection: '5 days ago',
          assignedWorkers: 1,
          managementCompany: 'J&M Realty',
        },
        {
          id: '5',
          name: '115 7th Avenue',
          address: '115 7th Ave, New York, NY 10011',
          type: 'Commercial',
          units: 0,
          compliance: 65,
          status: 'inactive',
          lastInspection: '1 week ago',
          assignedWorkers: 0,
          managementCompany: 'Unmanaged',
        },
      ];
      setBuildings(mockBuildings);
    };

    loadBuildings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
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
          <h1 className="text-3xl font-bold text-white">Buildings Administration</h1>
          <button className="btn btn-primary">
            <span>+</span>
            Add Building
          </button>
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
                    <p className="text-white/60 text-sm mt-1">Managed by: {building.managementCompany}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Compliance</p>
                    <p className="text-xl font-bold text-white">{building.compliance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Last Inspection</p>
                    <p className="text-sm text-white">{building.lastInspection}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(building.status)}`}></div>
                    <span className="text-white text-sm capitalize">{building.status}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn btn-secondary text-sm">
                      Edit
                    </button>
                    <button className="btn btn-danger text-sm">
                      {building.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
