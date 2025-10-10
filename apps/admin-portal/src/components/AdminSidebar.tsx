'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊', color: 'from-red-500 to-red-600' },
  { id: 'workers', label: 'Workers', icon: '👷', color: 'from-blue-500 to-blue-600' },
  { id: 'buildings', label: 'Buildings', icon: '🏢', color: 'from-green-500 to-green-600' },
  { id: 'compliance', label: 'Compliance', icon: '✅', color: 'from-yellow-500 to-yellow-600' },
  { id: 'analytics', label: 'Analytics', icon: '📈', color: 'from-purple-500 to-purple-600' },
  { id: 'system', label: 'System', icon: '⚙️', color: 'from-gray-500 to-gray-600' },
  { id: 'security', label: 'Security', icon: '🔒', color: 'from-indigo-500 to-indigo-600' },
  { id: 'settings', label: 'Settings', icon: '🔧', color: 'from-orange-500 to-orange-600' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  userRole 
}) => {
  return (
    <motion.aside 
      className="w-64 admin-sidebar p-4 mr-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <nav className="space-y-2">
        {ADMIN_TABS.map((tab, index) => (
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
            <div className={`w-8 h-8 bg-gradient-to-r ${tab.color} rounded-lg flex items-center justify-center`}>
              <span className="text-sm">{tab.icon}</span>
            </div>
            <span className="font-medium">{tab.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Admin Actions */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <h3 className="text-white/60 text-sm font-semibold mb-3 uppercase tracking-wide">
          Admin Actions
        </h3>
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
            <span className="text-lg">🚨</span>
            <span className="text-sm">Emergency Override</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
            <span className="text-lg">📊</span>
            <span className="text-sm">System Reports</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
            <span className="text-lg">🔧</span>
            <span className="text-sm">Maintenance Mode</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <h3 className="text-white/60 text-sm font-semibold mb-3 uppercase tracking-wide">
          System Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">API Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 text-xs">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Database</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 text-xs">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Workers</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-400 text-xs">5/7 Active</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
