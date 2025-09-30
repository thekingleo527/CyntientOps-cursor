/**
 * 🎯 Nova AI Workspace Controller
 * Purpose: Advanced workspace management for Nova AI holographic mode
 */

import { EventEmitter } from 'events';
import { HolographicModeManager } from './HolographicModeManager';

export interface WorkspaceConfig {
  id: string;
  name: string;
  type: 'dashboard' | 'task' | 'building' | 'analytics' | 'emergency' | 'custom';
  holographicMode: boolean;
  contextData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceState {
  activeWorkspace: string | null;
  workspaces: Map<string, WorkspaceConfig>;
  holographicMode: boolean;
  currentContext: string;
  isTransitioning: boolean;
}

export class WorkspaceController extends EventEmitter {
  private state: WorkspaceState;
  private holographicManager: HolographicModeManager;

  constructor(holographicManager: HolographicModeManager) {
    super();
    this.holographicManager = holographicManager;
    this.state = {
      activeWorkspace: null,
      workspaces: new Map(),
      holographicMode: false,
      currentContext: 'default',
      isTransitioning: false
    };

    this.initializeDefaultWorkspaces();
    this.setupEventListeners();
  }

  private initializeDefaultWorkspaces(): void {
    const defaultWorkspaces: WorkspaceConfig[] = [
      {
        id: 'worker-dashboard',
        name: 'Worker Dashboard',
        type: 'dashboard',
        holographicMode: true,
        contextData: { role: 'worker', view: 'main' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-analytics',
        name: 'Admin Analytics',
        type: 'analytics',
        holographicMode: true,
        contextData: { role: 'admin', view: 'analytics' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'client-portfolio',
        name: 'Client Portfolio',
        type: 'dashboard',
        holographicMode: true,
        contextData: { role: 'client', view: 'portfolio' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultWorkspaces.forEach(workspace => {
      this.state.workspaces.set(workspace.id, workspace);
    });
  }

  private setupEventListeners(): void {
    this.holographicManager.on('modeChanged', (mode: boolean) => {
      this.state.holographicMode = mode;
      this.emit('holographicModeChanged', mode);
    });
  }

  public async switchToWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.state.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    this.state.activeWorkspace = workspaceId;
    this.state.currentContext = workspace.contextData.role || 'default';
    
    this.emit('workspaceChanged', workspace);
  }

  public getWorkspace(workspaceId: string): WorkspaceConfig | undefined {
    return this.state.workspaces.get(workspaceId);
  }

  public getActiveWorkspace(): WorkspaceConfig | null {
    if (!this.state.activeWorkspace) return null;
    return this.state.workspaces.get(this.state.activeWorkspace) || null;
  }

  public getAllWorkspaces(): WorkspaceConfig[] {
    return Array.from(this.state.workspaces.values());
  }

  public getState(): WorkspaceState {
    return { ...this.state };
  }

  public destroy(): void {
    this.removeAllListeners();
    this.state.workspaces.clear();
  }
}