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

interface DashboardOverviewProps {
  user: User | null;
}

interface DashboardStats {
  totalWorkers: number;
  activeWorkers: number;
  totalBuildings: number;
  complianceRate: number;
  urgentTasks: number;
  completedTasks: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkers: 0,
    activeWorkers: 0,
    totalBuildings: 0,
    complianceRate: 0,
    urgentTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    // Simulate loading dashboard stats
    const loadStats = async () => {
      // In a real app, this would fetch from your API
      const mockStats: DashboardStats = {
        totalWorkers: 7,
        activeWorkers: 5,
        totalBuildings: 19,
        complianceRate: 89,
        urgentTasks: 3,
        completedTasks: 24,
      };
      setStats(mockStats);
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Active Workers',
      value: stats.activeWorkers,
      total: stats.totalWorkers,
      icon: '👷',
      color: 'from-blue-500 to-blue-600',
      change: '+2 today',
    },
    {
      title: 'Total Buildings',
      value: stats.totalBuildings,
      icon: '🏢',
      color: 'from-green-500 to-green-600',
      change: 'All monitored',
    },
    {
      title: 'Compliance Rate',
      value: `${stats.complianceRate}%`,
      icon: '✅',
      color: 'from-emerald-500 to-emerald-600',
      change: '+3% this week',
    },
    {
      title: 'Urgent Tasks',
      value: stats.urgentTasks,
      icon: '🚨',
      color: 'from-red-500 to-red-600',
      change: 'Needs attention',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-white/80">
          Here's what's happening with your field operations today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <span className="text-white/60 text-sm">{card.change}</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            {card.total && (
              <p className="text-white/60 text-sm mt-1">of {card.total} total</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Task completed', building: '131 Perry Street', time: '2 min ago', user: 'Kevin Dutan' },
              { action: 'Photo uploaded', building: 'Rubin Museum', time: '5 min ago', user: 'Greg Hutson' },
              { action: 'Compliance check', building: '136 West 17th', time: '12 min ago', user: 'Moises Farhat' },
              { action: 'Emergency report', building: '41 Elizabeth St', time: '18 min ago', user: 'Sarah Chen' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{activity.action}</p>
                  <p className="text-white/60 text-xs">{activity.building}</p>
                </div>
                <span className="text-white/40 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Add Worker', icon: '👷', color: 'from-blue-500 to-blue-600' },
              { label: 'New Building', icon: '🏢', color: 'from-green-500 to-green-600' },
              { label: 'Schedule Task', icon: '📅', color: 'from-purple-500 to-purple-600' },
              { label: 'View Reports', icon: '📊', color: 'from-orange-500 to-orange-600' },
            ].map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-lg bg-gradient-to-r ${action.color} text-white text-center`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium">{action.label}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
