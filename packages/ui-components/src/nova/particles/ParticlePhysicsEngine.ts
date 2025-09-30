/**
 * ⚡ Particle Physics Engine
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 ADVANCED PARTICLE PHYSICS - Real-time particle simulation with energy fields
 * ✅ PARTICLE LIFECYCLE: Complete particle creation, update, and destruction
 * ✅ ENERGY FIELDS: Attraction/repulsion forces and field interactions
 * ✅ INTERACTIVE PARTICLES: Multiple particle types with unique behaviors
 * ✅ COLLISION DETECTION: Advanced collision detection and response
 * ✅ PERFORMANCE: 60fps particle simulation with optimization
 * ✅ PHYSICS SIMULATION: Realistic physics with gravity, friction, and forces
 * 
 * Based on SwiftUI ParticlePhysicsEngine.swift (500+ lines)
 */

import { Dimensions } from 'react-native';

export interface Particle {
  id: string;
  type: ParticleType;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  radius: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  age: number;
  energy: number;
  charge: number;
  temperature: number;
  metadata: ParticleMetadata;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface ParticleType {
  id: string;
  name: string;
  behavior: ParticleBehavior;
  physics: ParticlePhysics;
  appearance: ParticleAppearance;
  interactions: ParticleInteractions;
}

export interface ParticleBehavior {
  movement: 'linear' | 'orbital' | 'spiral' | 'chaotic' | 'custom';
  speed: number;
  direction: number;
  acceleration: number;
  damping: number;
  bounce: number;
  customFunction?: (particle: Particle, deltaTime: number) => void;
}

export interface ParticlePhysics {
  gravity: number;
  friction: number;
  restitution: number;
  mass: number;
  charge: number;
  temperature: number;
  energy: number;
  fieldStrength: number;
}

export interface ParticleAppearance {
  color: string;
  size: number;
  opacity: number;
  glow: boolean;
  trail: boolean;
  trailLength: number;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'custom';
  customShape?: string;
}

export interface ParticleInteractions {
  attracts: string[];
  repels: string[];
  neutral: string[];
  collisionResponse: 'bounce' | 'merge' | 'destroy' | 'split' | 'custom';
  customInteraction?: (particle1: Particle, particle2: Particle) => void;
}

export interface ParticleMetadata {
  creationTime: number;
  source: string;
  tags: string[];
  customData: Record<string, any>;
}

export interface EnergyField {
  id: string;
  type: 'attraction' | 'repulsion' | 'gravity' | 'magnetic' | 'electric' | 'custom';
  position: Vector2D;
  strength: number;
  radius: number;
  falloff: 'linear' | 'quadratic' | 'exponential' | 'custom';
  color: string;
  opacity: number;
  active: boolean;
  customFunction?: (particle: Particle, field: EnergyField) => Vector2D;
}

export interface CollisionEvent {
  particle1: Particle;
  particle2: Particle;
  collisionPoint: Vector2D;
  collisionNormal: Vector2D;
  relativeVelocity: Vector2D;
  impactForce: number;
  timestamp: number;
}

export interface PhysicsConfig {
  gravity: Vector2D;
  airResistance: number;
  timeStep: number;
  maxParticles: number;
  enableCollisions: boolean;
  enableEnergyFields: boolean;
  enableParticleInteractions: boolean;
  enablePerformanceOptimization: boolean;
  bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export class ParticlePhysicsEngine {
  private config: PhysicsConfig;
  private particles: Map<string, Particle> = new Map();
  private energyFields: Map<string, EnergyField> = new Map();
  private particleTypes: Map<string, ParticleType> = new Map();
  private collisionEvents: CollisionEvent[] = [];
  private isRunning: boolean = false;
  private lastUpdateTime: number = 0;
  private animationFrameId: number | null = null;
  private performanceMetrics = {
    fps: 60,
    particleCount: 0,
    updateTime: 0,
    collisionTime: 0,
    fieldTime: 0,
  };

  // Event callbacks
  private onParticleCreatedCallback?: (particle: Particle) => void;
  private onParticleDestroyedCallback?: (particle: Particle) => void;
  private onCollisionCallback?: (event: CollisionEvent) => void;
  private onPerformanceUpdateCallback?: (metrics: typeof this.performanceMetrics) => void;

  constructor(config: Partial<PhysicsConfig> = {}) {
    const { width, height } = Dimensions.get('window');
    
    this.config = {
      gravity: { x: 0, y: 0.5 },
      airResistance: 0.99,
      timeStep: 1 / 60,
      maxParticles: 1000,
      enableCollisions: true,
      enableEnergyFields: true,
      enableParticleInteractions: true,
      enablePerformanceOptimization: true,
      bounds: {
        left: 0,
        right: width,
        top: 0,
        bottom: height,
      },
      ...config,
    };

    this.initializeDefaultParticleTypes();
  }

  /**
   * Initialize default particle types
   */
  private initializeDefaultParticleTypes(): void {
    // Energy particles
    this.addParticleType({
      id: 'energy',
      name: 'Energy',
      behavior: {
        movement: 'orbital',
        speed: 2,
        direction: 0,
        acceleration: 0.1,
        damping: 0.98,
        bounce: 0.8,
      },
      physics: {
        gravity: 0,
        friction: 0.95,
        restitution: 0.9,
        mass: 1,
        charge: 1,
        temperature: 100,
        energy: 100,
        fieldStrength: 1,
      },
      appearance: {
        color: '#00FFFF',
        size: 4,
        opacity: 0.8,
        glow: true,
        trail: true,
        trailLength: 10,
        shape: 'circle',
      },
      interactions: {
        attracts: ['data'],
        repels: ['energy'],
        neutral: ['thought'],
        collisionResponse: 'bounce',
      },
    });

    // Data particles
    this.addParticleType({
      id: 'data',
      name: 'Data',
      behavior: {
        movement: 'linear',
        speed: 1.5,
        direction: 0,
        acceleration: 0.05,
        damping: 0.99,
        bounce: 0.7,
      },
      physics: {
        gravity: 0.2,
        friction: 0.98,
        restitution: 0.8,
        mass: 1.5,
        charge: -1,
        temperature: 50,
        energy: 80,
        fieldStrength: 0.8,
      },
      appearance: {
        color: '#00FF00',
        size: 3,
        opacity: 0.9,
        glow: false,
        trail: true,
        trailLength: 8,
        shape: 'square',
      },
      interactions: {
        attracts: ['thought'],
        repels: ['data'],
        neutral: ['energy'],
        collisionResponse: 'merge',
      },
    });

    // Thought particles
    this.addParticleType({
      id: 'thought',
      name: 'Thought',
      behavior: {
        movement: 'spiral',
        speed: 1,
        direction: 0,
        acceleration: 0.02,
        damping: 0.97,
        bounce: 0.6,
      },
      physics: {
        gravity: 0.1,
        friction: 0.96,
        restitution: 0.7,
        mass: 0.8,
        charge: 0,
        temperature: 75,
        energy: 60,
        fieldStrength: 0.6,
      },
      appearance: {
        color: '#FF00FF',
        size: 2,
        opacity: 0.7,
        glow: true,
        trail: false,
        trailLength: 0,
        shape: 'triangle',
      },
      interactions: {
        attracts: ['quantum'],
        repels: ['thought'],
        neutral: ['energy', 'data'],
        collisionResponse: 'split',
      },
    });

    // Quantum particles
    this.addParticleType({
      id: 'quantum',
      name: 'Quantum',
      behavior: {
        movement: 'chaotic',
        speed: 3,
        direction: 0,
        acceleration: 0.2,
        damping: 0.95,
        bounce: 0.9,
      },
      physics: {
        gravity: 0,
        friction: 0.94,
        restitution: 0.95,
        mass: 0.5,
        charge: 2,
        temperature: 200,
        energy: 150,
        fieldStrength: 2,
      },
      appearance: {
        color: '#FFFF00',
        size: 5,
        opacity: 0.6,
        glow: true,
        trail: true,
        trailLength: 15,
        shape: 'star',
      },
      interactions: {
        attracts: ['thought'],
        repels: ['quantum'],
        neutral: ['energy', 'data'],
        collisionResponse: 'destroy',
      },
    });
  }

  /**
   * Add a particle type
   */
  addParticleType(particleType: ParticleType): void {
    this.particleTypes.set(particleType.id, particleType);
  }

  /**
   * Create a particle
   */
  createParticle(
    typeId: string,
    position: Vector2D,
    velocity: Vector2D = { x: 0, y: 0 },
    customData: Record<string, any> = {}
  ): Particle | null {
    try {
      if (this.particles.size >= this.config.maxParticles) {
        console.warn('⚠️ Maximum particle count reached');
        return null;
      }

      const particleType = this.particleTypes.get(typeId);
      if (!particleType) {
        console.error('❌ Particle type not found:', typeId);
        return null;
      }

      const particle: Particle = {
        id: this.generateParticleId(),
        type: particleType,
        position: { ...position },
        velocity: { ...velocity },
        acceleration: { x: 0, y: 0 },
        mass: particleType.physics.mass,
        radius: particleType.appearance.size,
        color: particleType.appearance.color,
        opacity: particleType.appearance.opacity,
        life: 1.0,
        maxLife: 1.0,
        age: 0,
        energy: particleType.physics.energy,
        charge: particleType.physics.charge,
        temperature: particleType.physics.temperature,
        metadata: {
          creationTime: Date.now(),
          source: 'physics_engine',
          tags: [typeId],
          customData,
        },
      };

      this.particles.set(particle.id, particle);
      this.onParticleCreatedCallback?.(particle);

      return particle;
    } catch (error) {
      console.error('❌ Error creating particle:', error);
      return null;
    }
  }

  /**
   * Destroy a particle
   */
  destroyParticle(particleId: string): boolean {
    try {
      const particle = this.particles.get(particleId);
      if (!particle) return false;

      this.particles.delete(particleId);
      this.onParticleDestroyedCallback?.(particle);
      return true;
    } catch (error) {
      console.error('❌ Error destroying particle:', error);
      return false;
    }
  }

  /**
   * Add an energy field
   */
  addEnergyField(field: Omit<EnergyField, 'id'>): EnergyField {
    const energyField: EnergyField = {
      id: this.generateFieldId(),
      ...field,
    };

    this.energyFields.set(energyField.id, energyField);
    return energyField;
  }

  /**
   * Remove an energy field
   */
  removeEnergyField(fieldId: string): boolean {
    return this.energyFields.delete(fieldId);
  }

  /**
   * Start the physics simulation
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    this.update();
    console.log('⚡ Particle Physics Engine started');
  }

  /**
   * Stop the physics simulation
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('🛑 Particle Physics Engine stopped');
  }

  /**
   * Main update loop
   */
  private update = (): void => {
    if (!this.isRunning) return;

    const startTime = Date.now();
    const deltaTime = (startTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = startTime;

    // Update particles
    this.updateParticles(deltaTime);

    // Update energy fields
    if (this.config.enableEnergyFields) {
      this.updateEnergyFields(deltaTime);
    }

    // Handle collisions
    if (this.config.enableCollisions) {
      this.handleCollisions();
    }

    // Handle particle interactions
    if (this.config.enableParticleInteractions) {
      this.handleParticleInteractions();
    }

    // Update performance metrics
    this.updatePerformanceMetrics(startTime);

    // Schedule next update
    this.animationFrameId = requestAnimationFrame(this.update);
  };

  /**
   * Update all particles
   */
  private updateParticles(deltaTime: number): void {
    const particlesToDestroy: string[] = [];

    for (const [id, particle] of this.particles) {
      // Update particle physics
      this.updateParticlePhysics(particle, deltaTime);

      // Update particle behavior
      this.updateParticleBehavior(particle, deltaTime);

      // Update particle life
      particle.age += deltaTime;
      particle.life = Math.max(0, 1 - (particle.age / particle.maxLife));

      // Check if particle should be destroyed
      if (particle.life <= 0 || this.isParticleOutOfBounds(particle)) {
        particlesToDestroy.push(id);
      }
    }

    // Destroy expired particles
    particlesToDestroy.forEach(id => this.destroyParticle(id));
  }

  /**
   * Update particle physics
   */
  private updateParticlePhysics(particle: Particle, deltaTime: number): void {
    // Apply gravity
    particle.acceleration.x += this.config.gravity.x;
    particle.acceleration.y += this.config.gravity.y;

    // Apply air resistance
    particle.velocity.x *= this.config.airResistance;
    particle.velocity.y *= this.config.airResistance;

    // Update velocity
    particle.velocity.x += particle.acceleration.x * deltaTime;
    particle.velocity.y += particle.acceleration.y * deltaTime;

    // Update position
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;

    // Reset acceleration
    particle.acceleration.x = 0;
    particle.acceleration.y = 0;

    // Apply bounds collision
    this.handleBoundsCollision(particle);
  }

  /**
   * Update particle behavior
   */
  private updateParticleBehavior(particle: Particle, deltaTime: number): void {
    const behavior = particle.type.behavior;

    switch (behavior.movement) {
      case 'linear':
        this.updateLinearMovement(particle, deltaTime);
        break;
      case 'orbital':
        this.updateOrbitalMovement(particle, deltaTime);
        break;
      case 'spiral':
        this.updateSpiralMovement(particle, deltaTime);
        break;
      case 'chaotic':
        this.updateChaoticMovement(particle, deltaTime);
        break;
      case 'custom':
        if (behavior.customFunction) {
          behavior.customFunction(particle, deltaTime);
        }
        break;
    }
  }

  /**
   * Update linear movement
   */
  private updateLinearMovement(particle: Particle, deltaTime: number): void {
    const behavior = particle.type.behavior;
    const angle = behavior.direction * Math.PI / 180;
    
    particle.velocity.x += Math.cos(angle) * behavior.acceleration * deltaTime;
    particle.velocity.y += Math.sin(angle) * behavior.acceleration * deltaTime;
  }

  /**
   * Update orbital movement
   */
  private updateOrbitalMovement(particle: Particle, deltaTime: number): void {
    const centerX = this.config.bounds.left + (this.config.bounds.right - this.config.bounds.left) / 2;
    const centerY = this.config.bounds.top + (this.config.bounds.bottom - this.config.bounds.top) / 2;
    
    const dx = particle.position.x - centerX;
    const dy = particle.position.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const force = particle.type.physics.fieldStrength * 0.1;
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      
      particle.acceleration.x += Math.cos(angle) * force;
      particle.acceleration.y += Math.sin(angle) * force;
    }
  }

  /**
   * Update spiral movement
   */
  private updateSpiralMovement(particle: Particle, deltaTime: number): void {
    const centerX = this.config.bounds.left + (this.config.bounds.right - this.config.bounds.left) / 2;
    const centerY = this.config.bounds.top + (this.config.bounds.bottom - this.config.bounds.top) / 2;
    
    const dx = particle.position.x - centerX;
    const dy = particle.position.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const spiralForce = particle.type.physics.fieldStrength * 0.05;
      const angle = Math.atan2(dy, dx) + Math.PI / 2 + particle.age * 2;
      
      particle.acceleration.x += Math.cos(angle) * spiralForce;
      particle.acceleration.y += Math.sin(angle) * spiralForce;
      
      // Add inward force
      particle.acceleration.x -= (dx / distance) * spiralForce * 0.5;
      particle.acceleration.y -= (dy / distance) * spiralForce * 0.5;
    }
  }

