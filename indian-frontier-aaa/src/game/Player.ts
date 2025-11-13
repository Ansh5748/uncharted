import { 
  Scene, 
  MeshBuilder, 
  Vector3, 
  Mesh, 
  UniversalCamera, 
  KeyboardEventTypes, 
  StandardMaterial, 
  Texture, 
  Ray,
  PhysicsImpostor,
  PhysicsViewer,
  Quaternion,
  Matrix,
  PointerEventTypes,
  Tools,
  Animation,
  EasingFunction,
  CircleEase,
  Color3
} from "@babylonjs/core";

export interface PlayerStats {
  health: number;
  hydration: number;
  stamina: number;
  experience: number;
  level: number;
}

export interface PlayerState {
  isMoving: boolean;
  isJumping: boolean;
  isClimbing: boolean;
  isInteracting: boolean;
  isCrouching: boolean;
  isRunning: boolean;
  canJump: boolean;
  canClimb: boolean;
}

export class Player {
  private mesh: Mesh | null = null;
  private camera: UniversalCamera;
  private characterMaterial: StandardMaterial | null = null;
  
  // Player stats with proper typing
  private stats: PlayerStats = {
    health: 100,
    hydration: 100,
    stamina: 100,
    experience: 0,
    level: 1
  };

  // Player state management
  private state: PlayerState = {
    isMoving: false,
    isJumping: false,
    isClimbing: false,
    isInteracting: false,
    isCrouching: false,
    isRunning: false,
    canJump: true,
    canClimb: false
  };

  // Movement and physics
  private velocity = Vector3.Zero();
  private moveSpeed = 0.15;
  private runSpeed = 0.25;
  private jumpForce = 0.8;
  private gravity = -0.02;
  private groundY = 1;
  private lastStatUpdate = Date.now();
  private lastJumpTime = 0;
  private jumpCooldown = 500; // ms

  // Camera controls
  private cameraDistance = 8;
  private cameraHeight = 4;
  private cameraRotationX = 0;
  private cameraRotationY = 0;
  private mouseSensitivity = 0.002;
  private isPointerLocked = false;

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

  constructor(private scene: Scene, private canvas: HTMLCanvasElement) {
    // Initialize camera with proper positioning
    this.camera = new UniversalCamera("playerCam", new Vector3(0, this.cameraHeight, -this.cameraDistance), this.scene);
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(this.canvas, true);
    this.camera.speed = 0.3;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    
    // Disable default camera controls for custom implementation
    this.camera.detachControl();
  }

  public async init(): Promise<void> {
    try {
      await this.createCharacter();
      this.setupControls();
      this.setupPhysics();
      this.setupAnimations();
      this.setupCamera();
      this.setupPointerLock();
      
      // Start the game loop
      this.scene.onBeforeRenderObservable.add(() => {
        this.update();
      });

      console.log("Player initialized successfully");
    } catch (error) {
      console.error("Failed to initialize player:", error);
      throw error;
    }
  }

  private async createCharacter(): Promise<void> {
    // Create character mesh with better proportions
    this.mesh = MeshBuilder.CreateCapsule("player", { 
      height: 2, 
      radius: 0.4,
      tessellation: 16,
      subdivisions: 2
    }, this.scene);
    
    if (!this.mesh) {
      throw new Error("Failed to create player mesh");
    }

    this.mesh.position = new Vector3(0, this.groundY, 0);

    // Create character material with Indian theme texture
    this.characterMaterial = new StandardMaterial("characterMat", this.scene);
    this.characterMaterial.diffuseColor = new Color3(0.8, 0.6, 0.4); // Skin tone
    this.characterMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    this.characterMaterial.ambientColor = new Color3(0.2, 0.2, 0.2);

    // Try to load character texture (fallback to solid color if fails)
    try {
      const characterTexture = new Texture("https://assets.babylonjs.com/environments/playerTexture.png", this.scene);
      characterTexture.onLoadObservable.add(() => {
        if (this.characterMaterial) {
          this.characterMaterial.diffuseTexture = characterTexture;
        }
      });
    } catch (error) {
      console.warn("Could not load character texture, using solid color");
    }

    this.mesh.material = this.characterMaterial;

    // Add character accessories (turban, clothing)
    this.addCharacterAccessories();
  }

