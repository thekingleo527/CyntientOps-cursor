'use client';

import React, { useState, useEffect } from 'react';
import { WebDashboard } from '@/components/WebDashboard';
import { WebHeader } from '@/components/WebHeader';
import { WebSidebar } from '@/components/WebSidebar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Simulate loading user data
    const loadUser = async () => {
      try {
        // In a real app, this would fetch from your auth service
        const userData = {
          id: '1',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@cyntientops.com',
          avatar: null,
        };
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
      <WebHeader user={user} />
      
      <div className="flex">
        <WebSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          userRole={user?.role}
        />
        
        <main className="flex-1 p-6">
          <WebDashboard 
            activeTab={activeTab}
            user={user}
          />
        </main>
      </div>
    </div>
  );
}
