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

interface AnalyticsViewProps {
  user: User | null;
}

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  workerEfficiency: number;
  complianceRate: number;
  costSavings: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ user }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTasks: 0,
    completedTasks: 0,
    averageCompletionTime: 0,
    workerEfficiency: 0,
    complianceRate: 0,
    costSavings: 0,
  });

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      const mockAnalytics: AnalyticsData = {
        totalTasks: 156,
        completedTasks: 142,
        averageCompletionTime: 42,
        workerEfficiency: 91.7,
        complianceRate: 89.3,
        costSavings: 12500,
      };
      setAnalytics(mockAnalytics);
    };

    loadAnalytics();
  }, []);

  const completionRate = analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
          <button className="btn btn-primary">
            <span>📊</span>
            Generate Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <span className="text-green-400 text-sm font-medium">+12% this week</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Task Completion Rate</h3>
            <p className="text-3xl font-bold text-white">{completionRate.toFixed(1)}%</p>
            <p className="text-white/60 text-sm mt-1">{analytics.completedTasks} of {analytics.totalTasks} tasks</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-green-400 text-sm font-medium">+5% this month</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Worker Efficiency</h3>
            <p className="text-3xl font-bold text-white">{analytics.workerEfficiency}%</p>
            <p className="text-white/60 text-sm mt-1">Above industry average</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <span className="text-green-400 text-sm font-medium">+3% this quarter</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Compliance Rate</h3>
            <p className="text-3xl font-bold text-white">{analytics.complianceRate}%</p>
            <p className="text-white/60 text-sm mt-1">All agencies combined</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
              <span className="text-blue-400 text-sm font-medium">-8 min avg</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Avg Completion Time</h3>
            <p className="text-3xl font-bold text-white">{analytics.averageCompletionTime}m</p>
            <p className="text-white/60 text-sm mt-1">Per task</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-green-400 text-sm font-medium">+15% this month</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Cost Savings</h3>
            <p className="text-3xl font-bold text-white">${analytics.costSavings.toLocaleString()}</p>
            <p className="text-white/60 text-sm mt-1">This quarter</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <span className="text-green-400 text-sm font-medium">+22% growth</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Performance Score</h3>
            <p className="text-3xl font-bold text-white">94.2</p>
            <p className="text-white/60 text-sm mt-1">Overall rating</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Task Completion Trend</h2>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <p className="text-white/60">Chart visualization would go here</p>
                <p className="text-white/40 text-sm">Integration with charting library</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Worker Performance</h2>
            <div className="space-y-4">
              {[
                { name: 'Kevin Dutan', efficiency: 96, tasks: 12 },
                { name: 'Greg Hutson', efficiency: 94, tasks: 10 },
                { name: 'Moises Farhat', efficiency: 89, tasks: 8 },
                { name: 'Sarah Chen', efficiency: 92, tasks: 11 },
              ].map((worker, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {worker.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{worker.name}</p>
                      <p className="text-white/60 text-xs">{worker.tasks} tasks completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{worker.efficiency}%</p>
                    <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                        style={{ width: `${worker.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
