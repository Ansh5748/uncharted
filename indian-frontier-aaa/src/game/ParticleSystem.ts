import { 
  Scene, 
  Vector3, 
  ParticleSystem, 
  Texture, 
  Color4, 
  Color3,
  Mesh,
  StandardMaterial,
  Animation,
  EasingFunction,
  CircleEase,
  Matrix
} from "@babylonjs/core";

export interface ParticleConfig {
  name: string;
  maxParticles: number;
  lifetime: number;
  emitRate: number;
  gravity: Vector3;
  minSize: number;
  maxSize: number;
  minEmitPower: number;
  maxEmitPower: number;
  textureUrl?: string;
  colors: Color4[];
  blendMode: number;
  direction1: Vector3;
  direction2: Vector3;
  minAngularSpeed: number;
  maxAngularSpeed: number;
  minEmitBox: Vector3;
  maxEmitBox: Vector3;
}

export class AdvancedParticleSystem {
  private scene: Scene;
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private particleConfigs: Map<string, ParticleConfig> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeParticleConfigs();
  }

  private initializeParticleConfigs(): void {
    // Dust particles
    this.particleConfigs.set('dust', {
      name: 'dust',
      maxParticles: 1000,
      lifetime: 3.0,
      emitRate: 50,
      gravity: new Vector3(0, -0.1, 0),
      minSize: 0.1,
      maxSize: 0.3,
      minEmitPower: 0.1,
      maxEmitPower: 0.3,
      textureUrl: "https://assets.babylonjs.com/particles/flare.png",
      colors: [
        new Color4(0.8, 0.8, 0.8, 0.3),
        new Color4(0.6, 0.6, 0.6, 0.2),
        new Color4(0.4, 0.4, 0.4, 0.1)
      ],
      blendMode: ParticleSystem.BLENDMODE_STANDARD,
      direction1: new Vector3(-0.5, 0, -0.5),
      direction2: new Vector3(0.5, 0, 0.5),
      minAngularSpeed: 0,
      maxAngularSpeed: 0.5,
      minEmitBox: new Vector3(-1, 0, -1),
      maxEmitBox: new Vector3(1, 0.5, 1)
    });

    // Water splash
    this.particleConfigs.set('water_splash', {
      name: 'water_splash',
      maxParticles: 200,
      lifetime: 2.0,
      emitRate: 100,
      gravity: new Vector3(0, -9.8, 0),
      minSize: 0.05,
      maxSize: 0.15,
      minEmitPower: 2,
      maxEmitPower: 5,
      textureUrl: "https://assets.babylonjs.com/particles/water.png",
      colors: [
        new Color4(0.2, 0.4, 0.8, 0.8),
        new Color4(0.1, 0.3, 0.7, 0.6),
        new Color4(0.0, 0.2, 0.6, 0.4)
      ],
      blendMode: ParticleSystem.BLENDMODE_ADD,
      direction1: new Vector3(-1, 1, -1),
      direction2: new Vector3(1, 2, 1),
      minAngularSpeed: 0,
      maxAngularSpeed: 2,
      minEmitBox: new Vector3(-0.2, 0, -0.2),
      maxEmitBox: new Vector3(0.2, 0.1, 0.2)
    });

    // Fire particles
    this.particleConfigs.set('fire', {
      name: 'fire',
      maxParticles: 500,
      lifetime: 1.5,
      emitRate: 80,
      gravity: new Vector3(0, 2, 0),
      minSize: 0.2,
      maxSize: 0.6,
      minEmitPower: 1,
      maxEmitPower: 3,
      textureUrl: "https://assets.babylonjs.com/particles/fire.png",
      colors: [
        new Color4(1, 0.5, 0, 1),
        new Color4(1, 0.3, 0, 0.8),
        new Color4(0.5, 0.1, 0, 0.6)
      ],
      blendMode: ParticleSystem.BLENDMODE_ADD,
      direction1: new Vector3(-0.2, 1, -0.2),
      direction2: new Vector3(0.2, 2, 0.2),
      minAngularSpeed: 0,
      maxAngularSpeed: 1,
      minEmitBox: new Vector3(-0.3, 0, -0.3),
      maxEmitBox: new Vector3(0.3, 0.5, 0.3)
    });

    // Magic sparkles
    this.particleConfigs.set('magic_sparkles', {
      name: 'magic_sparkles',
      maxParticles: 300,
      lifetime: 4.0,
      emitRate: 30,
      gravity: new Vector3(0, 0.5, 0),
      minSize: 0.05,
      maxSize: 0.15,
      minEmitPower: 0.5,
      maxEmitPower: 1.5,
      textureUrl: "https://assets.babylonjs.com/particles/sparkles.png",
      colors: [
        new Color4(1, 1, 0, 1),
        new Color4(0, 1, 1, 0.8),
        new Color4(1, 0, 1, 0.6)
      ],
      blendMode: ParticleSystem.BLENDMODE_ADD,
      direction1: new Vector3(-1, -0.5, -1),
      direction2: new Vector3(1, 1, 1),
      minAngularSpeed: 1,
      maxAngularSpeed: 3,
      minEmitBox: new Vector3(-0.5, 0, -0.5),
      maxEmitBox: new Vector3(0.5, 1, 0.5)
    });

    // Smoke
    this.particleConfigs.set('smoke', {
      name: 'smoke',
      maxParticles: 400,
      lifetime: 5.0,
      emitRate: 40,
      gravity: new Vector3(0, 1, 0),
      minSize: 0.5,
      maxSize: 2.0,
      minEmitPower: 0.5,
      maxEmitPower: 1.5,
      textureUrl: "https://assets.babylonjs.com/particles/smoke.png",
      colors: [
        new Color4(0.3, 0.3, 0.3, 0.8),
        new Color4(0.2, 0.2, 0.2, 0.6),
        new Color4(0.1, 0.1, 0.1, 0.4)
      ],
      blendMode: ParticleSystem.BLENDMODE_STANDARD,
      direction1: new Vector3(-0.3, 1, -0.3),
      direction2: new Vector3(0.3, 2, 0.3),
      minAngularSpeed: 0,
      maxAngularSpeed: 0.5,
      minEmitBox: new Vector3(-0.2, 0, -0.2),
      maxEmitBox: new Vector3(0.2, 0.3, 0.2)
    });

    // Leaves falling
    this.particleConfigs.set('falling_leaves', {
      name: 'falling_leaves',
      maxParticles: 200,
      lifetime: 8.0,
      emitRate: 15,
      gravity: new Vector3(0, -0.5, 0),
      minSize: 0.1,
      maxSize: 0.3,
      minEmitPower: 0.1,
      maxEmitPower: 0.3,
      textureUrl: "https://assets.babylonjs.com/particles/leaf.png",
      colors: [
        new Color4(0.2, 0.6, 0.2, 0.8),
        new Color4(0.4, 0.8, 0.4, 0.6),
        new Color4(0.6, 0.4, 0.2, 0.4)
      ],
      blendMode: ParticleSystem.BLENDMODE_STANDARD,
      direction1: new Vector3(-0.2, -0.1, -0.2),
      direction2: new Vector3(0.2, 0.1, 0.2),
      minAngularSpeed: 0.5,
      maxAngularSpeed: 2,
      minEmitBox: new Vector3(-5, 10, -5),
      maxEmitBox: new Vector3(5, 15, 5)
    });
  }

  public createParticleSystem(type: string, position: Vector3, emitter?: Mesh): ParticleSystem | null {
    const config = this.particleConfigs.get(type);
    if (!config) {
      console.warn(`Particle system type '${type}' not found`);
      return null;
    }

    const particleSystem = new ParticleSystem(config.name, config.maxParticles, this.scene);

    // Set basic properties
    // particleSystem.lifetime = config.lifetime; // Not available in current Babylon.js version
    particleSystem.emitRate = config.emitRate;
    particleSystem.gravity = config.gravity;
    particleSystem.minSize = config.minSize;
    particleSystem.maxSize = config.maxSize;
    particleSystem.minEmitPower = config.minEmitPower;
    particleSystem.maxEmitPower = config.maxEmitPower;
    particleSystem.blendMode = config.blendMode;

    // Set colors
    particleSystem.color1 = config.colors[0];
    particleSystem.color2 = config.colors[1];
    particleSystem.colorDead = config.colors[2];

    // Set directions
    particleSystem.direction1 = config.direction1;
    particleSystem.direction2 = config.direction2;

    // Set angular speed
    particleSystem.minAngularSpeed = config.minAngularSpeed;
    particleSystem.maxAngularSpeed = config.maxAngularSpeed;

    // Set emit box
    particleSystem.minEmitBox = config.minEmitBox;
    particleSystem.maxEmitBox = config.maxEmitBox;

    // Load texture
    if (config.textureUrl) {
      particleSystem.particleTexture = new Texture(config.textureUrl, this.scene);
    }

    // Set emitter
    if (emitter) {
      particleSystem.emitter = emitter;
    } else {
      particleSystem.emitter = position;
    }

    // Store the particle system
    this.particleSystems.set(`${type}_${Date.now()}`, particleSystem);

    return particleSystem;
  }

  public createDustEffect(position: Vector3, intensity: number = 1.0): ParticleSystem | null {
    const dustSystem = this.createParticleSystem('dust', position);
    if (dustSystem) {
      dustSystem.emitRate *= intensity;
      // dustSystem.maxParticles = Math.floor(1000 * intensity); // Not available in current Babylon.js version
      return dustSystem;
    }
    return null;
  }

  public createWaterSplash(position: Vector3, intensity: number = 1.0): ParticleSystem | null {
    const splashSystem = this.createParticleSystem('water_splash', position);
    if (splashSystem) {
      splashSystem.emitRate *= intensity;
      splashSystem.maxEmitPower *= intensity;
      // splashSystem.maxParticles = Math.floor(200 * intensity); // Not available in current Babylon.js version
      return splashSystem;
    }
    return null;
  }

  public createFireEffect(position: Vector3, size: number = 1.0): ParticleSystem | null {
    const fireSystem = this.createParticleSystem('fire', position);
    if (fireSystem) {
      fireSystem.minSize *= size;
      fireSystem.maxSize *= size;
      fireSystem.minEmitBox.scaleInPlace(size);
      fireSystem.maxEmitBox.scaleInPlace(size);
      return fireSystem;
    }
    return null;
  }

  public createMagicEffect(position: Vector3, duration: number = 3.0): ParticleSystem | null {
    const magicSystem = this.createParticleSystem('magic_sparkles', position);
    if (magicSystem) {
      // magicSystem.lifetime = duration; // Not available in current Babylon.js version
      return magicSystem;
    }
    return null;
  }

  public createSmokeEffect(position: Vector3, intensity: number = 1.0): ParticleSystem | null {
    const smokeSystem = this.createParticleSystem('smoke', position);
    if (smokeSystem) {
      smokeSystem.emitRate *= intensity;
      // smokeSystem.maxParticles = Math.floor(400 * intensity); // Not available in current Babylon.js version
      return smokeSystem;
    }
    return null;
  }

  public createFallingLeaves(area: Vector3, density: number = 1.0): ParticleSystem | null {
    const leavesSystem = this.createParticleSystem('falling_leaves', area);
    if (leavesSystem) {
      leavesSystem.emitRate *= density;
      leavesSystem.minEmitBox = area.scale(-1);
      leavesSystem.maxEmitBox = area;
      return leavesSystem;
    }
    return null;
  }

  public createFootstepDust(position: Vector3, surfaceType: 'grass' | 'stone' | 'sand'): ParticleSystem | null {
    const dustSystem = this.createParticleSystem('dust', position);
    if (dustSystem) {
      // Adjust based on surface type
      switch (surfaceType) {
        case 'grass':
          dustSystem.emitRate = 20;
          // dustSystem.maxParticles = 50; // Not available in current Babylon.js version
          // dustSystem.lifetime = 1.0; // Not available in current Babylon.js version
          break;
        case 'stone':
          dustSystem.emitRate = 10;
          // dustSystem.maxParticles = 30; // Not available in current Babylon.js version
          // dustSystem.lifetime = 0.5; // Not available in current Babylon.js version
          break;
        case 'sand':
          dustSystem.emitRate = 40;
          // dustSystem.maxParticles = 80; // Not available in current Babylon.js version
          // dustSystem.lifetime = 2.0; // Not available in current Babylon.js version
          break;
      }
      return dustSystem;
    }
    return null;
  }

  public createExplosionEffect(position: Vector3, power: number = 1.0): ParticleSystem[] {
    const effects: ParticleSystem[] = [];

    // Create multiple particle systems for explosion
    const explosionDust = this.createParticleSystem('dust', position);
    if (explosionDust) {
      explosionDust.emitRate = 200 * power;
      // explosionDust.maxParticles = 500 * power; // Not available in current Babylon.js version
      // explosionDust.lifetime = 2.0; // Not available in current Babylon.js version
      explosionDust.minEmitPower = 5 * power;
      explosionDust.maxEmitPower = 10 * power;
      effects.push(explosionDust);
    }

    const explosionFire = this.createParticleSystem('fire', position);
    if (explosionFire) {
      explosionFire.emitRate = 150 * power;
      // explosionFire.maxParticles = 300 * power; // Not available in current Babylon.js version
      // explosionFire.lifetime = 1.5; // Not available in current Babylon.js version
      explosionFire.minEmitPower = 3 * power;
      explosionFire.maxEmitPower = 8 * power;
      effects.push(explosionFire);
    }

    const explosionSmoke = this.createParticleSystem('smoke', position);
    if (explosionSmoke) {
      explosionSmoke.emitRate = 100 * power;
      // explosionSmoke.maxParticles = 200 * power; // Not available in current Babylon.js version
      // explosionSmoke.lifetime = 3.0; // Not available in current Babylon.js version
      effects.push(explosionSmoke);
    }

    return effects;
  }

  public createWaterfallEffect(position: Vector3, width: number = 2.0, height: number = 10.0): ParticleSystem | null {
    const waterfallSystem = this.createParticleSystem('water_splash', position);
    if (waterfallSystem) {
      waterfallSystem.emitRate = 200;
      // waterfallSystem.maxParticles = 1000; // Not available in current Babylon.js version
      // waterfallSystem.lifetime = 2.0; // Not available in current Babylon.js version
      waterfallSystem.gravity = new Vector3(0, -2, 0);
      waterfallSystem.minEmitBox = new Vector3(-width/2, height, -0.1);
      waterfallSystem.maxEmitBox = new Vector3(width/2, height + 1, 0.1);
      waterfallSystem.direction1 = new Vector3(-0.1, -1, -0.1);
      waterfallSystem.direction2 = new Vector3(0.1, -2, 0.1);
      return waterfallSystem;
    }
    return null;
  }

  public startParticleSystem(system: ParticleSystem): void {
    system.start();
  }

  public stopParticleSystem(system: ParticleSystem): void {
    system.stop();
  }

  public disposeParticleSystem(system: ParticleSystem): void {
    system.stop();
    system.dispose();
    
    // Remove from map
    for (const [key, value] of this.particleSystems.entries()) {
      if (value === system) {
        this.particleSystems.delete(key);
        break;
      }
    }
  }

  public disposeAll(): void {
    this.particleSystems.forEach(system => {
      system.stop();
      system.dispose();
    });
    this.particleSystems.clear();
  }

  public getActiveParticleSystems(): ParticleSystem[] {
    return Array.from(this.particleSystems.values());
  }

  public updateParticleSystems(deltaTime: number): void {
    // Update any particle systems that need runtime modifications
    this.particleSystems.forEach(system => {
      // Add any runtime updates here
    });
  }
}
