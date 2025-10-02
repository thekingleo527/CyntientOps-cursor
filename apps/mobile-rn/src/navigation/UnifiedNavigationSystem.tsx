/**
 * 🧭 Unified Navigation System
 *
 * Wrapper around `AppNavigator` to preserve backwards compatibility with
 * previous imports (`UnifiedNavigationSystem`) while we consolidate the
 * navigation architecture. New features should target `AppNavigator`.
 */

import React from 'react';
import type { WorkerProfile } from '@cyntientops/domain-schema';
import { AppNavigator } from './AppNavigator';

export interface UnifiedNavigationSystemProps {
  initialUser?: WorkerProfile;
}

export const UnifiedNavigationSystem: React.FC<UnifiedNavigationSystemProps> = ({ initialUser }) => {
  return <AppNavigator initialUser={initialUser} />;
};

export * from './AppNavigator';
export default UnifiedNavigationSystem;
