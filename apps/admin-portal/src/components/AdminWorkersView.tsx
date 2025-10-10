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

interface AdminWorkersViewProps {
  user: User | null;
}

interface Worker {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  lastLogin: string;
  createdAt: string;
}

export const AdminWorkersView: React.FC<AdminWorkersViewProps> = ({ user }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    const loadWorkers = async () => {
      const mockWorkers: Worker[] = [
        {
          id: '1',
          name: 'Kevin Dutan',
          email: 'kevin@cyntientops.com',
          role: 'Field Worker',
          status: 'active',
          permissions: ['read', 'write'],
          lastLogin: '2 min ago',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'Greg Hutson',
          email: 'greg@cyntientops.com',
          role: 'Field Worker',
          status: 'active',
          permissions: ['read', 'write'],
          lastLogin: '5 min ago',
          createdAt: '2024-01-10',
        },
        {
          id: '3',
          name: 'Moises Farhat',
          email: 'moises@cyntientops.com',
          role: 'Field Worker',
          status: 'active',
          permissions: ['read', 'write'],
          lastLogin: '15 min ago',
          createdAt: '2024-01-08',
        },
        {
          id: '4',
          name: 'Sarah Chen',
          email: 'sarah@cyntientops.com',
          role: 'Field Worker',
          status: 'active',
          permissions: ['read', 'write'],
          lastLogin: '1 min ago',
          createdAt: '2024-01-12',
        },
        {
          id: '5',
          name: 'Mike Rodriguez',
          email: 'mike@cyntientops.com',
          role: 'Field Worker',
          status: 'suspended',
          permissions: ['read'],
          lastLogin: '2 hours ago',
          createdAt: '2024-01-05',
        },
      ];
      setWorkers(mockWorkers);
    };

    loadWorkers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-red-500';
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
          <h1 className="text-3xl font-bold text-white">Workers Administration</h1>
          <button className="btn btn-primary">
            <span>+</span>
            Add Worker
          </button>
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
                    <p className="text-white/60 text-sm">{worker.email}</p>
                    <p className="text-white/60 text-sm">{worker.role}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Last Login</p>
                    <p className="text-sm text-white">{worker.lastLogin}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Created</p>
                    <p className="text-sm text-white">{worker.createdAt}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(worker.status)}`}></div>
                    <span className="text-white text-sm capitalize">{worker.status}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn btn-secondary text-sm">
                      Edit
                    </button>
                    <button className="btn btn-danger text-sm">
                      {worker.status === 'suspended' ? 'Activate' : 'Suspend'}
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
