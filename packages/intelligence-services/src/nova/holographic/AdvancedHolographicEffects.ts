/**
 * ✨ Nova AI Advanced Holographic Effects
 * Purpose: Advanced visual effects and animations for holographic mode
 */

import { EventEmitter } from '@cyntientops/business-core/src/utils/EventEmitter';

// Global type declarations
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
    }
  }
}

export interface HolographicEffect {
  id: string;
  type: 'glow' | 'particle' | 'wave' | 'pulse' | 'shimmer' | 'ripple' | 'beam' | 'field';
  intensity: number;
  duration: number;
  color: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  animation: EffectAnimation;
  physics: EffectPhysics;
  metadata?: Record<string, any>;
}

export interface EffectAnimation {
  type: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'custom';
  speed: number;
  direction: 'forward' | 'backward' | 'ping-pong' | 'random';
  loop: boolean;
  delay: number;
  customCurve?: number[];
}

export interface EffectPhysics {
  gravity: number;
  friction: number;
  bounce: number;
  mass: number;
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
}

export interface EffectLayer {
  id: string;
  name: string;
  effects: HolographicEffect[];
  opacity: number;
  blendMode: 'normal' | 'add' | 'multiply' | 'screen' | 'overlay';
  visible: boolean;
  zIndex: number;
}

export interface HolographicScene {
  id: string;
  name: string;
  layers: EffectLayer[];
  lighting: SceneLighting;
  camera: SceneCamera;
  environment: SceneEnvironment;
  duration: number;
  loop: boolean;
}

export interface SceneLighting {
  ambient: { intensity: number; color: string };
  directional: { intensity: number; color: string; direction: { x: number; y: number; z: number } };
  point: { intensity: number; color: string; position: { x: number; y: number; z: number } };
  spot: { intensity: number; color: string; position: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; angle: number };
}

export interface SceneCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
  projection: 'perspective' | 'orthographic';
}

export interface SceneEnvironment {
  fog: { enabled: boolean; density: number; color: string };
  particles: { enabled: boolean; density: number; size: number; color: string };
  reflections: { enabled: boolean; intensity: number };
  shadows: { enabled: boolean; quality: 'low' | 'medium' | 'high' };
}

export interface EffectState {
  activeEffects: Map<string, HolographicEffect>;
  activeScenes: Map<string, HolographicScene>;
  isRendering: boolean;
  frameRate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  performance: {
    fps: number;
    memoryUsage: number;
    gpuUsage: number;
  };
}

export class AdvancedHolographicEffects extends EventEmitter {
  private state: EffectState;
  private renderLoop: any = null;
  private effectPresets: Map<string, HolographicEffect> = new Map();
  private scenePresets: Map<string, HolographicScene> = new Map();

  constructor() {
    super();
    this.state = {
      activeEffects: new Map(),
      activeScenes: new Map(),
      isRendering: false,
      frameRate: 60,
      quality: 'high',
      performance: {
        fps: 60,
        memoryUsage: 0,
        gpuUsage: 0
      }
    };

    this.initializeEffectPresets();
    this.initializeScenePresets();
    this.startRenderLoop();
  }

  /**
   * Initialize predefined effect presets
   */
  private initializeEffectPresets(): void {
    // Nova AI Glow Effect
    this.effectPresets.set('nova-glow', {
      id: 'nova-glow',
      type: 'glow',
      intensity: 0.8,
      duration: 2000,
      color: '#3B82F6',
      position: { x: 0, y: 0, z: 0 },
      size: { width: 100, height: 100, depth: 50 },
      animation: {
        type: 'ease-in-out',
        speed: 1.0,
        direction: 'ping-pong',
        loop: true,
        delay: 0
      },
      physics: {
        gravity: 0,
        friction: 0.1,
        bounce: 0.2,
        mass: 1.0,
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 }
      }
    });

