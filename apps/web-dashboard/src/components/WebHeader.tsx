'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
}

interface WebHeaderProps {
  user: User | null;
}

export const WebHeader: React.FC<WebHeaderProps> = ({ user }) => {
  return (
    <motion.header 
      className="glass-card p-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CyntientOps</h1>
            <p className="text-sm text-white/80">Field Operations Dashboard</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">{user.name}</p>
                <p className="text-white/60 text-xs capitalize">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
