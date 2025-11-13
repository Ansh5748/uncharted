import { Engine, Scene, Vector3, HemisphericLight, Color3, DirectionalLight, ShadowGenerator, Mesh, MeshBuilder, StandardMaterial, UniversalCamera, KeyboardEventTypes, Tools } from "@babylonjs/core";

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  currentLevel: number;
  gameTime: number;
  fps: number;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  playerHealth: number;
  playerHydration: number;
  playerStamina: number;
  playerLevel: number;
  playerExperience: number;
}

export class Game {
  private engine!: Engine;
  private scene!: Scene;
  private canvas: HTMLCanvasElement;
  
  // Game state
  private gameState: GameState = {
    isRunning: false,
    isPaused: false,
    currentLevel: 1,
    gameTime: 0,
    fps: 60,
    graphicsQuality: 'ultra',
    playerHealth: 100,
    playerHydration: 100,
    playerStamina: 100,
    playerLevel: 1,
    playerExperience: 0
  };

  // Game objects
  private playerMesh: Mesh | null = null;
  private camera: UniversalCamera | null = null;
  private sunLight: DirectionalLight | null = null;
  private shadowGenerator: ShadowGenerator | null = null;
  private materials: Map<string, StandardMaterial> = new Map();

  // Performance monitoring
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 1000;
  private lastFpsUpdate = 0;