  private addCharacterAccessories(): void {
    if (!this.mesh) return;

    // Add turban (Indian theme)
    const turban = MeshBuilder.CreateCylinder("turban", { 
      diameter: 0.8, 
      height: 0.3 
    }, this.scene);
    turban.position = this.mesh.position.add(new Vector3(0, 1.2, 0));
    
    const turbanMat = new StandardMaterial("turbanMat", this.scene);
    turbanMat.diffuseColor = new Color3(0.8, 0.2, 0.2); // Red turban
    turban.material = turbanMat;

    // Add clothing
    const clothing = MeshBuilder.CreateCylinder("clothing", { 
      diameter: 0.9, 
      height: 1.2 
    }, this.scene);
    clothing.position = this.mesh.position.add(new Vector3(0, 0.3, 0));
    
    const clothingMat = new StandardMaterial("clothingMat", this.scene);
    clothingMat.diffuseColor = new Color3(0.2, 0.4, 0.8); // Blue clothing
    clothing.material = clothingMat;
  }

  private setupControls(): void {
    // Keyboard controls
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (!this.isPointerLocked) return; // Only accept input when pointer is locked
      
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
      }
    });

    // Mouse controls for camera
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.isPointerLocked || !this.mesh) return;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERMOVE:
          if (pointerInfo.event.movementX !== undefined) {
            this.cameraRotationY += pointerInfo.event.movementX * this.mouseSensitivity;
          }
          if (pointerInfo.event.movementY !== undefined) {
            this.cameraRotationX -= pointerInfo.event.movementY * this.mouseSensitivity;
            this.cameraRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotationX));
          }
          break;
      }
    });
  }

  private setupPhysics(): void {
    if (!this.mesh) return;

    // Add physics impostor for realistic movement
    this.mesh.physicsImpostor = new PhysicsImpostor(
      this.mesh, 
      PhysicsImpostor.CapsuleImpostor, 
      { mass: 70, restitution: 0.1, friction: 0.8 }, 
      this.scene
    );
  }

  private setupAnimations(): void {
    // Create basic animations for character movement
    const walkAnimation = new Animation(
      "walkAnimation",
      "position.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keyFrames = [];
    keyFrames.push({
      frame: 0,
      value: 0
    });
    keyFrames.push({
      frame: 15,
      value: 0.1
    });
    keyFrames.push({
      frame: 30,
      value: 0
    });

    walkAnimation.setKeys(keyFrames);
    
    if (this.mesh) {
      this.mesh.animations = [walkAnimation];
    }
  }

  private setupCamera(): void {
    // Set up smooth camera following
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    this.camera.fov = Tools.ToRadians(60);
  }

  private setupPointerLock(): void {
    // Request pointer lock for mouse controls
    this.canvas.addEventListener("click", () => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });
  }

  private update(): void {
    if (!this.mesh) return;

    this.updateMovement();
    this.updateCamera();
    this.updateStats();
    this.updateState();
    this.checkCollisions();
  }

  private updateMovement(): void {
    if (!this.mesh) return;

    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    const currentSpeed = this.inputState.run ? this.runSpeed : this.moveSpeed;
    
    // Calculate movement direction based on camera orientation
    let moveDirection = Vector3.Zero();
    
    if (this.inputState.forward) moveDirection.addInPlace(Vector3.Forward());
    if (this.inputState.back) moveDirection.addInPlace(Vector3.Backward());
    if (this.inputState.left) moveDirection.addInPlace(Vector3.Left());
    if (this.inputState.right) moveDirection.addInPlace(Vector3.Right());

    if (!moveDirection.equals(Vector3.Zero())) {
      // Rotate movement direction based on camera Y rotation
      const rotationMatrix = Matrix.RotationY(this.cameraRotationY);
      moveDirection = Vector3.TransformNormal(moveDirection, rotationMatrix);
      moveDirection.normalize();
      
      // Apply movement
      const movement = moveDirection.scale(currentSpeed);
      this.mesh.position.addInPlace(movement);
      
      // Rotate character to face movement direction
      if (moveDirection.length() > 0.1) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        this.mesh.rotation.y = targetRotation;
      }
      
      this.state.isMoving = true;
      
      // Consume stamina when running
      if (this.inputState.run) {
        this.stats.stamina = Math.max(0, this.stats.stamina - 0.5);
      }
    } else {
      this.state.isMoving = false;
    }

    // Handle jumping
    if (this.inputState.jump && this.state.canJump && this.stats.stamina > 20) {
      const now = Date.now();
      if (now - this.lastJumpTime > this.jumpCooldown) {
        this.velocity.y = this.jumpForce;
        this.state.isJumping = true;
        this.state.canJump = false;
        this.lastJumpTime = now;
        this.stats.stamina -= 20;
      }
    }

    // Apply gravity
    this.velocity.y += this.gravity;
    this.mesh.position.y += this.velocity.y;

    // Ground collision
    if (this.mesh.position.y <= this.groundY) {
      this.mesh.position.y = this.groundY;
      this.velocity.y = 0;
      this.state.isJumping = false;
      this.state.canJump = true;
    }

    // Handle crouching
    if (this.inputState.crouch && !this.state.isCrouching) {
      this.state.isCrouching = true;
      this.mesh.scaling.y = 0.7;
      this.moveSpeed *= 0.5;
    } else if (!this.inputState.crouch && this.state.isCrouching) {
      this.state.isCrouching = false;
      this.mesh.scaling.y = 1;
      this.moveSpeed = 0.15;
    }
  }

  private updateCamera(): void {
    if (!this.mesh) return;

    // Calculate camera position based on character position and rotation
    const cameraOffset = new Vector3(
      Math.sin(this.cameraRotationY) * this.cameraDistance,
      this.cameraHeight + Math.sin(this.cameraRotationX) * 2,
      Math.cos(this.cameraRotationY) * this.cameraDistance
    );

    const targetCameraPosition = this.mesh.position.add(cameraOffset);
    
    // Smooth camera movement
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      targetCameraPosition,
      0.1
    );

    // Set camera target to character position
    const cameraTarget = this.mesh.position.add(new Vector3(0, 1, 0));
    this.camera.setTarget(cameraTarget);
  }

  private updateStats(): void {
    const now = Date.now();
    if (now - this.lastStatUpdate > 1000) {
      this.lastStatUpdate = now;
      
      // Natural stat changes
      this.stats.hydration = Math.max(0, this.stats.hydration - 0.5);
      this.stats.stamina = Math.min(100, this.stats.stamina + 1);
      
      // Health penalty for dehydration
      if (this.stats.hydration === 0) {
        this.stats.health = Math.max(0, this.stats.health - 0.5);
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

      if (healthElement) healthElement.textContent = `❤️ ${Math.round(this.stats.health)}`;
      if (hydrationElement) hydrationElement.textContent = `💧 ${Math.round(this.stats.hydration)}`;
      if (staminaElement) staminaElement.textContent = `⚡ ${Math.round(this.stats.stamina)}`;
      if (levelElement) levelElement.textContent = `⭐ Level ${this.stats.level}`;
    } catch (error) {
      console.warn("Failed to update HUD:", error);
    }
  }

  private updateState(): void {
    // Update player state based on current conditions
    this.state.canClimb = this.checkClimbableSurfaces();
    
    // Handle interaction
    if (this.inputState.interact) {
      this.handleInteraction();
    }
  }

  private checkClimbableSurfaces(): boolean {
    if (!this.mesh) return false;

    // Cast ray forward to check for climbable surfaces
    const ray = new Ray(
      this.mesh.position.add(new Vector3(0, 1, 0)),
      this.mesh.forward,
      3
    );

    const hit = this.scene.pickWithRay(ray);
    return !!(hit && hit.pickedMesh && hit.pickedMesh.name.includes("climbable"));
  }

  private handleInteraction(): void {
    if (!this.mesh) return;

    // Cast ray forward to detect interactable objects
    const ray = new Ray(
      this.mesh.position.add(new Vector3(0, 1, 0)),
      this.mesh.forward,
      5
    );

    const hit = this.scene.pickWithRay(ray);
    if (hit && hit.pickedMesh) {
      console.log(`Interacting with: ${hit.pickedMesh.name}`);
      // TODO: Implement specific interaction logic
      this.state.isInteracting = true;
      
      // Reset interaction state after a short delay
      setTimeout(() => {
        this.state.isInteracting = false;
      }, 500);
    }
  }

  private checkCollisions(): void {
    if (!this.mesh) return;

    // Check for dangerous surfaces (water, lava, etc.)
    const ray = new Ray(
      this.mesh.position.add(new Vector3(0, -0.5, 0)),
      Vector3.Down(),
      1
    );

    const hit = this.scene.pickWithRay(ray);
    if (hit && hit.pickedMesh && hit.pickedMesh.name.includes("dangerous")) {
      this.stats.health = Math.max(0, this.stats.health - 1);
    }
  }

  // Public methods for external access
  public getMesh(): Mesh | null {
    return this.mesh;
  }

  public getStats(): PlayerStats {
    return { ...this.stats };
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public getPosition(): Vector3 | null {
    return this.mesh ? this.mesh.position.clone() : null;
  }

  public heal(amount: number): void {
    this.stats.health = Math.min(100, this.stats.health + amount);
  }

  public addHydration(amount: number): void {
    this.stats.hydration = Math.min(100, this.stats.hydration + amount);
  }

  public addStamina(amount: number): void {
    this.stats.stamina = Math.min(100, this.stats.stamina + amount);
  }

  public addExperience(amount: number): void {
    this.stats.experience += amount;
    const newLevel = Math.floor(this.stats.experience / 100) + 1;
    if (newLevel > this.stats.level) {
      this.stats.level = newLevel;
      this.stats.health = 100; // Full heal on level up
      console.log(`Level up! You are now level ${this.stats.level}`);
    }
  }
}