    // Energy Field Effect
    this.effectPresets.set('energy-field', {
      id: 'energy-field',
      type: 'field',
      intensity: 0.9,
      duration: 5000,
      color: '#10B981',
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 200, depth: 100 },
      animation: {
        type: 'linear',
        speed: 0.5,
        direction: 'forward',
        loop: true,
        delay: 0
      },
      physics: {
        gravity: -0.1,
        friction: 0.05,
        bounce: 0.1,
        mass: 0.5,
        velocity: { x: 0, y: 0.1, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 }
      }
    });

    // Particle System Effect
    this.effectPresets.set('particle-system', {
      id: 'particle-system',
      type: 'particle',
      intensity: 1.0,
      duration: 3000,
      color: '#8B5CF6',
      position: { x: 0, y: 0, z: 0 },
      size: { width: 150, height: 150, depth: 75 },
      animation: {
        type: 'bounce',
        speed: 1.5,
        direction: 'random',
        loop: true,
        delay: 0
      },
      physics: {
        gravity: 0.2,
        friction: 0.2,
        bounce: 0.8,
        mass: 0.1,
        velocity: { x: 0.1, y: 0.1, z: 0.1 },
        acceleration: { x: 0, y: -0.1, z: 0 }
      }
    });

    // Pulse Effect
    this.effectPresets.set('pulse', {
      id: 'pulse',
      type: 'pulse',
      intensity: 0.7,
      duration: 1000,
      color: '#EF4444',
      position: { x: 0, y: 0, z: 0 },
      size: { width: 80, height: 80, depth: 40 },
      animation: {
        type: 'ease-out',
        speed: 2.0,
        direction: 'forward',
        loop: true,
        delay: 0
      },
      physics: {
        gravity: 0,
        friction: 0,
        bounce: 0,
        mass: 1.0,
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 }
      }
    });
  }

  /**
   * Initialize predefined scene presets
   */
  private initializeScenePresets(): void {
    // Worker Dashboard Scene
    this.scenePresets.set('worker-dashboard', {
      id: 'worker-dashboard',
      name: 'Worker Dashboard Scene',
      layers: [
        {
          id: 'background',
          name: 'Background Layer',
          effects: [],
          opacity: 0.3,
          blendMode: 'normal',
          visible: true,
          zIndex: 0
        },
        {
          id: 'ui-elements',
          name: 'UI Elements Layer',
          effects: [],
          opacity: 0.8,
          blendMode: 'normal',
          visible: true,
          zIndex: 1
        },
        {
          id: 'nova-effects',
          name: 'Nova AI Effects Layer',
          effects: [],
          opacity: 1.0,
          blendMode: 'add',
          visible: true,
          zIndex: 2
        }
      ],
      lighting: {
        ambient: { intensity: 0.3, color: '#3B82F6' },
        directional: { intensity: 0.7, color: '#FFFFFF', direction: { x: 0, y: -1, z: 0 } },
        point: { intensity: 0.5, color: '#10B981', position: { x: 0, y: 0, z: 50 } },
        spot: { intensity: 0.3, color: '#8B5CF6', position: { x: 0, y: 0, z: 100 }, direction: { x: 0, y: 0, z: -1 }, angle: 45 }
      },
      camera: {
        position: { x: 0, y: 0, z: 200 },
        target: { x: 0, y: 0, z: 0 },
        fov: 60,
        near: 0.1,
        far: 1000,
        projection: 'perspective'
      },
      environment: {
        fog: { enabled: true, density: 0.1, color: '#000000' },
        particles: { enabled: true, density: 0.5, size: 2, color: '#3B82F6' },
        reflections: { enabled: true, intensity: 0.3 },
        shadows: { enabled: true, quality: 'high' }
      },
      duration: 0,
      loop: true
    });

    // Emergency Response Scene
    this.scenePresets.set('emergency-response', {
      id: 'emergency-response',
      name: 'Emergency Response Scene',
      layers: [
        {
          id: 'alert-background',
          name: 'Alert Background Layer',
          effects: [],
          opacity: 0.8,
          blendMode: 'normal',
          visible: true,
          zIndex: 0
        },
        {
          id: 'emergency-effects',
          name: 'Emergency Effects Layer',
          effects: [],
          opacity: 1.0,
          blendMode: 'add',
          visible: true,
          zIndex: 1
        }
      ],
      lighting: {
        ambient: { intensity: 0.1, color: '#EF4444' },
        directional: { intensity: 0.9, color: '#FFFFFF', direction: { x: 0, y: -1, z: 0 } },
        point: { intensity: 0.8, color: '#F59E0B', position: { x: 0, y: 0, z: 50 } },
        spot: { intensity: 0.6, color: '#EF4444', position: { x: 0, y: 0, z: 100 }, direction: { x: 0, y: 0, z: -1 }, angle: 30 }
      },
      camera: {
        position: { x: 0, y: 0, z: 150 },
        target: { x: 0, y: 0, z: 0 },
        fov: 75,
        near: 0.1,
        far: 1000,
        projection: 'perspective'
      },
      environment: {
        fog: { enabled: true, density: 0.2, color: '#000000' },
        particles: { enabled: true, density: 0.8, size: 3, color: '#EF4444' },
        reflections: { enabled: true, intensity: 0.5 },
        shadows: { enabled: true, quality: 'high' }
      },
      duration: 0,
      loop: true
    });
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    if (this.renderLoop) return;

    this.state.isRendering = true;
    const frameTime = 1000 / this.state.frameRate;

    this.renderLoop = setInterval(() => {
      this.renderFrame();
    }, frameTime);

    this.emit('renderLoopStarted');
  }

  /**
   * Stop the render loop
   */
  private stopRenderLoop(): void {
    if (this.renderLoop) {
      clearInterval(this.renderLoop);
      this.renderLoop = null;
    }
    this.state.isRendering = false;
    this.emit('renderLoopStopped');
  }

  /**
   * Render a single frame
   */
  private renderFrame(): void {
    const startTime = performance.now();

    // Update active effects
    this.updateActiveEffects();

    // Update active scenes
    this.updateActiveScenes();

    // Calculate performance metrics
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    this.state.performance.fps = Math.round(1000 / frameTime);

    // Emit frame rendered event
    this.emit('frameRendered', {
      frameTime,
      fps: this.state.performance.fps,
      activeEffects: this.state.activeEffects.size,
      activeScenes: this.state.activeScenes.size
    });
  }

  /**
   * Update active effects
   */
  private updateActiveEffects(): void {
    const now = Date.now();
    const effectsToRemove: string[] = [];

    for (const [id, effect] of this.state.activeEffects) {
      // Update effect animation
      this.updateEffectAnimation(effect);

      // Update effect physics
      this.updateEffectPhysics(effect);

      // Check if effect should be removed
      if (now - effect.metadata?.startTime > effect.duration) {
        effectsToRemove.push(id);
      }
    }

    // Remove expired effects
    effectsToRemove.forEach(_id => {
      this.state.activeEffects.delete(_id);
      this.emit('effectExpired', _id);
    });
  }

  /**
   * Update active scenes
   */
  private updateActiveScenes(): void {
    for (const [, scene] of this.state.activeScenes) {
      // Update scene layers
      scene.layers.forEach(layer => {
        this.updateEffectLayer(layer);
      });

      // Update scene lighting
      this.updateSceneLighting(scene);

      // Update scene environment
      this.updateSceneEnvironment(scene);
    }
  }

  /**
   * Update effect animation
   */
  private updateEffectAnimation(effect: HolographicEffect): void {
    // Simulate animation update
    const progress = (Date.now() - (effect.metadata?.startTime || 0)) / effect.duration;
    
    // Apply animation curve
    const animatedValue = this.applyAnimationCurve(progress, effect.animation.type);
    
    // Update effect properties based on animation
    effect.intensity = effect.intensity * animatedValue;
    
    this.emit('effectUpdated', effect);
  }

  /**
   * Update effect physics
   */
  private updateEffectPhysics(effect: HolographicEffect): void {
    // Simulate physics update
    const deltaTime = 1 / 60; // Assume 60 FPS

    // Update velocity based on acceleration
    effect.physics.velocity.x += effect.physics.acceleration.x * deltaTime;
    effect.physics.velocity.y += effect.physics.acceleration.y * deltaTime;
    effect.physics.velocity.z += effect.physics.acceleration.z * deltaTime;

    // Apply gravity
    effect.physics.velocity.y += effect.physics.gravity * deltaTime;

    // Apply friction
    effect.physics.velocity.x *= (1 - effect.physics.friction);
    effect.physics.velocity.y *= (1 - effect.physics.friction);
    effect.physics.velocity.z *= (1 - effect.physics.friction);

    // Update position
    effect.position.x += effect.physics.velocity.x * deltaTime;
    effect.position.y += effect.physics.velocity.y * deltaTime;
    effect.position.z += effect.physics.velocity.z * deltaTime;
  }

  /**
   * Update effect layer
   */
  private updateEffectLayer(layer: EffectLayer): void {
    layer.effects.forEach(effect => {
      this.updateEffectAnimation(effect);
      this.updateEffectPhysics(effect);
    });
  }

  /**
   * Update scene lighting
   */
  private updateSceneLighting(scene: HolographicScene): void {
    // Simulate dynamic lighting updates
    this.emit('lightingUpdated', scene.lighting);
  }

  /**
   * Update scene environment
   */
  private updateSceneEnvironment(scene: HolographicScene): void {
    // Simulate environment updates
    this.emit('environmentUpdated', scene.environment);
  }

  /**
   * Apply animation curve
   */
  private applyAnimationCurve(progress: number, type: EffectAnimation['type']): number {
    switch (type) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        return this.bounceCurve(progress);
      case 'elastic':
        return this.elasticCurve(progress);
      default:
        return progress;
    }
  }

  /**
   * Bounce animation curve
   */
  private bounceCurve(progress: number): number {
    if (progress < 1 / 2.75) {
      return 7.5625 * progress * progress;
    } else if (progress < 2 / 2.75) {
      return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
    } else if (progress < 2.5 / 2.75) {
      return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
    } else {
      return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
    }
  }

  /**
   * Elastic animation curve
   */
  private elasticCurve(progress: number): number {
    if (progress === 0 || progress === 1) return progress;
    return Math.pow(2, -10 * progress) * Math.sin((progress - 0.1) * (2 * Math.PI) / 0.4) + 1;
  }

  /**
   * Create a new effect
   */
  public createEffect(config: Partial<HolographicEffect>): string {
    const effect: HolographicEffect = {
      id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'glow',
      intensity: 0.5,
      duration: 1000,
      color: '#3B82F6',
      position: { x: 0, y: 0, z: 0 },
      size: { width: 100, height: 100, depth: 50 },
      animation: {
        type: 'linear',
        speed: 1.0,
        direction: 'forward',
        loop: false,
        delay: 0
      },
      physics: {
        gravity: 0,
        friction: 0.1,
        bounce: 0.2,
        mass: 1.0,
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 }
      },
      metadata: { startTime: Date.now() },
      ...config
    };

    this.state.activeEffects.set(effect.id, effect);
    this.emit('effectCreated', effect);
    
    return effect.id;
  }

  /**
   * Remove an effect
   */
  public removeEffect(effectId: string): void {
    if (this.state.activeEffects.has(effectId)) {
      this.state.activeEffects.delete(effectId);
      this.emit('effectRemoved', effectId);
    }
  }

  /**
   * Apply effect preset
   */
  public applyEffectPreset(presetId: string, position?: { x: number; y: number; z: number }): string {
    const preset = this.effectPresets.get(presetId);
    if (!preset) {
      throw new Error(`Effect preset ${presetId} not found`);
    }

    const effect = { ...preset };
    if (position) {
      effect.position = position;
    }
    effect.metadata = { startTime: Date.now() };

    this.state.activeEffects.set(effect.id, effect);
    this.emit('effectPresetApplied', effect);
    
    return effect.id;
  }

  /**
   * Create a new scene
   */
  public createScene(config: Partial<HolographicScene>): string {
    const scene: HolographicScene = {
      id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Scene',
      layers: [],
      lighting: {
        ambient: { intensity: 0.3, color: '#3B82F6' },
        directional: { intensity: 0.7, color: '#FFFFFF', direction: { x: 0, y: -1, z: 0 } },
        point: { intensity: 0.5, color: '#10B981', position: { x: 0, y: 0, z: 50 } },
        spot: { intensity: 0.3, color: '#8B5CF6', position: { x: 0, y: 0, z: 100 }, direction: { x: 0, y: 0, z: -1 }, angle: 45 }
      },
      camera: {
        position: { x: 0, y: 0, z: 200 },
        target: { x: 0, y: 0, z: 0 },
        fov: 60,
        near: 0.1,
        far: 1000,
        projection: 'perspective'
      },
      environment: {
        fog: { enabled: false, density: 0, color: '#000000' },
        particles: { enabled: false, density: 0, size: 1, color: '#FFFFFF' },
        reflections: { enabled: false, intensity: 0 },
        shadows: { enabled: false, quality: 'low' }
      },
      duration: 0,
      loop: false,
      ...config
    };

    this.state.activeScenes.set(scene.id, scene);
    this.emit('sceneCreated', scene);
    
    return scene.id;
  }

  /**
   * Apply scene preset
   */
  public applyScenePreset(presetId: string): string {
    const preset = this.scenePresets.get(presetId);
    if (!preset) {
      throw new Error(`Scene preset ${presetId} not found`);
    }

    const scene = { ...preset };
    this.state.activeScenes.set(scene.id, scene);
    this.emit('scenePresetApplied', scene);
    
    return scene.id;
  }

  /**
   * Get effect preset
   */
  public getEffectPreset(presetId: string): HolographicEffect | undefined {
    return this.effectPresets.get(presetId);
  }

  /**
   * Get scene preset
   */
  public getScenePreset(presetId: string): HolographicScene | undefined {
    return this.scenePresets.get(presetId);
  }

  /**
   * Get current state
   */
  public getState(): EffectState {
    return { ...this.state };
  }

  /**
   * Update quality settings
   */
  public setQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.state.quality = quality;
    this.emit('qualityChanged', quality);
  }

  /**
   * Update frame rate
   */
  public setFrameRate(fps: number): void {
    this.state.frameRate = fps;
    this.stopRenderLoop();
    this.startRenderLoop();
    this.emit('frameRateChanged', fps);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopRenderLoop();
    this.removeAllListeners();
    this.state.activeEffects.clear();
    this.state.activeScenes.clear();
    this.effectPresets.clear();
    this.scenePresets.clear();
  }
}
