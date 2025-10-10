'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AdminOverview } from './AdminOverview';
import { AdminWorkersView } from './AdminWorkersView';
import { AdminBuildingsView } from './AdminBuildingsView';
import { AdminComplianceView } from './AdminComplianceView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminSystemView } from './AdminSystemView';
import { AdminSecurityView } from './AdminSecurityView';
import { AdminSettingsView } from './AdminSettingsView';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
  permissions?: string[];
}

interface AdminDashboardProps {
  activeTab: string;
  user: User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, user }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview user={user} />;
      case 'workers':
        return <AdminWorkersView user={user} />;
      case 'buildings':
        return <AdminBuildingsView user={user} />;
      case 'compliance':
        return <AdminComplianceView user={user} />;
      case 'analytics':
        return <AdminAnalyticsView user={user} />;
      case 'system':
        return <AdminSystemView user={user} />;
      case 'security':
        return <AdminSecurityView user={user} />;
      case 'settings':
        return <AdminSettingsView user={user} />;
      default:
        return <AdminOverview user={user} />;
    }
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {renderContent()}
    </motion.div>
  );
};
