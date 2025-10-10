'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
}

interface SettingsViewProps {
  user: User | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    pushNotifications: false,
    darkMode: false,
    autoRefresh: true,
    language: 'en',
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6"
      >
        <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Profile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user?.name}</h3>
                  <p className="text-white/60 text-sm">{user?.email}</p>
                  <p className="text-white/60 text-sm capitalize">{user?.role}</p>
                </div>
              </div>
              <button className="btn btn-secondary w-full">
                Edit Profile
              </button>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
            <div className="space-y-4">
              {[
                { key: 'notifications', label: 'Enable Notifications', description: 'Receive system notifications' },
                { key: 'emailAlerts', label: 'Email Alerts', description: 'Get alerts via email' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{setting.label}</p>
                    <p className="text-white/60 text-sm">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[setting.key as keyof typeof settings] as boolean}
                      onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>

          {/* App Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">App Settings</h2>
            <div className="space-y-4">
              {[
                { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme' },
                { key: 'autoRefresh', label: 'Auto Refresh', description: 'Automatically refresh data' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{setting.label}</p>
                    <p className="text-white/60 text-sm">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[setting.key as keyof typeof settings] as boolean}
                      onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
              
              <div>
                <label className="block text-white font-medium mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en" className="bg-gray-800">English</option>
                  <option value="es" className="bg-gray-800">Español</option>
                  <option value="fr" className="bg-gray-800">Français</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* System Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/80">Version</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Build</span>
                <span className="text-white">2024.01.15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Environment</span>
                <span className="text-white">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Last Updated</span>
                <span className="text-white">2 days ago</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <button className="btn btn-secondary w-full">
                Check for Updates
              </button>
              <button className="btn btn-primary w-full">
                Export Data
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
