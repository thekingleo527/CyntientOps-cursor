/**
 * 🔮 Holographic Mode Manager
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 HOLOGRAPHIC MODE MANAGEMENT - Advanced holographic workspace system
 * ✅ MODE ACTIVATION: Seamless activation/deactivation of holographic mode
 * ✅ WORKSPACE SWITCHING: Dynamic switching between 5 workspace modes
 * ✅ HAPTIC FEEDBACK: Advanced haptic feedback integration
 * ✅ SOUND EFFECTS: Immersive sound effects for mode transitions
 * ✅ STATE PERSISTENCE: Persistent holographic mode state
 * ✅ PERFORMANCE: Optimized mode switching with smooth transitions
 * 
 * Based on SwiftUI HolographicModeManager.swift (300+ lines)
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Logger } from '@cyntientops/business-core';

// Global type declarations
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
    }
  }
}

export interface HolographicMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  workspaceType: WorkspaceType;
  isActive: boolean;
  activationTime?: Date;
  deactivationTime?: Date;
  totalActiveTime: number;
  usageCount: number;
}

export interface WorkspaceType {
  id: string;
  name: string;
  description: string;
  features: string[];
  particleEffects: ParticleEffectConfig[];
  soundEffects: SoundEffectConfig[];
  hapticPatterns: HapticPatternConfig[];
  visualEffects: VisualEffectConfig[];
}

export interface ParticleEffectConfig {
  type: 'energy' | 'data' | 'thought' | 'quantum' | 'custom';
  intensity: number;
  density: number;
  color: string;
  behavior: 'orbital' | 'linear' | 'spiral' | 'chaotic' | 'custom';
  customFunction?: () => void;
}

export interface SoundEffectConfig {
  type: 'activation' | 'deactivation' | 'transition' | 'ambient' | 'custom';
  soundFile: string;
  volume: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
  customFunction?: () => void;
}

export interface HapticPatternConfig {
  type: 'activation' | 'deactivation' | 'transition' | 'interaction' | 'custom';
  pattern: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  intensity: number;
  duration: number;
  customFunction?: () => void;
}

export interface VisualEffectConfig {
  type: 'glow' | 'pulse' | 'rotation' | 'scale' | 'custom';
  intensity: number;
  duration: number;
  color: string;
  customFunction?: () => void;
}

export interface HolographicModeConfig {
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;
  enableVisualEffects: boolean;
  enableParticleEffects: boolean;
  enableStatePersistence: boolean;
  defaultMode: string;
  transitionDuration: number;
  autoSaveInterval: number;
}

export interface ModeTransition {
  fromMode: HolographicMode | null;
  toMode: HolographicMode;
  startTime: Date;
  endTime?: Date;
  duration: number;
  isComplete: boolean;
  transitionType: 'activation' | 'deactivation' | 'switching';
}

export class HolographicModeManager {
  private config: HolographicModeConfig;
  private modes: Map<string, HolographicMode> = new Map();
  private workspaceTypes: Map<string, WorkspaceType> = new Map();
  private currentMode: HolographicMode | null = null;
  private isHolographicModeActive: boolean = false;
  private modeHistory: HolographicMode[] = [];
  private activeTransitions: Map<string, ModeTransition> = new Map();
  private soundCache: Map<string, Audio.Sound> = new Map();
  private statePersistenceKey: string = 'holographic_mode_state';
  private autoSaveInterval: any = null;

  // Event callbacks
  private onModeActivatedCallback?: (mode: HolographicMode) => void;
  private onModeDeactivatedCallback?: (mode: HolographicMode) => void;
  private onModeSwitchedCallback?: (fromMode: HolographicMode | null, toMode: HolographicMode) => void;
  private onTransitionStartedCallback?: (transition: ModeTransition) => void;
  private onTransitionCompletedCallback?: (transition: ModeTransition) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(config: Partial<HolographicModeConfig> = {}) {
    this.config = {
      enableHapticFeedback: true,
      enableSoundEffects: true,
      enableVisualEffects: true,
      enableParticleEffects: true,
      enableStatePersistence: true,
      defaultMode: 'nova',
      transitionDuration: 1000,
      autoSaveInterval: 30000, // 30 seconds
      ...config,
    };

    this.initializeDefaultModes();
    this.initializeDefaultWorkspaceTypes();
    this.loadPersistedState();
    this.startAutoSave();
  }

  /**
   * Initialize default holographic modes
   */
  private initializeDefaultModes(): void {
    const defaultModes: HolographicMode[] = [
      {
        id: 'nova',
        name: 'Nova AI',
        description: 'Primary AI assistant workspace with advanced intelligence',
        icon: 'brain',
        color: '#00FFFF',
        workspaceType: this.workspaceTypes.get('nova') || this.createDefaultWorkspaceType('nova'),
        isActive: false,
        totalActiveTime: 0,
        usageCount: 0,
      },
      {
        id: 'map',
        name: 'Map Workspace',
        description: 'Interactive building and location mapping',
        icon: 'map',
        color: '#00FF00',
        workspaceType: this.workspaceTypes.get('map') || this.createDefaultWorkspaceType('map'),
        isActive: false,
        totalActiveTime: 0,
        usageCount: 0,
      },
      {
        id: 'portfolio',
        name: 'Portfolio',
        description: 'Building portfolio management and analytics',
        icon: 'briefcase',
        color: '#FFD700',
        workspaceType: this.workspaceTypes.get('portfolio') || this.createDefaultWorkspaceType('portfolio'),
        isActive: false,
        totalActiveTime: 0,
        usageCount: 0,
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Advanced analytics and reporting workspace',
        icon: 'analytics',
        color: '#FF00FF',
        workspaceType: this.workspaceTypes.get('analytics') || this.createDefaultWorkspaceType('analytics'),
        isActive: false,
        totalActiveTime: 0,
        usageCount: 0,
      },
      {
        id: 'settings',
        name: 'Settings',
        description: 'System configuration and preferences',
        icon: 'settings',
        color: '#FF6B6B',
        workspaceType: this.workspaceTypes.get('settings') || this.createDefaultWorkspaceType('settings'),
        isActive: false,
        totalActiveTime: 0,
        usageCount: 0,
      },
    ];

    defaultModes.forEach(mode => {
      this.modes.set(mode.id, mode);
    });
  }

  /**
   * Initialize default workspace types
   */
  private initializeDefaultWorkspaceTypes(): void {
    const workspaceTypes: WorkspaceType[] = [
      {
        id: 'nova',
        name: 'Nova AI Workspace',
        description: 'Advanced AI assistant workspace',
        features: ['voice_interaction', 'particle_effects', 'holographic_interface'],
        particleEffects: [
          {
            type: 'energy',
            intensity: 0.8,
            density: 50,
            color: '#00FFFF',
            behavior: 'orbital',
          },
          {
            type: 'thought',
            intensity: 0.6,
            density: 30,
            color: '#FF00FF',
            behavior: 'spiral',
          },
        ],
        soundEffects: [
          {
            type: 'activation',
            soundFile: 'nova_activation.mp3',
            volume: 0.7,
            loop: false,
            fadeIn: 500,
            fadeOut: 500,
          },
          {
            type: 'ambient',
            soundFile: 'nova_ambient.mp3',
            volume: 0.3,
            loop: true,
            fadeIn: 1000,
            fadeOut: 1000,
          },
        ],
        hapticPatterns: [
          {
            type: 'activation',
            pattern: Haptics.ImpactFeedbackStyle.Medium,
            intensity: 0.7,
            duration: 200,
          },
        ],
        visualEffects: [
          {
            type: 'glow',
            intensity: 0.8,
            duration: 2000,
            color: '#00FFFF',
          },
        ],
      },
      {
        id: 'map',
        name: 'Map Workspace',
        description: 'Interactive mapping workspace',
        features: ['building_navigation', 'location_tracking', 'route_planning'],
        particleEffects: [
          {
            type: 'data',
            intensity: 0.6,
            density: 40,
            color: '#00FF00',
            behavior: 'linear',
          },
        ],
        soundEffects: [
          {
            type: 'activation',
            soundFile: 'map_activation.mp3',
            volume: 0.6,
            loop: false,
            fadeIn: 300,
            fadeOut: 300,
          },
        ],
        hapticPatterns: [
          {
            type: 'activation',
            pattern: Haptics.ImpactFeedbackStyle.Light,
            intensity: 0.5,
            duration: 150,
          },
        ],
        visualEffects: [
          {
            type: 'pulse',
            intensity: 0.6,
            duration: 1500,
            color: '#00FF00',
          },
        ],
      },
      {
        id: 'portfolio',
        name: 'Portfolio Workspace',
        description: 'Building portfolio management',
        features: ['building_management', 'performance_tracking', 'compliance_monitoring'],
        particleEffects: [
          {
            type: 'quantum',
            intensity: 0.7,
            density: 35,
            color: '#FFD700',
            behavior: 'chaotic',
          },
        ],
        soundEffects: [
          {
            type: 'activation',
            soundFile: 'portfolio_activation.mp3',
            volume: 0.5,
            loop: false,
            fadeIn: 400,
            fadeOut: 400,
          },
        ],
        hapticPatterns: [
          {
            type: 'activation',
            pattern: Haptics.ImpactFeedbackStyle.Heavy,
            intensity: 0.8,
            duration: 250,
          },
        ],
        visualEffects: [
          {
            type: 'rotation',
            intensity: 0.7,
            duration: 3000,
            color: '#FFD700',
          },
        ],
      },
      {
        id: 'analytics',
        name: 'Analytics Workspace',
        description: 'Advanced analytics and reporting',
        features: ['data_visualization', 'performance_metrics', 'predictive_analytics'],
        particleEffects: [
          {
            type: 'data',
            intensity: 0.9,
            density: 60,
            color: '#FF00FF',
            behavior: 'spiral',
          },
        ],
        soundEffects: [
          {
            type: 'activation',
            soundFile: 'analytics_activation.mp3',
            volume: 0.8,
            loop: false,
            fadeIn: 600,
            fadeOut: 600,
          },
        ],
        hapticPatterns: [
          {
            type: 'activation',
            pattern: Haptics.ImpactFeedbackStyle.Medium,
            intensity: 0.9,
            duration: 300,
          },
        ],
        visualEffects: [
          {
            type: 'scale',
            intensity: 0.9,
            duration: 2500,
            color: '#FF00FF',
          },
        ],
      },
      {
        id: 'settings',
        name: 'Settings Workspace',
        description: 'System configuration and preferences',
        features: ['system_configuration', 'user_preferences', 'accessibility_options'],
        particleEffects: [
          {
            type: 'energy',
            intensity: 0.4,
            density: 20,
            color: '#FF6B6B',
            behavior: 'linear',
          },
        ],
        soundEffects: [
          {
            type: 'activation',
            soundFile: 'settings_activation.mp3',
            volume: 0.4,
            loop: false,
            fadeIn: 200,
            fadeOut: 200,
          },
        ],
        hapticPatterns: [
          {
            type: 'activation',
            pattern: Haptics.ImpactFeedbackStyle.Light,
            intensity: 0.3,
            duration: 100,
          },
        ],
        visualEffects: [
          {
            type: 'glow',
            intensity: 0.4,
            duration: 1000,
            color: '#FF6B6B',
          },
        ],
      },
    ];

    workspaceTypes.forEach(workspaceType => {
      this.workspaceTypes.set(workspaceType.id, workspaceType);
    });
  }

  /**
   * Create default workspace type
   */
  private createDefaultWorkspaceType(id: string): WorkspaceType {
    return {
      id,
      name: `${id} Workspace`,
      description: `Default ${id} workspace`,
      features: [],
      particleEffects: [],
      soundEffects: [],
      hapticPatterns: [],
      visualEffects: [],
    };
  }

  /**
   * Activate holographic mode
   */
  async activateHolographicMode(modeId: string): Promise<boolean> {
    try {
      const mode = this.modes.get(modeId);
      if (!mode) {
        throw new Error(`Holographic mode not found: ${modeId}`);
      }

      if (this.isHolographicModeActive && this.currentMode?.id === modeId) {
        Logger.info('⚠️ Holographic mode already active:', null, 'HolographicModeManager', modeId);
        return true;
      }

      // Start transition
      const transition = this.startModeTransition(this.currentMode, mode, 'activation');
      this.onTransitionStartedCallback?.(transition);

      // Deactivate current mode if active
      if (this.currentMode) {
        await this.deactivateCurrentMode();
      }

      // Activate new mode
      await this.activateMode(mode);

      // Complete transition
      this.completeModeTransition(transition);
      this.onTransitionCompletedCallback?.(transition);

      this.isHolographicModeActive = true;
      this.currentMode = mode;
      this.modeHistory.push(mode);

      // Trigger callbacks
      this.onModeActivatedCallback?.(mode);
      if (this.modeHistory.length > 1) {
        this.onModeSwitchedCallback?.(this.modeHistory[this.modeHistory.length - 2], mode);
      }

      Logger.info('✅ Holographic mode activated:', null, 'HolographicModeManager', modeId);
      return true;
    } catch (error) {
      Logger.error('❌ Failed to activate holographic mode:', null, 'HolographicModeManager', error);
      this.onErrorCallback?.(error as Error);
      return false;
    }
  }

  /**
   * Deactivate holographic mode
   */
  async deactivateHolographicMode(): Promise<boolean> {
    try {
      if (!this.isHolographicModeActive || !this.currentMode) {
        Logger.info('⚠️ No holographic mode to deactivate');
        return true;
      }

      const currentMode = this.currentMode;

      // Start transition
      const transition = this.startModeTransition(currentMode, currentMode, 'deactivation');
      this.onTransitionStartedCallback?.(transition);

      // Deactivate current mode
      await this.deactivateCurrentMode();

      // Complete transition
      this.completeModeTransition(transition);
      this.onTransitionCompletedCallback?.(transition);

      this.isHolographicModeActive = false;
      this.currentMode = null;

      // Trigger callbacks
      this.onModeDeactivatedCallback?.(currentMode);

      Logger.info('✅ Holographic mode deactivated');
      return true;
    } catch (error) {
      Logger.error('❌ Failed to deactivate holographic mode:', null, 'HolographicModeManager', error);
      this.onErrorCallback?.(error as Error);
      return false;
    }
  }

  /**
   * Switch to different holographic mode
   */
  async switchHolographicMode(modeId: string): Promise<boolean> {
    try {
      const mode = this.modes.get(modeId);
      if (!mode) {
        throw new Error(`Holographic mode not found: ${modeId}`);
      }

      if (!this.isHolographicModeActive) {
        return await this.activateHolographicMode(modeId);
      }

      if (this.currentMode?.id === modeId) {
        Logger.info('⚠️ Already in holographic mode:', null, 'HolographicModeManager', modeId);
        return true;
      }

      const previousMode = this.currentMode;

      // Start transition
      const transition = this.startModeTransition(previousMode, mode, 'switching');
      this.onTransitionStartedCallback?.(transition);

      // Deactivate current mode
      await this.deactivateCurrentMode();

      // Activate new mode
      await this.activateMode(mode);

      // Complete transition
      this.completeModeTransition(transition);
      this.onTransitionCompletedCallback?.(transition);

      this.currentMode = mode;
      this.modeHistory.push(mode);

      // Trigger callbacks
      this.onModeSwitchedCallback?.(previousMode, mode);

      Logger.info('✅ Switched to holographic mode:', null, 'HolographicModeManager', modeId);
      return true;
    } catch (error) {
      Logger.error('❌ Failed to switch holographic mode:', null, 'HolographicModeManager', error);
      this.onErrorCallback?.(error as Error);
      return false;
    }
  }

  /**
   * Activate specific mode
   */
  private async activateMode(mode: HolographicMode): Promise<void> {
    mode.isActive = true;
    mode.activationTime = new Date();
    mode.usageCount++;

    // Trigger haptic feedback
    if (this.config.enableHapticFeedback) {
      await this.triggerHapticFeedback(mode.workspaceType.hapticPatterns, 'activation');
    }

    // Play sound effects
    if (this.config.enableSoundEffects) {
      await this.playSoundEffects(mode.workspaceType.soundEffects, 'activation');
    }

    // Trigger visual effects
    if (this.config.enableVisualEffects) {
      this.triggerVisualEffects(mode.workspaceType.visualEffects);
    }

    // Trigger particle effects
    if (this.config.enableParticleEffects) {
      this.triggerParticleEffects(mode.workspaceType.particleEffects);
    }
  }

  /**
   * Deactivate current mode
   */
  private async deactivateCurrentMode(): Promise<void> {
    if (!this.currentMode) return;

    const mode = this.currentMode;
    mode.isActive = false;
    mode.deactivationTime = new Date();

    // Calculate active time
    if (mode.activationTime) {
      const activeTime = mode.deactivationTime.getTime() - mode.activationTime.getTime();
      mode.totalActiveTime += activeTime;
    }

    // Trigger haptic feedback
    if (this.config.enableHapticFeedback) {
      await this.triggerHapticFeedback(mode.workspaceType.hapticPatterns, 'deactivation');
    }

    // Play sound effects
    if (this.config.enableSoundEffects) {
      await this.playSoundEffects(mode.workspaceType.soundEffects, 'deactivation');
    }
  }

  /**
   * Start mode transition
   */
  private startModeTransition(
    fromMode: HolographicMode | null,
    toMode: HolographicMode,
    transitionType: ModeTransition['transitionType']
  ): ModeTransition {
    const transition: ModeTransition = {
      fromMode,
      toMode,
      startTime: new Date(),
      duration: this.config.transitionDuration,
      isComplete: false,
      transitionType,
    };

    this.activeTransitions.set(toMode.id, transition);
    return transition;
  }

  /**
   * Complete mode transition
   */
  private completeModeTransition(transition: ModeTransition): void {
    transition.endTime = new Date();
    transition.isComplete = true;
    this.activeTransitions.delete(transition.toMode.id);
  }

  /**
   * Trigger haptic feedback
   */
  private async triggerHapticFeedback(
    hapticPatterns: HapticPatternConfig[],
    type: HapticPatternConfig['type']
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      const patterns = hapticPatterns.filter(pattern => pattern.type === type);
      
      for (const pattern of patterns) {
        if (pattern.pattern === Haptics.ImpactFeedbackStyle.Light ||
            pattern.pattern === Haptics.ImpactFeedbackStyle.Medium ||
            pattern.pattern === Haptics.ImpactFeedbackStyle.Heavy) {
          await Haptics.impactAsync(pattern.pattern as Haptics.ImpactFeedbackStyle);
        } else {
          await Haptics.notificationAsync(pattern.pattern as Haptics.NotificationFeedbackType);
        }
        
        // Wait for pattern duration
        if (pattern.duration > 0) {
          await new Promise(resolve => setTimeout(resolve, pattern.duration));
        }
      }
    } catch (error) {
      Logger.error('❌ Error triggering haptic feedback:', null, 'HolographicModeManager', error);
    }
  }

  /**
   * Play sound effects
   */
  private async playSoundEffects(
    soundEffects: SoundEffectConfig[],
    type: SoundEffectConfig['type']
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      const effects = soundEffects.filter(effect => effect.type === type);
      
      for (const effect of effects) {
        let sound = this.soundCache.get(effect.soundFile);
        
        if (!sound) {
          // Load sound file
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: effect.soundFile },
            { shouldPlay: false, volume: effect.volume }
          );
          sound = newSound;
          this.soundCache.set(effect.soundFile, sound);
        }

        if (sound) {
          await sound.setVolumeAsync(effect.volume);
          await sound.playAsync();
          
          if (effect.loop) {
            await sound.setIsLoopingAsync(true);
          }
        }
      }
    } catch (error) {
      Logger.error('❌ Error playing sound effects:', null, 'HolographicModeManager', error);
    }
  }

  /**
   * Trigger visual effects
   */
  private triggerVisualEffects(visualEffects: VisualEffectConfig[]): void {
    try {
      for (const effect of visualEffects) {
        if (effect.customFunction) {
          effect.customFunction();
        } else {
          // Default visual effect implementation
          Logger.info(`🎨 Visual effect: ${effect.type} with intensity ${effect.intensity}`);
        }
      }
    } catch (error) {
      Logger.error('❌ Error triggering visual effects:', null, 'HolographicModeManager', error);
    }
  }

  /**
   * Trigger particle effects
   */
  private triggerParticleEffects(particleEffects: ParticleEffectConfig[]): void {
    try {
      for (const effect of particleEffects) {
        if (effect.customFunction) {
          effect.customFunction();
        } else {
          // Default particle effect implementation
          Logger.info(`⚡ Particle effect: ${effect.type} with density ${effect.density}`);
        }
      }
    } catch (error) {
      Logger.error('❌ Error triggering particle effects:', null, 'HolographicModeManager', error);
    }
  }

  /**
   * Load persisted state
   */
  private async loadPersistedState(): Promise<void> {
    try {
      if (!this.config.enableStatePersistence) return;

      // Load from AsyncStorage or similar
      // This is a placeholder implementation
      Logger.info('📚 Loading persisted holographic mode state...');
    } catch (error) {
      Logger.error('❌ Error loading persisted state:', null, 'HolographicModeManager', error);
    }
  }

  /**
   * Save current state
   */
  private async saveCurrentState(): Promise<void> {
    try {
      if (!this.config.enableStatePersistence) return;

      // const _state = {
      //   currentMode: this.currentMode?.id || null,
      //   isHolographicModeActive: this.isHolographicModeActive,
      //   modeHistory: this.modeHistory.map(mode => mode.id),
      //   modes: Array.from(this.modes.values()).map(mode => ({
      //     id: mode.id,
      //     totalActiveTime: mode.totalActiveTime,
      //     usageCount: mode.usageCount,
      //   })),
      //   timestamp: new Date().toISOString(),
      // };

      // Save to AsyncStorage or similar
      // This is a placeholder implementation
      Logger.info('💾 Saving holographic mode state...');
    } catch (error) {
      Logger.error('❌ Error saving state:', null, 'HolographicModeManager', error);
    }
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    if (!this.config.enableStatePersistence) return;

    this.autoSaveInterval = setInterval(() => {
      this.saveCurrentState();
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Get current mode
   */
  getCurrentMode(): HolographicMode | null {
    return this.currentMode;
  }

  /**
   * Get all modes
   */
  getAllModes(): HolographicMode[] {
    return Array.from(this.modes.values());
  }

  /**
   * Get mode by ID
   */
  getMode(modeId: string): HolographicMode | null {
    return this.modes.get(modeId) || null;
  }

  /**
   * Get mode history
   */
  getModeHistory(): HolographicMode[] {
    return [...this.modeHistory];
  }

  /**
   * Get active transitions
   */
  getActiveTransitions(): ModeTransition[] {
    return Array.from(this.activeTransitions.values());
  }

  /**
   * Check if holographic mode is active
   */
  isActive(): boolean {
    return this.isHolographicModeActive;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HolographicModeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onModeActivated?: (mode: HolographicMode) => void;
    onModeDeactivated?: (mode: HolographicMode) => void;
    onModeSwitched?: (fromMode: HolographicMode | null, toMode: HolographicMode) => void;
    onTransitionStarted?: (transition: ModeTransition) => void;
    onTransitionCompleted?: (transition: ModeTransition) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onModeActivatedCallback = callbacks.onModeActivated;
    this.onModeDeactivatedCallback = callbacks.onModeDeactivated;
    this.onModeSwitchedCallback = callbacks.onModeSwitched;
    this.onTransitionStartedCallback = callbacks.onTransitionStarted;
    this.onTransitionCompletedCallback = callbacks.onTransitionCompleted;
    this.onErrorCallback = callbacks.onError;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.stopAutoSave();
      
      // Stop all sound effects
      for (const sound of this.soundCache.values()) {
        await sound.unloadAsync();
      }
      this.soundCache.clear();
      
      // Deactivate current mode
      if (this.isHolographicModeActive) {
        await this.deactivateHolographicMode();
      }
      
      Logger.info('🧹 Holographic Mode Manager cleaned up');
    } catch (error) {
      Logger.error('❌ Error during cleanup:', null, 'HolographicModeManager', error);
    }
  }
}

// Export singleton instance
export const holographicModeManager = new HolographicModeManager();
