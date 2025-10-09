import React from 'react';
import { ClientDashboardMainView } from '@cyntientops/ui-components';
import { useAuth } from '../context/AuthContext';

export default function ClientDashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ClientDashboardMainView
      clientId={user.id}
      clientName={user.name}
      userRole={user.role}
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