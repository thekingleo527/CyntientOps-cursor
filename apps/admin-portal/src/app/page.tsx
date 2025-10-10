'use client';

import React, { useState, useEffect } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminSidebar } from '@/components/AdminSidebar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function AdminPortalPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate loading admin user data
    const loadUser = async () => {
      try {
        // In a real app, this would fetch from your auth service
        const userData = {
          id: '1',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@cyntientops.com',
          avatar: null,
          permissions: ['read', 'write', 'delete', 'admin'],
        };
        setUser(userData);
      } catch (error) {
        console.error('Failed to load admin user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800">
      <AdminHeader user={user} />
      
      <div className="flex">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          userRole={user?.role}
        />
        
        <main className="flex-1 p-6">
          <AdminDashboard 
            activeTab={activeTab}
            user={user}
          />
        </main>
      </div>
    </div>
  );
}