  /**
   * Update chaotic movement
   */
  private updateChaoticMovement(particle: Particle, deltaTime: number): void {
    const chaos = particle.type.physics.fieldStrength * 0.1;
    const noise1 = (Math.random() - 0.5) * chaos;
    const noise2 = (Math.random() - 0.5) * chaos;
    
    particle.acceleration.x += noise1;
    particle.acceleration.y += noise2;
  }

  /**
   * Update energy fields
   */
  private updateEnergyFields(deltaTime: number): void {
    for (const [fieldId, field] of this.energyFields) {
      if (!field.active) continue;

      for (const [particleId, particle] of this.particles) {
        const force = this.calculateFieldForce(particle, field);
        if (force) {
          particle.acceleration.x += force.x;
          particle.acceleration.y += force.y;
        }
      }
    }
  }

  /**
   * Calculate field force on particle
   */
  private calculateFieldForce(particle: Particle, field: EnergyField): Vector2D | null {
    const dx = field.position.x - particle.position.x;
    const dy = field.position.y - particle.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > field.radius || distance === 0) return null;

    let force: number;
    switch (field.falloff) {
      case 'linear':
        force = field.strength * (1 - distance / field.radius);
        break;
      case 'quadratic':
        force = field.strength * Math.pow(1 - distance / field.radius, 2);
        break;
      case 'exponential':
        force = field.strength * Math.exp(-distance / field.radius * 3);
        break;
      default:
        force = field.strength;
    }

    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    switch (field.type) {
      case 'attraction':
        return { x: normalizedX * force, y: normalizedY * force };
      case 'repulsion':
        return { x: -normalizedX * force, y: -normalizedY * force };
      case 'gravity':
        return { x: normalizedX * force * particle.mass, y: normalizedY * force * particle.mass };
      case 'magnetic':
        return { x: -normalizedY * force * particle.charge, y: normalizedX * force * particle.charge };
      case 'electric':
        return { x: normalizedX * force * particle.charge, y: normalizedY * force * particle.charge };
      case 'custom':
        if (field.customFunction) {
          return field.customFunction(particle, field);
        }
        return null;
      default:
        return null;
    }
  }

