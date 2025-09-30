/**
 * 🔀 Context Switching Logic
 * Purpose: Intelligent context switching and management across different user roles and scenarios
 * 
 * Features:
 * - Smart context switching algorithms
 * - Context state preservation and restoration
 * - Seamless role transitions
 * - Context conflict resolution
 * - Performance optimization for context switches
 */

import { EventEmitter } from 'events';

export type UserRole = 'admin' | 'client' | 'worker';
export type ContextType = 'admin' | 'client' | 'worker';
export type SwitchTrigger = 'user-initiated' | 'system-suggested' | 'automatic' | 'emergency' | 'scheduled';
export type SwitchStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export interface ContextSwitch {
  id: string;
  fromContext: ContextInfo;
  toContext: ContextInfo;
  trigger: SwitchTrigger;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: SwitchStatus;
  timestamp: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  metadata: SwitchMetadata;
}

export interface ContextInfo {
  role: UserRole;
  contextId: string;
  contextType: ContextType;
  userId: string;
  sessionId: string;
  state: ContextState;
  data: any;
}

export interface ContextState {
  isActive: boolean;
  lastAccessed: Date;
  accessCount: number;
  isDirty: boolean;
  hasUnsavedChanges: boolean;
  memoryUsage: number;
  performance: ContextPerformance;
}

export interface ContextPerformance {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  throughput: number;
}

export interface SwitchMetadata {
  userPreferences: UserPreferences;
  systemState: SystemState;
  switchHistory: string[];
  conflictResolution: ConflictResolution[];
  optimizationApplied: Optimization[];
  qualityScore: number;
}

export interface UserPreferences {
  autoSwitch: boolean;
  switchDelay: number; // milliseconds
  preserveState: boolean;
  showNotifications: boolean;
  preferredContexts: UserRole[];
  switchTriggers: SwitchTrigger[];
}

export interface SystemState {
  systemLoad: number;
  memoryAvailable: number;
  networkLatency: number;
  emergencyMode: boolean;
  maintenanceMode: boolean;
  activeUsers: number;
}

export interface ConflictResolution {
  type: 'data-conflict' | 'permission-conflict' | 'resource-conflict' | 'state-conflict';
  description: string;
  resolution: 'merge' | 'overwrite' | 'preserve' | 'prompt-user' | 'auto-resolve';
  applied: boolean;
  timestamp: Date;
}

export interface Optimization {
  type: 'memory' | 'performance' | 'network' | 'ui' | 'data';
  description: string;
  impact: number;
  applied: boolean;
  timestamp: Date;
}

export interface ContextSwitchRule {
  id: string;
  name: string;
  description: string;
  conditions: SwitchCondition[];
  actions: SwitchAction[];
  priority: number;
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: Date;
}

export interface SwitchCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'exists';
  value: any;
  description: string;
}

export interface SwitchAction {
  type: 'switch' | 'suggest' | 'preserve' | 'optimize' | 'notify';
  target: string;
  parameters: Record<string, any>;
  description: string;
}

export interface ContextSwitchState {
  activeSwitches: Map<string, ContextSwitch>;
  switchHistory: ContextSwitch[];
  switchRules: ContextSwitchRule[];
  currentContext: ContextInfo | null;
  pendingSwitches: ContextSwitch[];
  isProcessing: boolean;
  lastUpdate: Date;
}

export class ContextSwitchingLogic extends EventEmitter {
  private state: ContextSwitchState;
  private switchProcessor: NodeJS.Timeout | null = null;
  private performanceMonitor: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.state = {
      activeSwitches: new Map(),
      switchHistory: [],
      switchRules: [],
      currentContext: null,
      pendingSwitches: [],
      isProcessing: false,
      lastUpdate: new Date()
    };

