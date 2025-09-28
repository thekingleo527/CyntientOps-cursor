/**
 * ⛓️ Command Chain
 * Mirrors: CyntientOps/Services/CommandChains/CommandChain.swift
 * Purpose: Service orchestration and workflow management
 */

import { DatabaseManager } from '@cyntientops/database';
import { ClockInManager, LocationManager, NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { ServiceContainer } from '@cyntientops/business-core';

export interface Command {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface CommandChain {
  id: string;
  name: string;
  description: string;
  commands: Command[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export interface CommandExecutor {
  canExecute(command: Command): boolean;
  execute(command: Command): Promise<Command>;
  rollback?(command: Command): Promise<Command>;
}

export interface CommandChainConfig {
  maxConcurrentCommands: number;
  retryDelay: number;
  maxRetries: number;
  timeout: number;
  enableRollback: boolean;
}

export class CommandChainManager {
  private static instance: CommandChainManager;
  private databaseManager: DatabaseManager;
  private clockInManager: ClockInManager;
  private locationManager: LocationManager;
  private notificationManager: NotificationManager;
  private intelligenceService: IntelligenceService;
  private serviceContainer: ServiceContainer;
  
  private commandChains: Map<string, CommandChain> = new Map();
  private commands: Map<string, Command> = new Map();
  private executors: Map<string, CommandExecutor> = new Map();
  private runningChains: Set<string> = new Set();
  private config: CommandChainConfig;
  private isProcessing: boolean = false;

  private constructor(
    databaseManager: DatabaseManager,
    clockInManager: ClockInManager,
    locationManager: LocationManager,
    notificationManager: NotificationManager,
    intelligenceService: IntelligenceService,
    serviceContainer: ServiceContainer
  ) {
    this.databaseManager = databaseManager;
    this.clockInManager = clockInManager;
    this.locationManager = locationManager;
    this.notificationManager = notificationManager;
    this.intelligenceService = intelligenceService;
    this.serviceContainer = serviceContainer;
    
    this.config = {
      maxConcurrentCommands: 5,
      retryDelay: 1000,
      maxRetries: 3,
      timeout: 30000,
      enableRollback: true
    };
    
    this.initializeExecutors();
  }

  public static getInstance(
    databaseManager: DatabaseManager,
    clockInManager: ClockInManager,
    locationManager: LocationManager,
    notificationManager: NotificationManager,
    intelligenceService: IntelligenceService,
    serviceContainer: ServiceContainer
  ): CommandChainManager {
    if (!CommandChainManager.instance) {
      CommandChainManager.instance = new CommandChainManager(
        databaseManager,
        clockInManager,
        locationManager,
        notificationManager,
        intelligenceService,
        serviceContainer
      );
    }
    return CommandChainManager.instance;
  }

  /**
   * Initialize command executors
   */
  private initializeExecutors(): void {
    // Clock In Command Executor
    this.executors.set('clock_in', {
      canExecute: (command) => {
        return command.payload.workerId && command.payload.buildingId && command.payload.location;
      },
      execute: async (command) => {
        const result = await this.clockInManager.clockInWorker(command.payload);
        if (result.success) {
          command.status = 'completed';
          command.completedAt = new Date();
        } else {
          command.status = 'failed';
          command.error = result.validation.errors.join(', ');
        }
        return command;
      },
      rollback: async (command) => {
        // Rollback clock in by clocking out
        await this.clockInManager.clockOutWorker({
          workerId: command.payload.workerId,
          timestamp: new Date()
        });
        command.status = 'cancelled';
        return command;
      }
    });

    // Clock Out Command Executor
    this.executors.set('clock_out', {
      canExecute: (command) => {
        return command.payload.workerId;
      },
      execute: async (command) => {
        const result = await this.clockInManager.clockOutWorker(command.payload);
        if (result.success) {
          command.status = 'completed';
          command.completedAt = new Date();
        } else {
          command.status = 'failed';
          command.error = 'Clock out failed';
        }
        return command;
      }
    });

    // Location Update Command Executor
    this.executors.set('location_update', {
      canExecute: (command) => {
        return command.payload.workerId && command.payload.location;
      },
      execute: async (command) => {
        this.locationManager.updateLocation(command.payload);
        command.status = 'completed';
        command.completedAt = new Date();
        return command;
      }
    });

    // Notification Command Executor
    this.executors.set('send_notification', {
      canExecute: (command) => {
        return command.payload.title && command.payload.body && command.payload.targetUserId;
      },
      execute: async (command) => {
        const notificationId = await this.notificationManager.sendNotification(command.payload);
        command.status = 'completed';
        command.completedAt = new Date();
        command.metadata.notificationId = notificationId;
        return command;
      }
    });

    // Task Update Command Executor
    this.executors.set('update_task', {
      canExecute: (command) => {
        return command.payload.taskId && command.payload.status;
      },
      execute: async (command) => {
        const success = this.databaseManager.updateTaskStatus(
          command.payload.taskId,
          command.payload.status
        );
        if (success) {
          command.status = 'completed';
          command.completedAt = new Date();
        } else {
          command.status = 'failed';
          command.error = 'Task update failed';
        }
        return command;
      }
    });

    // Intelligence Report Command Executor
    this.executors.set('generate_intelligence_report', {
      canExecute: (command) => {
        return command.payload.type;
      },
      execute: async (command) => {
        const report = await this.intelligenceService.generateIntelligenceReport(command.payload.type);
        command.status = 'completed';
        command.completedAt = new Date();
        command.metadata.reportId = report.id;
        return command;
      }
    });
  }

  /**
   * Create a new command chain
   */
  public createCommandChain(
    name: string,
    description: string,
    commands: Omit<Command, 'id' | 'status' | 'createdAt' | 'retryCount'>[],
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): CommandChain {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chainCommands = commands.map(cmd => ({
      ...cmd,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending' as const,
      createdAt: new Date(),
      retryCount: 0
    }));

    const commandChain: CommandChain = {
      id: chainId,
      name,
      description,
      commands: chainCommands,
      status: 'pending',
      priority,
      createdAt: new Date(),
      metadata: {}
    };

    this.commandChains.set(chainId, commandChain);
    chainCommands.forEach(cmd => this.commands.set(cmd.id, cmd));

    console.log(`Created command chain: ${chainId} with ${chainCommands.length} commands`);
    return commandChain;
  }

  /**
   * Execute a command chain
   */
  public async executeCommandChain(chainId: string): Promise<CommandChain> {
    const chain = this.commandChains.get(chainId);
    if (!chain) {
      throw new Error(`Command chain not found: ${chainId}`);
    }

    if (chain.status !== 'pending') {
      throw new Error(`Command chain is not in pending status: ${chain.status}`);
    }

    this.runningChains.add(chainId);
    chain.status = 'running';
    chain.startedAt = new Date();

    try {
      await this.executeCommands(chain);
      chain.status = 'completed';
      chain.completedAt = new Date();
    } catch (error) {
      chain.status = 'failed';
      chain.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.config.enableRollback) {
        await this.rollbackChain(chain);
      }
    } finally {
      this.runningChains.delete(chainId);
    }

    return chain;
  }

  /**
   * Execute commands in a chain
   */
  private async executeCommands(chain: CommandChain): Promise<void> {
    const pendingCommands = chain.commands.filter(cmd => cmd.status === 'pending');
    const runningCommands = new Set<string>();
    
    while (pendingCommands.length > 0 || runningCommands.size > 0) {
      // Start new commands if we have capacity
      while (runningCommands.size < this.config.maxConcurrentCommands && pendingCommands.length > 0) {
        const command = this.getNextExecutableCommand(pendingCommands, runningCommands);
        if (command) {
          runningCommands.add(command.id);
          this.executeCommand(command).then(() => {
            runningCommands.delete(command.id);
          }).catch(() => {
            runningCommands.delete(command.id);
          });
        } else {
          break; // No more executable commands
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if any commands failed
    const failedCommands = chain.commands.filter(cmd => cmd.status === 'failed');
    if (failedCommands.length > 0) {
      throw new Error(`Chain failed: ${failedCommands.length} commands failed`);
    }
  }

  /**
   * Get next executable command
   */
  private getNextExecutableCommand(
    pendingCommands: Command[],
    runningCommands: Set<string>
  ): Command | null {
    for (let i = 0; i < pendingCommands.length; i++) {
      const command = pendingCommands[i];
      
      // Check if dependencies are met
      const dependenciesMet = command.dependencies.every(depId => {
        const depCommand = this.commands.get(depId);
        return depCommand && depCommand.status === 'completed';
      });

      if (dependenciesMet) {
        const executor = this.executors.get(command.type);
        if (executor && executor.canExecute(command)) {
          pendingCommands.splice(i, 1);
          return command;
        }
      }
    }
    
    return null;
  }

  /**
   * Execute a single command
   */
  private async executeCommand(command: Command): Promise<void> {
    const executor = this.executors.get(command.type);
    if (!executor) {
      command.status = 'failed';
      command.error = `No executor found for command type: ${command.type}`;
      return;
    }

    command.status = 'running';
    command.startedAt = new Date();

    try {
      const updatedCommand = await Promise.race([
        executor.execute(command),
        new Promise<Command>((_, reject) => 
          setTimeout(() => reject(new Error('Command timeout')), this.config.timeout)
        )
      ]);

      this.commands.set(command.id, updatedCommand);
    } catch (error) {
      command.status = 'failed';
      command.error = error instanceof Error ? error.message : 'Unknown error';
      command.retryCount++;

      if (command.retryCount < command.maxRetries) {
        // Retry after delay
        setTimeout(() => {
          command.status = 'pending';
          this.executeCommand(command);
        }, this.config.retryDelay * command.retryCount);
      }
    }
  }

  /**
   * Rollback a command chain
   */
  private async rollbackChain(chain: CommandChain): Promise<void> {
    console.log(`Rolling back command chain: ${chain.id}`);
    
    // Rollback commands in reverse order
    const completedCommands = chain.commands
      .filter(cmd => cmd.status === 'completed')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

    for (const command of completedCommands) {
      const executor = this.executors.get(command.type);
      if (executor && executor.rollback) {
        try {
          await executor.rollback(command);
          this.commands.set(command.id, command);
        } catch (error) {
          console.error(`Failed to rollback command ${command.id}:`, error);
        }
      }
    }
  }

  /**
   * Cancel a command chain
   */
  public async cancelCommandChain(chainId: string): Promise<boolean> {
    const chain = this.commandChains.get(chainId);
    if (!chain) return false;

    if (chain.status === 'running') {
      // Cancel running commands
      const runningCommands = chain.commands.filter(cmd => cmd.status === 'running');
      for (const command of runningCommands) {
        command.status = 'cancelled';
        this.commands.set(command.id, command);
      }
    }

    chain.status = 'cancelled';
    this.runningChains.delete(chainId);
    return true;
  }

  /**
   * Get command chain status
   */
  public getCommandChainStatus(chainId: string): CommandChain | null {
    return this.commandChains.get(chainId) || null;
  }

  /**
   * Get all command chains
   */
  public getAllCommandChains(): CommandChain[] {
    return Array.from(this.commandChains.values());
  }

  /**
   * Get command chains by status
   */
  public getCommandChainsByStatus(status: string): CommandChain[] {
    return Array.from(this.commandChains.values()).filter(chain => chain.status === status);
  }

  /**
   * Get command status
   */
  public getCommandStatus(commandId: string): Command | null {
    return this.commands.get(commandId) || null;
  }

  /**
   * Update command chain configuration
   */
  public updateConfig(config: Partial<CommandChainConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register a custom command executor
   */
  public registerExecutor(type: string, executor: CommandExecutor): void {
    this.executors.set(type, executor);
  }

  /**
   * Get command chain statistics
   */
  public getStatistics(): {
    totalChains: number;
    runningChains: number;
    completedChains: number;
    failedChains: number;
    totalCommands: number;
    runningCommands: number;
    completedCommands: number;
    failedCommands: number;
  } {
    const chains = Array.from(this.commandChains.values());
    const commands = Array.from(this.commands.values());

    return {
      totalChains: chains.length,
      runningChains: chains.filter(c => c.status === 'running').length,
      completedChains: chains.filter(c => c.status === 'completed').length,
      failedChains: chains.filter(c => c.status === 'failed').length,
      totalCommands: commands.length,
      runningCommands: commands.filter(c => c.status === 'running').length,
      completedCommands: commands.filter(c => c.status === 'completed').length,
      failedCommands: commands.filter(c => c.status === 'failed').length
    };
  }

  /**
   * Clean up old command chains
   */
  public cleanupOldChains(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let removedCount = 0;
    this.commandChains.forEach((chain, chainId) => {
      if (chain.createdAt < cutoffDate && chain.status !== 'running') {
        // Remove commands
        chain.commands.forEach(cmd => this.commands.delete(cmd.id));
        // Remove chain
        this.commandChains.delete(chainId);
        removedCount++;
      }
    });

    console.log(`Cleaned up ${removedCount} old command chains`);
    return removedCount;
  }
}