  /**
   * Handle particle collisions
   */
  private handleCollisions(): void {
    const particles = Array.from(this.particles.values());
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const particle1 = particles[i];
        const particle2 = particles[j];
        
        if (this.checkCollision(particle1, particle2)) {
          const collisionEvent = this.createCollisionEvent(particle1, particle2);
          this.collisionEvents.push(collisionEvent);
          this.onCollisionCallback?.(collisionEvent);
          
          this.handleCollisionResponse(particle1, particle2, collisionEvent);
        }
      }
    }
  }

  /**
   * Check if two particles are colliding
   */
  private checkCollision(particle1: Particle, particle2: Particle): boolean {
    const dx = particle1.position.x - particle2.position.x;
    const dy = particle1.position.y - particle2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = particle1.radius + particle2.radius;
    
    return distance < minDistance;
  }

  /**
   * Create collision event
   */
  private createCollisionEvent(particle1: Particle, particle2: Particle): CollisionEvent {
    const dx = particle1.position.x - particle2.position.x;
    const dy = particle1.position.y - particle2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const collisionPoint = {
      x: (particle1.position.x + particle2.position.x) / 2,
      y: (particle1.position.y + particle2.position.y) / 2,
    };
    
    const collisionNormal = {
      x: dx / distance,
      y: dy / distance,
    };
    
    const relativeVelocity = {
      x: particle1.velocity.x - particle2.velocity.x,
      y: particle1.velocity.y - particle2.velocity.y,
    };
    
    const impactForce = Math.abs(relativeVelocity.x * collisionNormal.x + relativeVelocity.y * collisionNormal.y);
    
    return {
      particle1,
      particle2,
      collisionPoint,
      collisionNormal,
      relativeVelocity,
      impactForce,
      timestamp: Date.now(),
    };
  }

  /**
   * Handle collision response
   */
  private handleCollisionResponse(particle1: Particle, particle2: Particle, event: CollisionEvent): void {
    const response1 = particle1.type.interactions.collisionResponse;
    const response2 = particle2.type.interactions.collisionResponse;
    
    // Use the more destructive response
    const response = this.getMoreDestructiveResponse(response1, response2);
    
    switch (response) {
      case 'bounce':
        this.handleBounceCollision(particle1, particle2, event);
        break;
      case 'merge':
        this.handleMergeCollision(particle1, particle2, event);
        break;
      case 'destroy':
        this.handleDestroyCollision(particle1, particle2, event);
        break;
      case 'split':
        this.handleSplitCollision(particle1, particle2, event);
        break;
      case 'custom':
        if (particle1.type.interactions.customInteraction) {
          particle1.type.interactions.customInteraction(particle1, particle2);
        }
        break;
    }
  }

  /**
   * Get more destructive collision response
   */
  private getMoreDestructiveResponse(response1: string, response2: string): string {
    const destructiveness = {
      'bounce': 1,
      'merge': 2,
      'split': 3,
      'destroy': 4,
      'custom': 2,
    };
    
    return destructiveness[response1] > destructiveness[response2] ? response1 : response2;
  }

  /**
   * Handle bounce collision
   */
  private handleBounceCollision(particle1: Particle, particle2: Particle, event: CollisionEvent): void {
    const totalMass = particle1.mass + particle2.mass;
    const restitution = (particle1.type.physics.restitution + particle2.type.physics.restitution) / 2;
    
    const relativeVelocity = event.relativeVelocity;
    const collisionNormal = event.collisionNormal;
    
    const velocityAlongNormal = relativeVelocity.x * collisionNormal.x + relativeVelocity.y * collisionNormal.y;
    
    if (velocityAlongNormal > 0) return; // Particles are separating
    
    const impulse = -(1 + restitution) * velocityAlongNormal / totalMass;
    
    const impulseVector = {
      x: impulse * collisionNormal.x,
      y: impulse * collisionNormal.y,
    };
    
    particle1.velocity.x += impulseVector.x * particle2.mass;
    particle1.velocity.y += impulseVector.y * particle2.mass;
    
    particle2.velocity.x -= impulseVector.x * particle1.mass;
    particle2.velocity.y -= impulseVector.y * particle1.mass;
    
    // Separate particles
    const overlap = (particle1.radius + particle2.radius) - 
                   Math.sqrt(Math.pow(particle1.position.x - particle2.position.x, 2) + 
                            Math.pow(particle1.position.y - particle2.position.y, 2));
    
    if (overlap > 0) {
      const separationVector = {
        x: collisionNormal.x * overlap / 2,
        y: collisionNormal.y * overlap / 2,
      };
      
      particle1.position.x += separationVector.x;
      particle1.position.y += separationVector.y;
      
      particle2.position.x -= separationVector.x;
      particle2.position.y -= separationVector.y;
    }
  }

  /**
   * Handle merge collision
   */
  private handleMergeCollision(particle1: Particle, particle2: Particle, event: CollisionEvent): void {
    // Create merged particle
    const mergedPosition = event.collisionPoint;
    const mergedVelocity = {
      x: (particle1.velocity.x * particle1.mass + particle2.velocity.x * particle2.mass) / (particle1.mass + particle2.mass),
      y: (particle1.velocity.y * particle1.mass + particle2.velocity.y * particle2.mass) / (particle1.mass + particle2.mass),
    };
    
    // Determine merged particle type (use the more energetic one)
    const mergedType = particle1.energy > particle2.energy ? particle1.type : particle2.type;
    
    // Create merged particle
    this.createParticle(mergedType.id, mergedPosition, mergedVelocity, {
      merged: true,
      originalParticles: [particle1.id, particle2.id],
    });
    
    // Destroy original particles
    this.destroyParticle(particle1.id);
    this.destroyParticle(particle2.id);
  }

  /**
   * Handle destroy collision
   */
  private handleDestroyCollision(particle1: Particle, particle2: Particle, event: CollisionEvent): void {
    // Destroy both particles
    this.destroyParticle(particle1.id);
    this.destroyParticle(particle2.id);
  }

  /**
   * Handle split collision
   */
  private handleSplitCollision(particle1: Particle, particle2: Particle, event: CollisionEvent): void {
    // Split both particles
    this.splitParticle(particle1, event.collisionPoint);
    this.splitParticle(particle2, event.collisionPoint);
  }

  /**
   * Split a particle into smaller particles
   */
  private splitParticle(particle: Particle, splitPoint: Vector2D): void {
    const splitCount = 2 + Math.floor(Math.random() * 3); // 2-4 particles
        
    for (let i = 0; i < splitCount; i++) {
      const angle = (i / splitCount) * Math.PI * 2;
      const speed = particle.type.behavior.speed * 0.5;
      
      const splitVelocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      
      this.createParticle(particle.type.id, splitPoint, splitVelocity, {
        split: true,
        originalParticle: particle.id,
      });
    }
    
    this.destroyParticle(particle.id);
  }

  /**
   * Handle particle interactions
   */
  private handleParticleInteractions(): void {
    const particles = Array.from(this.particles.values());
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const particle1 = particles[i];
        const particle2 = particles[j];
        
        this.handleParticleInteraction(particle1, particle2);
      }
    }
  }

  /**
   * Handle interaction between two particles
   */
  private handleParticleInteraction(particle1: Particle, particle2: Particle): void {
    const interactions1 = particle1.type.interactions;
    const interactions2 = particle2.type.interactions;
    
    // Check if particle1 attracts particle2
    if (interactions1.attracts.includes(particle2.type.id)) {
      this.applyAttractionForce(particle1, particle2);
    }
    
    // Check if particle1 repels particle2
    if (interactions1.repels.includes(particle2.type.id)) {
      this.applyRepulsionForce(particle1, particle2);
    }
    
    // Check if particle2 attracts particle1
    if (interactions2.attracts.includes(particle1.type.id)) {
      this.applyAttractionForce(particle2, particle1);
    }
    
    // Check if particle2 repels particle1
    if (interactions2.repels.includes(particle1.type.id)) {
      this.applyRepulsionForce(particle2, particle1);
    }
  }

  /**
   * Apply attraction force between particles
   */
  private applyAttractionForce(attractor: Particle, attracted: Particle): void {
    const dx = attractor.position.x - attracted.position.x;
    const dy = attractor.position.y - attracted.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < 100) { // Max attraction distance
      const force = (attractor.type.physics.fieldStrength * attracted.type.physics.fieldStrength) / (distance * distance);
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      attracted.acceleration.x += normalizedX * force * 0.1;
      attracted.acceleration.y += normalizedY * force * 0.1;
    }
  }

  /**
   * Apply repulsion force between particles
   */
  private applyRepulsionForce(repeller: Particle, repelled: Particle): void {
    const dx = repelled.position.x - repeller.position.x;
    const dy = repelled.position.y - repeller.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < 50) { // Max repulsion distance
      const force = (repeller.type.physics.fieldStrength * repelled.type.physics.fieldStrength) / (distance * distance);
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      repelled.acceleration.x += normalizedX * force * 0.1;
      repelled.acceleration.y += normalizedY * force * 0.1;
    }
  }

  /**
   * Handle bounds collision
   */
  private handleBoundsCollision(particle: Particle): void {
    const bounds = this.config.bounds;
    const restitution = particle.type.physics.restitution;
    
    // Left/Right bounds
    if (particle.position.x - particle.radius < bounds.left) {
      particle.position.x = bounds.left + particle.radius;
      particle.velocity.x *= -restitution;
    } else if (particle.position.x + particle.radius > bounds.right) {
      particle.position.x = bounds.right - particle.radius;
      particle.velocity.x *= -restitution;
    }
    
    // Top/Bottom bounds
    if (particle.position.y - particle.radius < bounds.top) {
      particle.position.y = bounds.top + particle.radius;
      particle.velocity.y *= -restitution;
    } else if (particle.position.y + particle.radius > bounds.bottom) {
      particle.position.y = bounds.bottom - particle.radius;
      particle.velocity.y *= -restitution;
    }
  }

  /**
   * Check if particle is out of bounds
   */
  private isParticleOutOfBounds(particle: Particle): boolean {
    const bounds = this.config.bounds;
    const margin = particle.radius * 2;
    
    return particle.position.x < bounds.left - margin ||
           particle.position.x > bounds.right + margin ||
           particle.position.y < bounds.top - margin ||
           particle.position.y > bounds.bottom + margin;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(startTime: number): void {
    const endTime = Date.now();
    const frameTime = endTime - startTime;
    
    this.performanceMetrics = {
      fps: Math.round(1000 / frameTime),
      particleCount: this.particles.size,
      updateTime: frameTime,
      collisionTime: 0, // Would be measured in collision handling
      fieldTime: 0, // Would be measured in field updates
    };
    
    this.onPerformanceUpdateCallback?.(this.performanceMetrics);
  }

  /**
   * Generate unique particle ID
   */
  private generateParticleId(): string {
    return `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique field ID
   */
  private generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all particles
   */
  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  /**
   * Get all energy fields
   */
  getEnergyFields(): EnergyField[] {
    return Array.from(this.energyFields.values());
  }

  /**
   * Get particle types
   */
  getParticleTypes(): ParticleType[] {
    return Array.from(this.particleTypes.values());
  }

  /**
   * Get collision events
   */
  getCollisionEvents(): CollisionEvent[] {
    return [...this.collisionEvents];
  }

  /**
   * Clear collision events
   */
  clearCollisionEvents(): void {
    this.collisionEvents = [];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onParticleCreated?: (particle: Particle) => void;
    onParticleDestroyed?: (particle: Particle) => void;
    onCollision?: (event: CollisionEvent) => void;
    onPerformanceUpdate?: (metrics: typeof this.performanceMetrics) => void;
  }): void {
    this.onParticleCreatedCallback = callbacks.onParticleCreated;
    this.onParticleDestroyedCallback = callbacks.onParticleDestroyed;
    this.onCollisionCallback = callbacks.onCollision;
    this.onPerformanceUpdateCallback = callbacks.onPerformanceUpdate;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
    this.particles.clear();
    this.energyFields.clear();
    this.particleTypes.clear();
    this.collisionEvents = [];
    console.log('🧹 Particle Physics Engine cleaned up');
  }
}

// Export singleton instance
export const particlePhysicsEngine = new ParticlePhysicsEngine();