    this.initializeSwitchRules();
    this.startSwitchProcessor();
    this.startPerformanceMonitor();
    this.setupEventListeners();
  }

  /**
   * Initialize default switch rules
   */
  private initializeSwitchRules(): void {
    // Emergency context switch rule
    this.addSwitchRule({
      id: 'emergency-switch',
      name: 'Emergency Context Switch',
      description: 'Automatically switch to emergency context when critical alerts are detected',
      conditions: [
        {
          field: 'systemState.emergencyMode',
          operator: 'equals',
          value: true,
          description: 'System is in emergency mode'
        }
      ],
      actions: [
        {
          type: 'switch',
          target: 'emergency-context',
          parameters: { immediate: true, preserveState: false },
          description: 'Switch to emergency context immediately'
        }
      ],
      priority: 1,
      isActive: true,
      triggerCount: 0
    });

    // Role-based context suggestion rule
    this.addSwitchRule({
      id: 'role-suggestion',
      name: 'Role-based Context Suggestion',
      description: 'Suggest context switches based on user role and current activity',
      conditions: [
        {
          field: 'currentContext.role',
          operator: 'not-equals',
          value: 'admin',
          description: 'Current context is not admin'
        },
        {
          field: 'userActivity.type',
          operator: 'equals',
          value: 'analytics',
          description: 'User is accessing analytics features'
        }
      ],
      actions: [
        {
          type: 'suggest',
          target: 'admin-analytics-context',
          parameters: { reason: 'analytics-access' },
          description: 'Suggest switching to admin analytics context'
        }
      ],
      priority: 5,
      isActive: true,
      triggerCount: 0
    });

    // Performance-based context switch rule
    this.addSwitchRule({
      id: 'performance-switch',
      name: 'Performance-based Context Switch',
      description: 'Switch context when performance degrades significantly',
      conditions: [
        {
          field: 'currentContext.performance.responseTime',
          operator: 'greater-than',
          value: 5000,
          description: 'Response time exceeds 5 seconds'
        }
      ],
      actions: [
        {
          type: 'optimize',
          target: 'current-context',
          parameters: { optimization: 'performance' },
          description: 'Optimize current context performance'
        }
      ],
      priority: 3,
      isActive: true,
      triggerCount: 0
    });

    // Scheduled context switch rule
    this.addSwitchRule({
      id: 'scheduled-switch',
      name: 'Scheduled Context Switch',
      description: 'Switch context based on time-based schedules',
      conditions: [
        {
          field: 'systemState.timeOfDay',
          operator: 'equals',
          value: 'business-hours',
          description: 'During business hours'
        }
      ],
      actions: [
        {
          type: 'switch',
          target: 'business-context',
          parameters: { schedule: 'business-hours' },
          description: 'Switch to business context during business hours'
        }
      ],
      priority: 7,
      isActive: true,
      triggerCount: 0
    });
  }

  /**
   * Add a switch rule
   */
  private addSwitchRule(rule: ContextSwitchRule): void {
    this.state.switchRules.push(rule);
    this.emit('switchRuleAdded', rule);
  }

  /**
   * Start switch processor
   */
  private startSwitchProcessor(): void {
    this.switchProcessor = setInterval(() => {
      this.processPendingSwitches();
    }, 1000); // Process every second
  }

  /**
   * Stop switch processor
   */
  private stopSwitchProcessor(): void {
    if (this.switchProcessor) {
      clearInterval(this.switchProcessor);
      this.switchProcessor = null;
    }
  }

  /**
   * Start performance monitor
   */
  private startPerformanceMonitor(): void {
    this.performanceMonitor = setInterval(() => {
      this.monitorContextPerformance();
    }, 5000); // Monitor every 5 seconds
  }

  /**
   * Stop performance monitor
   */
  private stopPerformanceMonitor(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('contextSwitchRequested', this.handleContextSwitchRequest.bind(this));
    this.on('contextSwitchCompleted', this.handleContextSwitchCompleted.bind(this));
    this.on('contextSwitchFailed', this.handleContextSwitchFailed.bind(this));
  }

  /**
   * Handle context switch request
   */
  private handleContextSwitchRequest(switchRequest: ContextSwitch): void {
    // Validate switch request
    if (this.validateSwitchRequest(switchRequest)) {
      this.state.pendingSwitches.push(switchRequest);
      this.emit('switchRequestQueued', switchRequest);
    } else {
      this.emit('switchRequestRejected', switchRequest);
    }
  }

  /**
   * Handle context switch completed
   */
  private handleContextSwitchCompleted(switchRequest: ContextSwitch): void {
    // Update switch history
    this.state.switchHistory.push(switchRequest);
    
    // Limit history size
    if (this.state.switchHistory.length > 1000) {
      this.state.switchHistory = this.state.switchHistory.slice(-500);
    }

    // Update current context
    this.state.currentContext = switchRequest.toContext;
    
    this.emit('contextSwitched', switchRequest);
  }

  /**
   * Handle context switch failed
   */
  private handleContextSwitchFailed(switchRequest: ContextSwitch): void {
    this.emit('contextSwitchError', switchRequest);
  }

  /**
   * Validate switch request
   */
  private validateSwitchRequest(switchRequest: ContextSwitch): boolean {
    // Check if switch is already in progress
    if (this.state.isProcessing) {
      return false;
    }

    // Check if target context is valid
    if (!switchRequest.toContext || !switchRequest.toContext.contextId) {
      return false;
    }

    // Check for conflicts
    if (this.hasConflicts(switchRequest)) {
      return false;
    }

    return true;
  }

  /**
   * Check for conflicts
   */
  private hasConflicts(switchRequest: ContextSwitch): boolean {
    // Check if target context is already active
    if (this.state.currentContext?.contextId === switchRequest.toContext.contextId) {
      return true;
    }

    // Check for resource conflicts
    if (this.hasResourceConflicts(switchRequest)) {
      return true;
    }

    return false;
  }

  /**
   * Check for resource conflicts
   */
  private hasResourceConflicts(switchRequest: ContextSwitch): boolean {
    // Simple implementation - in real system, this would check for actual resource conflicts
    return false;
  }

  /**
   * Process pending switches
   */
  private processPendingSwitches(): void {
    if (this.state.pendingSwitches.length === 0) return;

    this.state.isProcessing = true;

    const switchRequest = this.state.pendingSwitches.shift();
    if (!switchRequest) {
      this.state.isProcessing = false;
      return;
    }

    this.executeContextSwitch(switchRequest).then(() => {
      this.state.isProcessing = false;
    }).catch(error => {
      this.emit('contextSwitchError', { switchRequest, error });
      this.state.isProcessing = false;
    });
  }

  /**
   * Execute context switch
   */
  private async executeContextSwitch(switchRequest: ContextSwitch): Promise<void> {
    try {
      switchRequest.status = 'in-progress';
      switchRequest.startedAt = new Date();
      this.state.activeSwitches.set(switchRequest.id, switchRequest);

      this.emit('contextSwitchStarted', switchRequest);

      // Preserve current context state
      if (switchRequest.metadata.userPreferences.preserveState) {
        await this.preserveContextState(switchRequest.fromContext);
      }

      // Resolve conflicts
      await this.resolveConflicts(switchRequest);

      // Apply optimizations
      await this.applyOptimizations(switchRequest);

      // Perform the actual switch
      await this.performContextSwitch(switchRequest);

      // Update switch status
      switchRequest.status = 'completed';
      switchRequest.completedAt = new Date();
      switchRequest.duration = switchRequest.completedAt.getTime() - switchRequest.startedAt.getTime();

      this.state.activeSwitches.delete(switchRequest.id);
      this.emit('contextSwitchCompleted', switchRequest);

    } catch (error) {
      switchRequest.status = 'failed';
      this.state.activeSwitches.delete(switchRequest.id);
      this.emit('contextSwitchFailed', { switchRequest, error });
      throw error;
    }
  }

  /**
   * Preserve context state
   */
  private async preserveContextState(context: ContextInfo): Promise<void> {
    // Implementation for preserving context state
    this.emit('contextStatePreserved', context);
  }

  /**
   * Resolve conflicts
   */
  private async resolveConflicts(switchRequest: ContextSwitch): Promise<void> {
    const conflicts = this.detectConflicts(switchRequest);
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, switchRequest);
      switchRequest.metadata.conflictResolution.push(resolution);
    }
  }

  /**
   * Detect conflicts
   */
  private detectConflicts(switchRequest: ContextSwitch): ConflictResolution[] {
    const conflicts: ConflictResolution[] = [];

    // Check for data conflicts
    if (this.hasDataConflicts(switchRequest)) {
      conflicts.push({
        type: 'data-conflict',
        description: 'Data conflicts detected between contexts',
        resolution: 'merge',
        applied: false,
        timestamp: new Date()
      });
    }

    // Check for permission conflicts
    if (this.hasPermissionConflicts(switchRequest)) {
      conflicts.push({
        type: 'permission-conflict',
        description: 'Permission conflicts detected',
        resolution: 'prompt-user',
        applied: false,
        timestamp: new Date()
      });
    }

    return conflicts;
  }

  /**
   * Check for data conflicts
   */
  private hasDataConflicts(switchRequest: ContextSwitch): boolean {
    // Simple implementation - in real system, this would check for actual data conflicts
    return false;
  }

  /**
   * Check for permission conflicts
   */
  private hasPermissionConflicts(switchRequest: ContextSwitch): boolean {
    // Simple implementation - in real system, this would check for actual permission conflicts
    return false;
  }

  /**
   * Resolve a single conflict
   */
  private async resolveConflict(conflict: ConflictResolution, switchRequest: ContextSwitch): Promise<ConflictResolution> {
    // Apply conflict resolution strategy
    switch (conflict.resolution) {
      case 'merge':
        await this.mergeContextData(switchRequest);
        break;
      case 'overwrite':
        await this.overwriteContextData(switchRequest);
        break;
      case 'preserve':
        await this.preserveContextData(switchRequest);
        break;
      case 'prompt-user':
        await this.promptUserForResolution(switchRequest, conflict);
        break;
      case 'auto-resolve':
        await this.autoResolveConflict(switchRequest, conflict);
        break;
    }

    conflict.applied = true;
    return conflict;
  }

  /**
   * Merge context data
   */
  private async mergeContextData(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for merging context data
    this.emit('contextDataMerged', switchRequest);
  }

  /**
   * Overwrite context data
   */
  private async overwriteContextData(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for overwriting context data
    this.emit('contextDataOverwritten', switchRequest);
  }

  /**
   * Preserve context data
   */
  private async preserveContextData(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for preserving context data
    this.emit('contextDataPreserved', switchRequest);
  }

  /**
   * Prompt user for resolution
   */
  private async promptUserForResolution(switchRequest: ContextSwitch, conflict: ConflictResolution): Promise<void> {
    // Implementation for prompting user
    this.emit('userPromptedForResolution', { switchRequest, conflict });
  }

  /**
   * Auto-resolve conflict
   */
  private async autoResolveConflict(switchRequest: ContextSwitch, conflict: ConflictResolution): Promise<void> {
    // Implementation for auto-resolving conflicts
    this.emit('conflictAutoResolved', { switchRequest, conflict });
  }

  /**
   * Apply optimizations
   */
  private async applyOptimizations(switchRequest: ContextSwitch): Promise<void> {
    const optimizations = this.getOptimizations(switchRequest);
    
    for (const optimization of optimizations) {
      await this.applyOptimization(optimization, switchRequest);
      switchRequest.metadata.optimizationApplied.push(optimization);
    }
  }

  /**
   * Get optimizations for switch
   */
  private getOptimizations(switchRequest: ContextSwitch): Optimization[] {
    const optimizations: Optimization[] = [];

    // Memory optimization
    if (switchRequest.toContext.state.memoryUsage > 100) {
      optimizations.push({
        type: 'memory',
        description: 'Optimize memory usage for target context',
        impact: 0.3,
        applied: false,
        timestamp: new Date()
      });
    }

    // Performance optimization
    if (switchRequest.toContext.state.performance.responseTime > 1000) {
      optimizations.push({
        type: 'performance',
        description: 'Optimize performance for target context',
        impact: 0.4,
        applied: false,
        timestamp: new Date()
      });
    }

    return optimizations;
  }

  /**
   * Apply a single optimization
   */
  private async applyOptimization(optimization: Optimization, switchRequest: ContextSwitch): Promise<void> {
    // Apply optimization based on type
    switch (optimization.type) {
      case 'memory':
        await this.optimizeMemory(switchRequest);
        break;
      case 'performance':
        await this.optimizePerformance(switchRequest);
        break;
      case 'network':
        await this.optimizeNetwork(switchRequest);
        break;
      case 'ui':
        await this.optimizeUI(switchRequest);
        break;
      case 'data':
        await this.optimizeData(switchRequest);
        break;
    }

    optimization.applied = true;
  }

  /**
   * Optimize memory
   */
  private async optimizeMemory(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for memory optimization
    this.emit('memoryOptimized', switchRequest);
  }

  /**
   * Optimize performance
   */
  private async optimizePerformance(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for performance optimization
    this.emit('performanceOptimized', switchRequest);
  }

  /**
   * Optimize network
   */
  private async optimizeNetwork(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for network optimization
    this.emit('networkOptimized', switchRequest);
  }

  /**
   * Optimize UI
   */
  private async optimizeUI(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for UI optimization
    this.emit('uiOptimized', switchRequest);
  }

  /**
   * Optimize data
   */
  private async optimizeData(switchRequest: ContextSwitch): Promise<void> {
    // Implementation for data optimization
    this.emit('dataOptimized', switchRequest);
  }

  /**
   * Perform the actual context switch
   */
  private async performContextSwitch(switchRequest: ContextSwitch): Promise<void> {
    // Simulate context switch
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update context state
    switchRequest.toContext.state.isActive = true;
    switchRequest.toContext.state.lastAccessed = new Date();
    switchRequest.toContext.state.accessCount++;

    if (switchRequest.fromContext) {
      switchRequest.fromContext.state.isActive = false;
    }

    this.emit('contextSwitchPerformed', switchRequest);
  }

  /**
   * Monitor context performance
   */
  private monitorContextPerformance(): void {
    if (!this.state.currentContext) return;

    // Update performance metrics
    this.state.currentContext.state.performance = {
      responseTime: Math.random() * 100 + 50,
      memoryUsage: Math.random() * 50 + 10,
      cpuUsage: Math.random() * 20 + 5,
      errorRate: Math.random() * 2,
      throughput: Math.random() * 100 + 50
    };

    // Check for performance-based switches
    this.evaluateSwitchRules(this.state.currentContext);
  }

  /**
   * Evaluate switch rules
   */
  private evaluateSwitchRules(currentContext: ContextInfo): void {
    for (const rule of this.state.switchRules) {
      if (!rule.isActive) continue;

      if (this.evaluateRuleConditions(rule, currentContext)) {
        this.executeRuleActions(rule, currentContext);
        rule.lastTriggered = new Date();
        rule.triggerCount++;
        this.emit('switchRuleTriggered', { rule, currentContext });
      }
    }
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(rule: ContextSwitchRule, currentContext: ContextInfo): boolean {
    return rule.conditions.every(condition => {
      const fieldValue = this.getFieldValue(currentContext, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  /**
   * Get field value from context
   */
  private getFieldValue(context: ContextInfo, field: string): any {
    const fieldMap: Record<string, any> = {
      'role': context.role,
      'contextId': context.contextId,
      'state.isActive': context.state.isActive,
      'state.memoryUsage': context.state.memoryUsage,
      'performance.responseTime': context.state.performance.responseTime,
      'performance.memoryUsage': context.state.performance.memoryUsage,
      'performance.cpuUsage': context.state.performance.cpuUsage,
      'performance.errorRate': context.state.performance.errorRate,
      'performance.throughput': context.state.performance.throughput
    };

    return fieldMap[field];
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not-equals':
        return fieldValue !== expectedValue;
      case 'greater-than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less-than':
        return Number(fieldValue) < Number(expectedValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  /**
   * Execute rule actions
   */
  private executeRuleActions(rule: ContextSwitchRule, currentContext: ContextInfo): void {
    for (const action of rule.actions) {
      this.executeAction(action, currentContext);
    }
  }

  /**
   * Execute a single action
   */
  private executeAction(action: SwitchAction, currentContext: ContextInfo): void {
    switch (action.type) {
      case 'switch':
        this.requestContextSwitch(currentContext, action.target, action.parameters);
        break;
      case 'suggest':
        this.suggestContextSwitch(currentContext, action.target, action.parameters);
        break;
      case 'preserve':
        this.preserveContext(currentContext, action.parameters);
        break;
      case 'optimize':
        this.optimizeContext(currentContext, action.parameters);
        break;
      case 'notify':
        this.notifyUser(currentContext, action.parameters);
        break;
    }
  }

  /**
   * Request context switch
   */
  private requestContextSwitch(currentContext: ContextInfo, target: string, parameters: Record<string, any>): void {
    // Implementation for requesting context switch
    this.emit('contextSwitchRequested', { currentContext, target, parameters });
  }

  /**
   * Suggest context switch
   */
  private suggestContextSwitch(currentContext: ContextInfo, target: string, parameters: Record<string, any>): void {
    // Implementation for suggesting context switch
    this.emit('contextSwitchSuggested', { currentContext, target, parameters });
  }

  /**
   * Preserve context
   */
  private preserveContext(currentContext: ContextInfo, parameters: Record<string, any>): void {
    // Implementation for preserving context
    this.emit('contextPreserved', { currentContext, parameters });
  }

  /**
   * Optimize context
   */
  private optimizeContext(currentContext: ContextInfo, parameters: Record<string, any>): void {
    // Implementation for optimizing context
    this.emit('contextOptimized', { currentContext, parameters });
  }

  /**
   * Notify user
   */
  private notifyUser(currentContext: ContextInfo, parameters: Record<string, any>): void {
    // Implementation for notifying user
    this.emit('userNotified', { currentContext, parameters });
  }

  /**
   * Request a context switch
   */
  public async requestContextSwitch(
    fromContext: ContextInfo,
    toContext: ContextInfo,
    trigger: SwitchTrigger,
    reason: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    const contextSwitch: ContextSwitch = {
      id: `switch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromContext,
      toContext,
      trigger,
      reason,
      priority,
      status: 'pending',
      timestamp: new Date(),
      metadata: {
        userPreferences: {
          autoSwitch: true,
          switchDelay: 0,
          preserveState: true,
          showNotifications: true,
          preferredContexts: ['admin', 'client', 'worker'],
          switchTriggers: ['user-initiated', 'system-suggested']
        },
        systemState: {
          systemLoad: 0.5,
          memoryAvailable: 1024,
          networkLatency: 50,
          emergencyMode: false,
          maintenanceMode: false,
          activeUsers: 10
        },
        switchHistory: [],
        conflictResolution: [],
        optimizationApplied: [],
        qualityScore: 0
      }
    };

    this.emit('contextSwitchRequested', contextSwitch);
    return contextSwitch.id;
  }

  /**
   * Get current context
   */
  public getCurrentContext(): ContextInfo | null {
    return this.state.currentContext;
  }

  /**
   * Get active switches
   */
  public getActiveSwitches(): ContextSwitch[] {
    return Array.from(this.state.activeSwitches.values());
  }

  /**
   * Get switch history
   */
  public getSwitchHistory(limit?: number): ContextSwitch[] {
    if (limit) {
      return this.state.switchHistory.slice(-limit);
    }
    return [...this.state.switchHistory];
  }

  /**
   * Get switch rules
   */
  public getSwitchRules(): ContextSwitchRule[] {
    return [...this.state.switchRules];
  }

  /**
   * Get current state
   */
  public getState(): ContextSwitchState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopSwitchProcessor();
    this.stopPerformanceMonitor();
    this.removeAllListeners();
    this.state.activeSwitches.clear();
    this.state.switchHistory = [];
    this.state.switchRules = [];
    this.state.pendingSwitches = [];
  }
}
