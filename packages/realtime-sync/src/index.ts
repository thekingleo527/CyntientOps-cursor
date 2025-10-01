/**
 * @cyntientops/realtime-sync
 *
 * Realtime Sync Package
 * Purpose: Advanced conflict resolution and delta sync for offline-first architecture
 * Features: 3-way merge, delta sync, CRDT-based conflict resolution
 */

// WebSocket Manager
export { WebSocketManager, getWebSocketManager, defaultWebSocketConfig } from './WebSocketManager';
export type {
  WebSocketMessage,
  WebSocketConnection,
  WebSocketConfig
} from './WebSocketManager';

// Conflict Detection
export { ConflictDetector } from './conflicts/ConflictDetector';
export type {
  DataRecord,
  Conflict,
  ConflictResolution
} from './conflicts/ConflictDetector';

// Three-Way Merge
export { ThreeWayMergeService } from './conflicts/ThreeWayMerge';
export type { MergeResult } from './conflicts/ThreeWayMerge';

// Conflict Resolution
export { ConflictResolver } from './conflicts/ConflictResolver';
export type { ResolutionStrategy } from './conflicts/ConflictResolver';

// Delta Sync
export { DeltaSyncService } from './delta/DeltaSyncService';
export type { Delta, SyncResult } from './delta/DeltaSyncService';