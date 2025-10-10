'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface WebSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const getTabsForRole = (role: string) => {
  switch (role) {
    case 'admin':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'workers', label: 'Workers', icon: '👷' },
        { id: 'buildings', label: 'Buildings', icon: '🏢' },
        { id: 'compliance', label: 'Compliance', icon: '✅' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
      ];
    case 'client':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'buildings', label: 'My Buildings', icon: '🏢' },
        { id: 'compliance', label: 'Compliance', icon: '✅' },
        { id: 'team', label: 'Team', icon: '👥' },
        { id: 'reports', label: 'Reports', icon: '📋' },
      ];
    case 'worker':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'tasks', label: 'My Tasks', icon: '📋' },
        { id: 'buildings', label: 'Buildings', icon: '🏢' },
        { id: 'schedule', label: 'Schedule', icon: '📅' },
        { id: 'profile', label: 'Profile', icon: '👤' },
      ];
    default:
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      ];
  }
};

export const WebSidebar: React.FC<WebSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  userRole 
}) => {
  const tabs = getTabsForRole(userRole);

  return (
    <motion.aside 
      className="w-64 glass-card p-4 mr-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <nav className="space-y-2">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <h3 className="text-white/60 text-sm font-semibold mb-3 uppercase tracking-wide">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
            <span className="text-lg">🚨</span>
            <span className="text-sm">Emergency Report</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
            <span className="text-lg">📸</span>
            <span className="text-sm">Photo Upload</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
            <span className="text-lg">💬</span>
            <span className="text-sm">Message Team</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
