import React from 'react';
import { AdminDashboardMainView } from '@cyntientops/ui-components';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <AdminDashboardMainView
      adminId={user.id}
      adminName={user.name}
      userRole={user.role}
      onWorkerPress={(workerId) => {
        console.log('Worker pressed:', workerId);
        // Handle worker press
      }}
      onBuildingPress={(buildingId) => {
        console.log('Building pressed:', buildingId);
        // Handle building press
      }}
      onHeaderRoute={(route) => {
        console.log('Header route:', route);
        // Handle header route
      }}
    />
  );
}