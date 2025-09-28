/**
 * @cyntientops/realtime-sync
 * 
 * Real-time synchronization for CyntientOps
 * WebSocket and live updates
 */

export { WebSocketManager } from './WebSocketManager';

export type { 
  WebSocketMessage,
  WebSocketConnection,
  RealtimeEvent,
  RealtimeConfig
} from './WebSocketManager';

// WebSocket manager initialization helper
export async function initializeWebSocketManager(
  databaseManager: any,
  offlineManager: any
): Promise<WebSocketManager> {
  return WebSocketManager.getInstance(
    databaseManager,
    offlineManager
  );
}

// Default export
export default WebSocketManager;
