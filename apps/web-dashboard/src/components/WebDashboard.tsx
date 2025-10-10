'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DashboardOverview } from './DashboardOverview';
import { WorkersView } from './WorkersView';
import { BuildingsView } from './BuildingsView';
import { ComplianceView } from './ComplianceView';
import { AnalyticsView } from './AnalyticsView';
import { SettingsView } from './SettingsView';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string | null;
}

interface WebDashboardProps {
  activeTab: string;
  user: User | null;
}

export const WebDashboard: React.FC<WebDashboardProps> = ({ activeTab, user }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview user={user} />;
      case 'workers':
        return <WorkersView user={user} />;
      case 'buildings':
        return <BuildingsView user={user} />;
      case 'compliance':
        return <ComplianceView user={user} />;
      case 'analytics':
        return <AnalyticsView user={user} />;
      case 'settings':
        return <SettingsView user={user} />;
      default:
        return <DashboardOverview user={user} />;
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
