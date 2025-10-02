/**
 * @cyntientops/offline-support
 * 
 * Offline support for CyntientOps
 * Sync queues and offline-first architecture
 */

import { OfflineManager } from './OfflineManager';
export { OfflineManager } from './OfflineManager';

export type { 
  SyncOperation,
  SyncQueue,
  NetworkStatus,
  OfflineConfig
} from './OfflineManager';

// Offline manager initialization helper
export async function initializeOfflineManager(
  databaseManager: any,
  commandChainManager: any
): Promise<OfflineManager> {
  return OfflineManager.getInstance(
    databaseManager,
    commandChainManager
  );
}

// Default export with a local binding (helps Babel scope tracking)
export default OfflineManager;
