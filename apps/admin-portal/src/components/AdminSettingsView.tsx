'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
  permissions?: string[];
}

interface AdminSettingsViewProps {
  user: User | null;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6"
      >
        <h1 className="text-3xl font-bold text-white mb-6">System Settings</h1>
        <p className="text-white/80">Global system configuration and preferences.</p>
      </motion.div>
    </div>
  );
};
