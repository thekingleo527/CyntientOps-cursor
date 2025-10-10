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

interface ComplianceViewProps {
  user: User | null;
}

interface ComplianceItem {
  id: string;
  building: string;
  type: 'HPD' | 'DOB' | 'DSNY' | 'LL97';
  status: 'compliant' | 'warning' | 'violation';
  dueDate: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({ user }) => {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);

  useEffect(() => {
    // Simulate loading compliance data
    const loadCompliance = async () => {
      const mockCompliance: ComplianceItem[] = [
        {
          id: '1',
          building: '131 Perry Street',
          type: 'HPD',
          status: 'compliant',
          dueDate: '2024-02-15',
          severity: 'low',
          description: 'Annual boiler inspection completed',
        },
        {
          id: '2',
          building: '41 Elizabeth Street',
          type: 'DOB',
          status: 'warning',
          dueDate: '2024-01-30',
          severity: 'medium',
          description: 'Elevator inspection overdue',
        },
        {
          id: '3',
          building: '115 7th Avenue',
          type: 'DSNY',
          status: 'violation',
          dueDate: '2024-01-20',
          severity: 'high',
          description: 'Trash collection violation',
        },
        {
          id: '4',
          building: '136 West 17th Street',
          type: 'LL97',
          status: 'compliant',
          dueDate: '2024-03-01',
          severity: 'low',
          description: 'Energy efficiency report submitted',
        },
        {
          id: '5',
          building: 'Rubin Museum',
          type: 'HPD',
          status: 'warning',
          dueDate: '2024-02-10',
          severity: 'medium',
          description: 'Fire safety inspection pending',
        },
      ];
      setComplianceItems(mockCompliance);
    };

    loadCompliance();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'violation':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Compliant';
      case 'warning':
        return 'Warning';
      case 'violation':
        return 'Violation';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HPD':
        return '🏠';
      case 'DOB':
        return '🏗️';
      case 'DSNY':
        return '🗑️';
      case 'LL97':
        return '🌱';
      default:
        return '📋';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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
          <h1 className="text-3xl font-bold text-white">Compliance Management</h1>
          <button className="btn btn-primary">
            <span>+</span>
            Add Compliance Item
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Compliant</p>
                <p className="text-2xl font-bold text-white">
                  {complianceItems.filter(c => c.status === 'compliant').length}
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
                  {complianceItems.filter(c => c.status === 'warning').length}
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
                <p className="text-white/80 text-sm">Violations</p>
                <p className="text-2xl font-bold text-white">
                  {complianceItems.filter(c => c.status === 'violation').length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">{complianceItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {complianceItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.building}</h3>
                    <p className="text-white/60 text-sm">{item.type} Compliance</p>
                    <p className="text-white/60 text-sm">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Due Date</p>
                    <p className="text-sm text-white">{item.dueDate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Severity</p>
                    <p className={`text-sm font-medium ${getSeverityColor(item.severity)}`}>
                      {item.severity.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                    <span className="text-white text-sm">{getStatusText(item.status)}</span>
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