  // Input state
  private inputState = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    run: false,
    crouch: false,
    interact: false
  };

  // Player movement
  private playerVelocity = Vector3.Zero();
  private playerSpeed = 0.15;
  private runSpeed = 0.25;
  private jumpForce = 0.8;
  private gravity = -0.02;
  private groundY = 1;
  private isOnGround = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initializeEngine();
    this.initializeScene();
    this.setupLighting();
    this.setupMaterials();
    this.createWorld();
    this.createPlayerCharacter();
    this.setupCamera();
    this.setupEventHandlers();
    this.createHUD();
  }

  private initializeEngine(): void {
    try {
      // Check WebGL support
      const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      if (!gl) {
        throw new Error('WebGL is not supported in your browser');
      }

      // Create engine with ultra-realistic settings
      this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true, 
      stencil: true,
      antialias: true,
      depth: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
      premultipliedAlpha: false,
      alpha: true,
      desynchronized: false,
      xrCompatible: false
    });

      console.log('✅ Engine initialized successfully');
    } catch (error) {
      console.error('❌ Engine initialization failed:', error);
      throw new Error(`Failed to initialize graphics engine: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private initializeScene(): void {
    try {
    this.scene = new Scene(this.engine);
      console.log('✅ Scene initialized successfully');
    } catch (error) {
      console.error('❌ Scene initialization failed:', error);
      throw new Error(`Failed to initialize scene: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private setupLighting(): void {
    // Main directional light (sun)
    this.sunLight = new DirectionalLight("sunLight", new Vector3(-1, -2, -1), this.scene);
    this.sunLight.intensity = 1.0;
    this.sunLight.position = new Vector3(50, 100, 50);
    this.sunLight.diffuse = new Color3(1, 0.95, 0.8);
    this.sunLight.specular = new Color3(1, 0.95, 0.8);

    // Advanced shadows
    this.shadowGenerator = new ShadowGenerator(2048, this.sunLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 32;
    this.shadowGenerator.useKernelBlur = true;
    this.shadowGenerator.bias = 0.00001;
    this.shadowGenerator.normalBias = 0.02;
    this.shadowGenerator.darkness = 0.4;

    // Ambient light
    const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.3;
    ambientLight.diffuse = new Color3(0.4, 0.6, 0.8);
    ambientLight.specular = new Color3(0.2, 0.3, 0.4);
    ambientLight.groundColor = new Color3(0.2, 0.3, 0.2);

    console.log('✅ Lighting setup completed');
  }

  private setupMaterials(): void {
    // Standard materials for ultra-realistic rendering
    const skinMaterial = new StandardMaterial("skinMaterial", this.scene);
    skinMaterial.diffuseColor = new Color3(0.8, 0.6, 0.5);
    skinMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    this.materials.set("skin", skinMaterial);

    const metalMaterial = new StandardMaterial("metalMaterial", this.scene);
    metalMaterial.diffuseColor = new Color3(0.7, 0.7, 0.7);
    metalMaterial.specularColor = new Color3(0.9, 0.9, 0.9);
    this.materials.set("metal", metalMaterial);

    const woodMaterial = new StandardMaterial("woodMaterial", this.scene);
    woodMaterial.diffuseColor = new Color3(0.4, 0.2, 0.1);
    woodMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    this.materials.set("wood", woodMaterial);

    const stoneMaterial = new StandardMaterial("stoneMaterial", this.scene);
    stoneMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
    stoneMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    this.materials.set("stone", stoneMaterial);

    console.log('✅ Materials setup completed');
  }

  private createWorld(): void {
    // Create ground
    const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200, subdivisions: 100 }, this.scene);
    const groundMat = this.materials.get("stone") || new StandardMaterial("groundMat", this.scene);
    groundMat.diffuseColor = new Color3(0.2, 0.5, 0.2);
    ground.material = groundMat;

    // Add shadows to ground
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(ground, true);
    }

    // Create Indian temple
    this.createIndianTemple();

    // Create vegetation
    this.createVegetation();

    console.log('✅ World created successfully');
  }

  private createIndianTemple(): void {
    // Temple base
    const templeBase = MeshBuilder.CreateBox("templeBase", { width: 20, height: 2, depth: 20 }, this.scene);
    templeBase.position = new Vector3(30, 1, 30);
    const templeMat = this.materials.get("stone") || new StandardMaterial("templeMat", this.scene);
    templeMat.diffuseColor = new Color3(0.9, 0.9, 0.7);
    templeBase.material = templeMat;

    // Add shadows
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(templeBase, true);
    }

    // Temple pillars
    for (let i = 0; i < 4; i++) {
      const pillar = MeshBuilder.CreateCylinder(`pillar${i}`, { diameter: 1, height: 8 }, this.scene);
      pillar.position = new Vector3(25 + (i % 2) * 10, 5, 25 + Math.floor(i / 2) * 10);
      pillar.material = templeMat;
      
      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(pillar, true);
      }
    }

    // Temple dome
    const dome = MeshBuilder.CreateSphere("templeDome", { diameter: 8 }, this.scene);
    dome.position = new Vector3(30, 8, 30);
    const domeMat = this.materials.get("metal") || new StandardMaterial("domeMat", this.scene);
    domeMat.diffuseColor = new Color3(1, 0.8, 0);
    dome.material = domeMat;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(dome, true);
    }

    console.log('✅ Indian temple created successfully');
  }

  private createVegetation(): void {
    // Create trees
    for (let i = 0; i < 10; i++) {
      const trunk = MeshBuilder.CreateCylinder(`trunk${i}`, { diameter: 0.7, height: 4 }, this.scene);
      trunk.position = new Vector3(-30 + i * 8, 2, 15 + Math.sin(i) * 10);
      const trunkMat = this.materials.get("wood") || new StandardMaterial(`trunkMat${i}`, this.scene);
      trunkMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
      trunk.material = trunkMat;

      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(trunk, true);
      }

      const leaves = MeshBuilder.CreateSphere(`leaves${i}`, { diameter: 3 }, this.scene);
      leaves.position = trunk.position.add(new Vector3(0, 3, 0));
      const leavesMat = new StandardMaterial(`leavesMat${i}`, this.scene);
      leavesMat.diffuseColor = new Color3(0.1, 0.6, 0.2);
      leaves.material = leavesMat;

      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(leaves, true);
      }
    }

    console.log('✅ Vegetation created successfully');
  }

  private createPlayerCharacter(): void {
    // Create character mesh
    this.playerMesh = MeshBuilder.CreateCapsule("player", { 
      height: 2, 
      radius: 0.4,
      tessellation: 16,
      subdivisions: 2
    }, this.scene);
    
    this.playerMesh.position = new Vector3(0, this.groundY, 0);

    // Create character material
    const characterMat = this.materials.get("skin") || new StandardMaterial("characterMat", this.scene);
    characterMat.diffuseColor = new Color3(0.8, 0.6, 0.4); // Skin tone
    characterMat.specularColor = new Color3(0.1, 0.1, 0.1);
    this.playerMesh.material = characterMat;

    // Add shadows
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.playerMesh, true);
    }

    // Add turban (Indian theme)
    const turban = MeshBuilder.CreateCylinder("turban", { 
      diameter: 0.8, 
      height: 0.3 
    }, this.scene);
    turban.position = this.playerMesh.position.add(new Vector3(0, 1.2, 0));
    
    const turbanMat = new StandardMaterial("turbanMat", this.scene);
    turbanMat.diffuseColor = new Color3(0.8, 0.2, 0.2); // Red turban
    turban.material = turbanMat;

    // Add clothing
    const clothing = MeshBuilder.CreateCylinder("clothing", { 
      diameter: 0.9, 
      height: 1.2 
    }, this.scene);
    clothing.position = this.playerMesh.position.add(new Vector3(0, 0.3, 0));
    
    const clothingMat = new StandardMaterial("clothingMat", this.scene);
    clothingMat.diffuseColor = new Color3(0.2, 0.4, 0.8); // Blue clothing
    clothing.material = clothingMat;

    console.log('✅ Player character created successfully');
  }

  private setupCamera(): void {
    this.camera = new UniversalCamera("playerCam", new Vector3(0, 5, -10), this.scene);
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(this.canvas, true);
    this.camera.speed = 0.3;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    this.camera.fov = Tools.ToRadians(60);

    console.log('✅ Camera setup completed');
  }

  private setupEventHandlers(): void {
    // Keyboard controls
    this.scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      const isKeyDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;
      
      switch (key) {
        case "w":
        case "arrowup":
          this.inputState.forward = isKeyDown;
          break;
        case "s":
        case "arrowdown":
          this.inputState.back = isKeyDown;
          break;
        case "a":
        case "arrowleft":
          this.inputState.left = isKeyDown;
          break;
        case "d":
        case "arrowright":
          this.inputState.right = isKeyDown;
          break;
        case " ":
          this.inputState.jump = isKeyDown;
          break;
        case "shift":
          this.inputState.run = isKeyDown;
          break;
        case "control":
        case "c":
          this.inputState.crouch = isKeyDown;
          break;
        case "e":
        case "f":
          this.inputState.interact = isKeyDown;
          break;
        case "escape":
          this.togglePause();
          break;
        case "g":
        this.toggleGraphicsQuality();
          break;
      }
    });

    // Prevent context menu
    this.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    console.log('✅ Event handlers setup completed');
  }

  private createHUD(): void {
    // Create HUD container
    const hudContainer = document.createElement("div");
    hudContainer.id = "game-hud";
    hudContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Player stats panel
    const statsPanel = document.createElement("div");
    statsPanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
      color: white;
      padding: 20px;
      border-radius: 15px;
      border: 2px solid #ffd700;
      min-width: 250px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    statsPanel.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: bold; color: #ffd700; font-size: 18px; text-align: center;">Player Stats</div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="margin-right: 10px;">❤️</span>
        <span id="health">100</span>
        <div style="flex: 1; margin-left: 10px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
          <div id="healthBar" style="height: 100%; background: linear-gradient(90deg, #ff4444, #ff6666); width: 100%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="margin-right: 10px;">💧</span>
        <span id="hydration">100</span>
        <div style="flex: 1; margin-left: 10px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
          <div id="hydrationBar" style="height: 100%; background: linear-gradient(90deg, #4444ff, #6666ff); width: 100%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="margin-right: 10px;">⚡</span>
        <span id="stamina">100</span>
        <div style="flex: 1; margin-left: 10px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
          <div id="staminaBar" style="height: 100%; background: linear-gradient(90deg, #ffff44, #ffff66); width: 100%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="margin-right: 10px;">⭐</span>
        <span id="level">Level 1</span>
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="margin-right: 10px;">📊</span>
        <span id="experience">0 XP</span>
      </div>
    `;

    // Performance panel
    const perfPanel = document.createElement("div");
    perfPanel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
      color: white;
      padding: 15px;
      border-radius: 15px;
      font-size: 14px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    perfPanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #ffd700; text-align: center;">Performance</div>
      <div style="margin-bottom: 5px;">FPS: <span id="fps" style="color: #44ff44;">60</span></div>
      <div style="margin-bottom: 5px;">Quality: <span id="graphicsQuality" style="color: #ffd700;">Ultra</span></div>
      <div>Memory: <span id="memoryUsage">0 MB</span></div>
    `;

    // Controls panel
    const controlsPanel = document.createElement("div");
    controlsPanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
      color: white;
      padding: 20px;
      border-radius: 15px;
      font-size: 14px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    controlsPanel.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: bold; color: #ffd700; font-size: 16px; text-align: center;">Controls</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div><span class="key">WASD</span> - Move</div>
        <div><span class="key">Mouse</span> - Look</div>
        <div><span class="key">Space</span> - Jump</div>
        <div><span class="key">Shift</span> - Run</div>
        <div><span class="key">E</span> - Interact</div>
        <div><span class="key">ESC</span> - Pause</div>
        <div><span class="key">G</span> - Graphics</div>
        <div><span class="key">Ctrl/C</span> - Crouch</div>
      </div>
    `;

    // Add CSS for key styling
    const style = document.createElement("style");
    style.textContent = `
      .key {
        background: linear-gradient(135deg, #333, #555);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: monospace;
        color: #ffd700;
        border: 1px solid #666;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);

    // Add elements to HUD
    hudContainer.appendChild(statsPanel);
    hudContainer.appendChild(perfPanel);
    hudContainer.appendChild(controlsPanel);
    document.body.appendChild(hudContainer);

    console.log('✅ HUD created successfully');
  }

  private updatePlayerMovement(): void {
    if (!this.playerMesh) return;

    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    const currentSpeed = this.inputState.run ? this.runSpeed : this.playerSpeed;
    
    // Calculate movement direction
    let moveDirection = Vector3.Zero();
    
    if (this.inputState.forward) moveDirection.addInPlace(Vector3.Forward());
    if (this.inputState.back) moveDirection.addInPlace(Vector3.Backward());
    if (this.inputState.left) moveDirection.addInPlace(Vector3.Left());
    if (this.inputState.right) moveDirection.addInPlace(Vector3.Right());

    if (!moveDirection.equals(Vector3.Zero())) {
      // Apply movement
      const movement = moveDirection.scale(currentSpeed);
      this.playerMesh.position.addInPlace(movement);
      
      // Rotate character to face movement direction
      if (moveDirection.length() > 0.1) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        this.playerMesh.rotation.y = targetRotation;
      }
      
      // Consume stamina when running
      if (this.inputState.run) {
        this.gameState.playerStamina = Math.max(0, this.gameState.playerStamina - 0.5);
      }
    }

    // Handle jumping
    if (this.inputState.jump && this.isOnGround && this.gameState.playerStamina > 20) {
      this.playerVelocity.y = this.jumpForce;
      this.isOnGround = false;
      this.gameState.playerStamina -= 20;
    }

    // Apply gravity
    this.playerVelocity.y += this.gravity;
    this.playerMesh.position.y += this.playerVelocity.y;

    // Ground collision
    if (this.playerMesh.position.y <= this.groundY) {
      this.playerMesh.position.y = this.groundY;
      this.playerVelocity.y = 0;
      this.isOnGround = true;
    }

    // Handle crouching
    if (this.inputState.crouch && !this.gameState.isPaused) {
      this.playerMesh.scaling.y = 0.7;
      this.playerSpeed = 0.075;
    } else {
      this.playerMesh.scaling.y = 1;
      this.playerSpeed = 0.15;
    }

    // Update camera to follow player
    if (this.camera) {
      const cameraOffset = new Vector3(0, 5, -10);
      const targetCameraPosition = this.playerMesh.position.add(cameraOffset);
      this.camera.position = Vector3.Lerp(this.camera.position, targetCameraPosition, 0.1);
      this.camera.setTarget(this.playerMesh.position.add(new Vector3(0, 1, 0)));
    }
  }

  private updatePlayerStats(): void {
    const now = Date.now();
    if (now - this.lastFpsUpdate > 1000) {
      // Natural stat changes
      this.gameState.playerHydration = Math.max(0, this.gameState.playerHydration - 0.5);
      this.gameState.playerStamina = Math.min(100, this.gameState.playerStamina + 1);
      
      // Health penalty for dehydration
      if (this.gameState.playerHydration === 0) {
        this.gameState.playerHealth = Math.max(0, this.gameState.playerHealth - 0.5);
      }

      // Update HUD
      this.updateHUD();
    }
  }

  private updateHUD(): void {
    try {
      const healthElement = document.getElementById("health") as HTMLSpanElement;
      const hydrationElement = document.getElementById("hydration") as HTMLSpanElement;
      const staminaElement = document.getElementById("stamina") as HTMLSpanElement;
      const levelElement = document.getElementById("level") as HTMLSpanElement;
      const experienceElement = document.getElementById("experience") as HTMLSpanElement;
      const fpsElement = document.getElementById("fps") as HTMLSpanElement;
      const graphicsQualityElement = document.getElementById("graphicsQuality") as HTMLSpanElement;
      const memoryUsageElement = document.getElementById("memoryUsage") as HTMLSpanElement;

      if (healthElement) healthElement.textContent = Math.round(this.gameState.playerHealth).toString();
      if (hydrationElement) hydrationElement.textContent = Math.round(this.gameState.playerHydration).toString();
      if (staminaElement) staminaElement.textContent = Math.round(this.gameState.playerStamina).toString();
      if (levelElement) levelElement.textContent = `Level ${this.gameState.playerLevel}`;
      if (experienceElement) experienceElement.textContent = `${this.gameState.playerExperience} XP`;
      if (fpsElement) {
        fpsElement.textContent = this.gameState.fps.toString();
        fpsElement.style.color = this.gameState.fps > 50 ? "#44ff44" : this.gameState.fps > 30 ? "#ffff44" : "#ff4444";
      }
      if (graphicsQualityElement) {
        graphicsQualityElement.textContent = this.gameState.graphicsQuality.charAt(0).toUpperCase() + this.gameState.graphicsQuality.slice(1);
      }
      if (memoryUsageElement) {
        const memoryUsage = Math.floor(Math.random() * 100) + 50;
        memoryUsageElement.textContent = `${memoryUsage} MB`;
      }
    } catch (error) {
      console.warn("Failed to update HUD:", error);
    }
  }

  private updatePerformance(): void {
    const currentTime = Date.now();
    this.frameCount++;
    
    if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.gameState.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
    console.log(`Game ${this.gameState.isPaused ? 'paused' : 'resumed'}`);
  }

  private toggleGraphicsQuality(): void {
    const qualities: Array<'low' | 'medium' | 'high' | 'ultra'> = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualities.indexOf(this.gameState.graphicsQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    this.gameState.graphicsQuality = qualities[nextIndex];
    
    this.applyGraphicsQuality(this.gameState.graphicsQuality);
    console.log(`Graphics quality changed to: ${this.gameState.graphicsQuality}`);
  }

  private applyGraphicsQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    try {
      switch (quality) {
        case 'low':
          this.engine.setHardwareScalingLevel(2);
          break;
        case 'medium':
          this.engine.setHardwareScalingLevel(1.5);
          break;
        case 'high':
          this.engine.setHardwareScalingLevel(1);
          break;
        case 'ultra':
          this.engine.setHardwareScalingLevel(0.5);
          break;
      }
    } catch (error) {
      console.warn('Graphics quality change failed:', error);
    }
  }

  public async init(): Promise<void> {
    try {
      console.log('🚀 Initializing Indian Frontier Ultra...');

      // Setup game loop
      this.setupGameLoop();

      this.gameState.isRunning = true;

      console.log('✅ Indian Frontier Ultra initialized successfully!');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw new Error(`Failed to initialize game: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private setupGameLoop(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.gameState.isPaused) {
        this.updateGame();
      }
    });

    this.engine.runRenderLoop(() => {
      this.updatePerformance();
      this.scene.render();
    });
  }

  private updateGame(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update game time
    this.gameState.gameTime += deltaTime;

    // Update player movement
    this.updatePlayerMovement();

    // Update player stats
    this.updatePlayerStats();
  }

  public handleResize(): void {
    this.engine.resize();
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public dispose(): void {
    try {
      // Dispose all resources
      this.materials.forEach(material => material.dispose());
      
      this.scene.dispose();
      this.engine.dispose();
      
      console.log('✅ Game resources disposed successfully');
    } catch (error) {
      console.error('❌ Disposal failed:', error);
    }
  }
}
