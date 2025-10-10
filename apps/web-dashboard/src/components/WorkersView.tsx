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

interface WorkersViewProps {
  user: User | null;
}

interface Worker {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'on-break';
  currentBuilding: string;
  tasksCompleted: number;
  lastSeen: string;
  avatar?: string;
}

export const WorkersView: React.FC<WorkersViewProps> = ({ user }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    // Load real workers data from data files
    const loadWorkers = async () => {
      try {
        // Import real data from the data-seed package
        const workersData = await import('../../../../packages/data-seed/src/workers.json');
        const routinesData = await import('../../../../packages/data-seed/src/routines.json');
        
        const workers = workersData.default || workersData;
        const routines = routinesData.default || routinesData;
        
        // Transform real worker data to match component interface
        const transformedWorkers: Worker[] = workers.map((worker: any) => {
          // Find current building assignment from routines
          const currentRoutine = routines.find((r: any) => r.workerId === worker.id);
          const currentBuilding = currentRoutine ? currentRoutine.building : 'No current assignment';
          
          // Count tasks completed by this worker
          const tasksCompleted = routines.filter((r: any) => r.workerId === worker.id).length;
          
          // Determine status based on worker data
          let status: 'active' | 'inactive' | 'on-break' = 'inactive';
          if (worker.isActive && worker.status === 'Available') {
            status = 'active';
          } else if (worker.isActive && worker.status === 'On Break') {
            status = 'on-break';
          }
          
          // Calculate last seen (simplified - in real app this would come from activity logs)
          const lastSeen = worker.isActive ? '2 min ago' : '2 hours ago';
          
          return {
            id: worker.id,
            name: worker.name,
            role: worker.role === 'worker' ? 'Field Worker' : worker.role,
            status,
            currentBuilding,
            tasksCompleted,
            lastSeen,
            avatar: worker.avatar,
          };
        });
        
        setWorkers(transformedWorkers);
      } catch (error) {
        console.error('Failed to load real workers data, using fallback:', error);
        // Fallback to known worker data
        const fallbackWorkers: Worker[] = [
          {
            id: '1',
            name: 'Greg Hutson',
            role: 'Field Worker',
            status: 'active',
            currentBuilding: '131 Perry Street',
            tasksCompleted: 8,
            lastSeen: '2 min ago',
          },
          {
            id: '2',
            name: 'Edwin Lema',
            role: 'Field Worker',
            status: 'active',
            currentBuilding: 'Rubin Museum',
            tasksCompleted: 6,
            lastSeen: '5 min ago',
          },
          {
            id: '3',
            name: 'Kevin Dutan',
            role: 'Field Worker',
            status: 'active',
            currentBuilding: '136 West 17th',
            tasksCompleted: 4,
            lastSeen: '15 min ago',
          },
          {
            id: '4',
            name: 'Moises Farhat',
            role: 'Field Worker',
            status: 'active',
            currentBuilding: '41 Elizabeth Street',
            tasksCompleted: 7,
            lastSeen: '1 min ago',
          },
          {
            id: '8',
            name: 'Shawn Magloire',
            role: 'Admin',
            status: 'active',
            currentBuilding: '224 East 14th Street',
            tasksCompleted: 6,
            lastSeen: '3 min ago',
          },
        ];
        setWorkers(fallbackWorkers);
      }
    };

    loadWorkers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'on-break':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'on-break':
        return 'On Break';
      case 'inactive':
        return 'Offline';
      default:
        return 'Unknown';
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
          <h1 className="text-3xl font-bold text-white">Workers Management</h1>
          <button 
            className="btn btn-primary"
            onClick={() => console.log('Add Worker clicked')}
          >
            <span>+</span>
            Add Worker
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👷</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Active Workers</p>
                <p className="text-2xl font-bold text-white">
                  {workers.filter(w => w.status === 'active').length}
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
                <p className="text-white/80 text-sm">Total Workers</p>
                <p className="text-2xl font-bold text-white">{workers.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Tasks Completed</p>
                <p className="text-2xl font-bold text-white">
                  {workers.reduce((sum, w) => sum + w.tasksCompleted, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {workers.map((worker, index) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {worker.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{worker.name}</h3>
                    <p className="text-white/60 text-sm">{worker.role}</p>
                    <p className="text-white/60 text-sm">📍 {worker.currentBuilding}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Tasks Completed</p>
                    <p className="text-xl font-bold text-white">{worker.tasksCompleted}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Last Seen</p>
                    <p className="text-sm text-white">{worker.lastSeen}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(worker.status)}`}></div>
                    <span className="text-white text-sm">{getStatusText(worker.status)}</span>
                  </div>
                  <button 
                    className="btn btn-secondary text-sm"
                    onClick={() => console.log('View Details clicked for worker:', worker.id)}
                  >
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
