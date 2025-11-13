import { 
  Engine, 
  Scene, 
  Vector3, 
  HemisphericLight, 
  Color3, 
  MeshBuilder, 
  StandardMaterial, 
  UniversalCamera,
  DirectionalLight,
  ShadowGenerator,
  PBRMaterial,
  KeyboardEventTypes,
  PointerEventTypes,
  Matrix,
  Mesh,
  Texture,
  CubeTexture,
  GlowLayer,
  HighlightLayer,
  PostProcess,
  ImageProcessingConfiguration,
  Tools,
  Animation,
  EasingFunction,
  CircleEase,
  PhysicsImpostor,
  Ray,
  Quaternion,
  AnimationGroup,
  SubMesh,
  InstancedMesh,
  DynamicTexture,
  ProceduralTexture,
  NoiseProceduralTexture
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";
import { AdvancedCharacterSystem } from "./game/AdvancedCharacterSystem";
import { AdvancedWorldSystem, WorldConfig } from "./game/AdvancedWorldSystem";

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showError('An unexpected error occurred. Please refresh the page.');
});

function showError(message: string): void {
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #f44336, #d32f2f);
    color: white;
    padding: 30px;
    border-radius: 15px;
    font-family: 'Arial', sans-serif;
    z-index: 1000;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    if (document.body.contains(errorDiv)) {
      document.body.removeChild(errorDiv);
    }
  }, 5000);
}

// Advanced Game State
const gameState = {
    isRunning: false,
    isPaused: false,
  playerHealth: 100,
  playerStamina: 100,
  playerHydration: 100,
  playerLevel: 1,
  playerExperience: 0,
  graphicsQuality: 'ultra' as 'low' | 'medium' | 'high' | 'ultra',
  fps: 60,
    gameTime: 0,
  currentBiome: 'Western Ghats',
  weather: 'sunny',
  timeOfDay: 'day',
  
  // Story elements
  storyProgress: 0,
  currentMission: 'Find the Tusk of Ganesh',
  discoveredClues: 0,
  totalClues: 5,
  dialogueActive: false,
  currentDialogue: '',
  npcInteractions: 0,
  
  // Advanced features
  currentEnvironment: 'village',
  renderDistance: 3,
  chunkSize: 100
};

// Chloe Frazer Character Stats
const chloeStats = {
  name: 'Chloe Frazer',
  profession: 'Treasure Hunter',
  nationality: 'Australian-Indian',
  specialAbilities: ['Climbing', 'Puzzle Solving', 'Combat', 'Stealth'],
  inventory: ['Grappling Hook', 'Climbing Gear', 'Pistol', 'Notebook'],
  currentObjective: 'Locate the ancient temple and find the Tusk of Ganesh'
};

// Input state
const inputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  run: false,
  crouch: false,
  interact: false,
  mouseX: 0,
  mouseY: 0,
  mouseSensitivity: 0.002
};

// Player movement
const playerMovement = {
  velocity: Vector3.Zero(),
  speed: 0.15,
  runSpeed: 0.25,
  jumpForce: 0.8,
  gravity: -0.02,
  groundY: 1,
  isOnGround: true,
  canJump: true,
  lastJumpTime: 0,
  jumpCooldown: 500
};

// Game instances
let gameInstance: any = null;
let chloeCharacter: Mesh | null = null;
let playerCamera: UniversalCamera | null = null;
let characterSystem: AdvancedCharacterSystem | null = null;
let worldSystem: AdvancedWorldSystem | null = null;

// Story dialogue system
const storyDialogues = {
  intro: [
    "Chloe: 'The Western Ghats... This is where the legend begins.'",
    "Chloe: 'According to ancient texts, the Tusk of Ganesh was hidden here by the Hoysala dynasty.'",
    "Chloe: 'I need to find the temple first, then locate the entrance to the underground chambers.'"
  ],
  village_discovery: [
    "Chloe: 'A village! The locals might know something about the temple.'",
    "Chloe: 'I should talk to the villagers and gather information.'",
    "Chloe: 'The merchant looks like he might have some useful goods.'"
  ],
  temple_discovery: [
    "Chloe: 'There it is! The ancient Hoysala temple...'",
    "Chloe: 'The architecture is incredible. This must be from the 12th century.'",
    "Chloe: 'I can see the entrance. Let me check for any traps or mechanisms.'"
  ],
  clue_found: [
    "Chloe: 'Interesting... This inscription mentions a hidden passage.'",
    "Chloe: 'The symbols match the ones in my research. This is definitely the right place.'",
    "Chloe: 'I need to solve this puzzle to proceed further.'"
  ]
};

// Main initialization function
async function initializeGame(): Promise<void> {
  try {
    console.log('🚀 Starting Uncharted: The Lost Legacy - Advanced Indian Frontier...');
    
    const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error("Game canvas not found!");
    }

    console.log('✅ Canvas found');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

      // Check WebGL support
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
      throw new Error('WebGL is not supported in your browser.');
    }

    console.log('✅ WebGL support confirmed');

    // Create ultra-realistic engine
    const engine = new Engine(canvas, true, {
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
    console.log('✅ Ultra-realistic engine created');

    const scene = new Scene(engine);
    console.log('✅ Scene created');

    // Enable physics
    scene.enablePhysics();
    console.log('✅ Physics enabled');

    // Setup ultra-realistic lighting
    setupUltraRealisticLighting(scene);
    console.log('✅ Ultra-realistic lighting created');

    // Setup post-processing effects
    setupPostProcessing(scene);
    console.log('✅ Post-processing effects created');

    // Create camera
    playerCamera = new UniversalCamera("chloeCam", new Vector3(0, 5, -10), scene);
    playerCamera.setTarget(Vector3.Zero());
    playerCamera.attachControl(canvas, true);
    playerCamera.speed = 0.3;
    playerCamera.minZ = 0.1;
    playerCamera.maxZ = 1000;
    playerCamera.fov = Tools.ToRadians(60);
    console.log('✅ Camera created');

    // Create advanced world system
    const worldConfig: WorldConfig = {
      chunkSize: 100,
      renderDistance: 3,
      maxChunks: 25,
      enableDynamicLoading: true,
      enableLOD: true
    };
    
    worldSystem = new AdvancedWorldSystem(scene, worldConfig);
    console.log('✅ Advanced World System created');

    // Create advanced character system
    characterSystem = new AdvancedCharacterSystem(scene);
    console.log('✅ Advanced Character System created');

    // Get Chloe character
    const chloeData = characterSystem.getCharacter("chloe_frazer");
    if (chloeData) {
      chloeCharacter = chloeData.mesh;
      console.log('✅ Chloe Frazer character loaded');
    }

    // Create advanced HUD
    createAdvancedHUD();
    console.log('✅ Advanced HUD created');

    // Setup input handlers
    setupInputHandlers(scene);
    console.log('✅ Input handlers created');

    // Start story intro
    startStoryIntro();
    console.log('✅ Story intro started');

    // Start render loop
    engine.runRenderLoop(() => {
      updateGame(scene);
      scene.render();
    });
    console.log('✅ Render loop started');

    // Handle resize
    window.addEventListener("resize", () => {
      engine.resize();
    });

    gameInstance = { engine, scene, camera: playerCamera };
    gameState.isRunning = true;
    
    console.log('🎮 Uncharted: The Lost Legacy - Advanced Indian Frontier started successfully!');
    
    // Update loading screen
    updateLoadingProgress(100, "Welcome to Uncharted: The Lost Legacy - Advanced Indian Frontier!");
    
  } catch (error) {
    console.error('❌ Failed to start game:', error);
    showError(`Failed to start game: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function setupUltraRealisticLighting(scene: Scene): void {
    // Main directional light (sun)
  const sunLight = new DirectionalLight("sunLight", new Vector3(-1, -2, -1), scene);
    sunLight.intensity = 1.0;
    sunLight.position = new Vector3(50, 100, 50);
    sunLight.diffuse = new Color3(1, 0.95, 0.8);
    sunLight.specular = new Color3(1, 0.95, 0.8);

    // Advanced shadows
  const shadowGenerator = new ShadowGenerator(4096, sunLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 64;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.bias = 0.00001;
    shadowGenerator.normalBias = 0.02;
    shadowGenerator.darkness = 0.4;
  shadowGenerator.forceBackFacesOnly = false;
  shadowGenerator.usePercentageCloserFiltering = true;
  shadowGenerator.transparencyShadow = true;

    // Ambient light
  const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.3;
    ambientLight.diffuse = new Color3(0.4, 0.6, 0.8);
    ambientLight.specular = new Color3(0.2, 0.3, 0.4);
    ambientLight.groundColor = new Color3(0.2, 0.3, 0.2);

  // Fill lights for better illumination
  const fillLight1 = new DirectionalLight("fillLight1", new Vector3(1, -1, 1), scene);
  fillLight1.intensity = 0.2;
  fillLight1.diffuse = new Color3(0.8, 0.8, 1);

  const fillLight2 = new DirectionalLight("fillLight2", new Vector3(-1, -1, -1), scene);
  fillLight2.intensity = 0.15;
  fillLight2.diffuse = new Color3(1, 0.8, 0.8);

  // Store shadow generator globally
  (window as any).shadowGenerator = shadowGenerator;
}

function setupPostProcessing(scene: Scene): void {
    try {
      // Glow layer for emissive materials
    const glowLayer = new GlowLayer("glowLayer", scene);
    glowLayer.intensity = 1.0;

      // Highlight layer for interactive objects
    const highlightLayer = new HighlightLayer("highlightLayer", scene, {
        mainTextureRatio: 0.5,
        blurHorizontalSize: 0.3,
        blurVerticalSize: 0.3,
        alphaBlendingMode: 1
      });

    // Setup image processing
    const imageProcessing = scene.imageProcessingConfiguration;
    if (imageProcessing) {
      imageProcessing.colorGradingEnabled = true;
      imageProcessing.toneMappingEnabled = true;
      imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
      imageProcessing.exposure = 1.0;
      imageProcessing.contrast = 1.1;
    }

    console.log('✅ Post-processing effects initialized');
    } catch (error) {
    console.warn('⚠️ Post-processing setup failed:', error);
  }
}

function createAdvancedHUD(): void {
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

  // Character info panel
  const characterPanel = document.createElement("div");
  characterPanel.style.cssText = `
        position: absolute;
        top: 20px;
    left: 20px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
        color: white;
    padding: 20px;
        border-radius: 15px;
    border: 2px solid #ffd700;
    min-width: 300px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      `;
  characterPanel.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold; color: #ffd700; font-size: 18px; text-align: center;">Chloe Frazer</div>
    <div style="margin-bottom: 8px;">❤️ Health: <span id="health">100</span></div>
    <div style="margin-bottom: 8px;">⚡ Stamina: <span id="stamina">100</span></div>
    <div style="margin-bottom: 8px;">⭐ Level: <span id="level">1</span></div>
    <div style="margin-bottom: 8px;">🔍 Clues Found: <span id="clues">0/5</span></div>
    <div style="margin-bottom: 8px;">🎯 Mission: <span id="mission">Find the Tusk of Ganesh</span></div>
    <div style="margin-bottom: 8px;">🌍 Environment: <span id="environment">Village</span></div>
  `;

  // Story dialogue panel
  const dialoguePanel = document.createElement("div");
  dialoguePanel.id = "dialogue-panel";
  dialoguePanel.style.cssText = `
    position: absolute;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
    color: white;
    padding: 20px;
    border-radius: 15px;
    border: 2px solid #ffd700;
    max-width: 600px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: none;
    text-align: center;
    font-size: 16px;
    line-height: 1.5;
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
      <div><span class="key">Ctrl/C</span> - Crouch</div>
          <div><span class="key">G</span> - Graphics</div>
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
  hudContainer.appendChild(characterPanel);
  hudContainer.appendChild(dialoguePanel);
      hudContainer.appendChild(controlsPanel);
      document.body.appendChild(hudContainer);
}

function startStoryIntro(): void {
  setTimeout(() => {
    showDialogue(storyDialogues.intro[0]);
  }, 2000);
  
  setTimeout(() => {
    showDialogue(storyDialogues.intro[1]);
  }, 6000);
  
  setTimeout(() => {
    showDialogue(storyDialogues.intro[2]);
  }, 10000);
}

function showDialogue(text: string): void {
  const dialoguePanel = document.getElementById("dialogue-panel");
  if (dialoguePanel) {
    dialoguePanel.textContent = text;
    dialoguePanel.style.display = "block";
    gameState.dialogueActive = true;
    
    // Hide dialogue after 4 seconds
    setTimeout(() => {
      dialoguePanel.style.display = "none";
      gameState.dialogueActive = false;
    }, 4000);
  }
}

// FIXED INPUT HANDLERS
function setupInputHandlers(scene: Scene): void {
  console.log('Setting up input handlers...');
  
  // Keyboard controls
  scene.onKeyboardObservable.add((kbInfo) => {
    const key = kbInfo.event.key.toLowerCase();
    const isKeyDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;
    
    console.log(`Key: ${key}, Down: ${isKeyDown}`); // Debug log
    
    switch (key) {
      case "w":
      case "arrowup":
        inputState.forward = isKeyDown;
        break;
      case "s":
      case "arrowdown":
        inputState.back = isKeyDown;
        break;
      case "a":
      case "arrowleft":
        inputState.left = isKeyDown;
        break;
      case "d":
      case "arrowright":
        inputState.right = isKeyDown;
        break;
      case " ":
        inputState.jump = isKeyDown;
        break;
      case "shift":
        inputState.run = isKeyDown;
        break;
      case "control":
      case "c":
        inputState.crouch = isKeyDown;
          break;
      case "e":
      case "f":
        inputState.interact = isKeyDown;
          break;
      case "escape":
        togglePause();
          break;
      case "g":
        toggleGraphicsQuality();
          break;
      }
  });

  // Mouse controls
  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERMOVE:
        if (pointerInfo.event.movementX !== undefined) {
          inputState.mouseX += pointerInfo.event.movementX * inputState.mouseSensitivity;
        }
        if (pointerInfo.event.movementY !== undefined) {
          inputState.mouseY -= pointerInfo.event.movementY * inputState.mouseSensitivity;
          inputState.mouseY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, inputState.mouseY));
        }
        break;
    }
  });

  console.log('Input handlers setup complete');
}

function updateGame(scene: Scene): void {
  if (gameState.isPaused) return;

  const currentTime = Date.now();
  gameState.gameTime += 16;

  // Update Chloe character
  if (chloeCharacter && playerCamera) {
    updateChloeCharacter(chloeCharacter, playerCamera);
  }

  // Update character system
  if (characterSystem) {
    characterSystem.updateCharacters(16);
  }

  // Update world system
  if (worldSystem && chloeCharacter) {
    worldSystem.updatePlayerPosition(chloeCharacter.position);
  }

  // Update player stats
  if (currentTime % 1000 < 16) {
    gameState.playerHydration = Math.max(0, gameState.playerHydration - 0.5);
    gameState.playerStamina = Math.min(100, gameState.playerStamina + 1);
    
    if (gameState.playerHydration === 0) {
      gameState.playerHealth = Math.max(0, gameState.playerHealth - 0.5);
    }
  }

  // Update environment based on player position
  updateCurrentEnvironment();

  // Update HUD
  updateHUD();
}

function updateChloeCharacter(character: Mesh, camera: UniversalCamera): void {
  const currentSpeed = inputState.run ? playerMovement.runSpeed : playerMovement.speed;
  
  // Calculate movement direction
  let moveDirection = Vector3.Zero();
  
  if (inputState.forward) moveDirection.addInPlace(Vector3.Forward());
  if (inputState.back) moveDirection.addInPlace(Vector3.Backward());
  if (inputState.left) moveDirection.addInPlace(Vector3.Left());
  if (inputState.right) moveDirection.addInPlace(Vector3.Right());

  if (!moveDirection.equals(Vector3.Zero())) {
    // Rotate movement direction based on camera Y rotation
    const rotationMatrix = Matrix.RotationY(inputState.mouseX);
    moveDirection = Vector3.TransformNormal(moveDirection, rotationMatrix);
    moveDirection.normalize();
    
    // Apply movement
    const movement = moveDirection.scale(currentSpeed);
    character.position.addInPlace(movement);
    
    // Rotate character to face movement direction
    if (moveDirection.length() > 0.1) {
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      character.rotation.y = targetRotation;
    }
    
    // Consume stamina when running
    if (inputState.run) {
      gameState.playerStamina = Math.max(0, gameState.playerStamina - 0.5);
    }
  }

  // Handle jumping
  if (inputState.jump && playerMovement.isOnGround && playerMovement.canJump && gameState.playerStamina > 20) {
    const now = Date.now();
    if (now - playerMovement.lastJumpTime > playerMovement.jumpCooldown) {
      playerMovement.velocity.y = playerMovement.jumpForce;
      playerMovement.isOnGround = false;
      playerMovement.canJump = false;
      playerMovement.lastJumpTime = now;
      gameState.playerStamina -= 20;
    }
  }

  // Apply gravity
  playerMovement.velocity.y += playerMovement.gravity;
  character.position.y += playerMovement.velocity.y;

  // Ground collision
  if (character.position.y <= playerMovement.groundY) {
    character.position.y = playerMovement.groundY;
    playerMovement.velocity.y = 0;
    playerMovement.isOnGround = true;
    playerMovement.canJump = true;
  }

  // Handle crouching
  if (inputState.crouch && !gameState.isPaused) {
    character.scaling.y = 0.7;
    playerMovement.speed = 0.075;
  } else {
    character.scaling.y = 1;
    playerMovement.speed = 0.15;
  }

  // Update camera to follow Chloe
  const cameraOffset = new Vector3(
    Math.sin(inputState.mouseX) * 8,
    5 + Math.sin(inputState.mouseY) * 2,
    Math.cos(inputState.mouseX) * 8
  );

  const targetCameraPosition = character.position.add(cameraOffset);
  camera.position = Vector3.Lerp(camera.position, targetCameraPosition, 0.1);

  const cameraTarget = character.position.add(new Vector3(0, 1, 0));
  camera.setTarget(cameraTarget);

  // Handle interaction
  if (inputState.interact) {
    handleInteraction(character);
  }
}

function updateCurrentEnvironment(): void {
  if (!chloeCharacter) return;

  const distance = Math.sqrt(chloeCharacter.position.x * chloeCharacter.position.x + chloeCharacter.position.z * chloeCharacter.position.z);
  
  let newEnvironment = 'village';
  if (distance < 100) {
    newEnvironment = 'village';
  } else if (distance < 300) {
    newEnvironment = 'forest';
  } else if (distance < 500) {
    newEnvironment = 'mountains';
  } else {
    newEnvironment = 'temple';
  }

  if (newEnvironment !== gameState.currentEnvironment) {
    gameState.currentEnvironment = newEnvironment;
    console.log(`🌍 Environment changed to: ${newEnvironment}`);
    
    // Show environment-specific dialogue
    showEnvironmentDialogue(newEnvironment);
  }
}

function showEnvironmentDialogue(environment: string): void {
  let dialogue = '';
  
  switch (environment) {
    case 'village':
      dialogue = storyDialogues.village_discovery[Math.floor(Math.random() * storyDialogues.village_discovery.length)];
      break;
    case 'forest':
      dialogue = "Chloe: 'The forest is dense and mysterious. I need to be careful here.'";
      break;
    case 'mountains':
      dialogue = "Chloe: 'The mountains are treacherous. The temple must be nearby.'";
      break;
    case 'temple':
      dialogue = storyDialogues.temple_discovery[Math.floor(Math.random() * storyDialogues.temple_discovery.length)];
      break;
  }
  
  if (dialogue) {
    showDialogue(dialogue);
  }
}

function handleInteraction(character: Mesh): void {
  if (!characterSystem) return;

  // Check for nearby NPCs
  const allCharacters = characterSystem.getAllCharacters();
  allCharacters.forEach((npc: any, name: string) => {
    if (npc.type === 'npc') {
      const distance = Vector3.Distance(character.position, npc.mesh.position);
      if (distance < 5) {
        characterSystem?.startDialogue(name);
        gameState.npcInteractions++;
      }
    }
  });
}

function updateHUD(): void {
  try {
    const healthElement = document.getElementById("health") as HTMLSpanElement;
    const staminaElement = document.getElementById("stamina") as HTMLSpanElement;
    const levelElement = document.getElementById("level") as HTMLSpanElement;
    const cluesElement = document.getElementById("clues") as HTMLSpanElement;
    const missionElement = document.getElementById("mission") as HTMLSpanElement;
    const environmentElement = document.getElementById("environment") as HTMLSpanElement;

    if (healthElement) healthElement.textContent = Math.round(gameState.playerHealth).toString();
    if (staminaElement) staminaElement.textContent = Math.round(gameState.playerStamina).toString();
    if (levelElement) levelElement.textContent = gameState.playerLevel.toString();
    if (cluesElement) cluesElement.textContent = `${gameState.discoveredClues}/${gameState.totalClues}`;
    if (missionElement) missionElement.textContent = gameState.currentMission;
    if (environmentElement) environmentElement.textContent = gameState.currentEnvironment.charAt(0).toUpperCase() + gameState.currentEnvironment.slice(1);
  } catch (error) {
    console.warn("Failed to update HUD:", error);
  }
}

function togglePause(): void {
  gameState.isPaused = !gameState.isPaused;
  console.log(`Game ${gameState.isPaused ? 'paused' : 'resumed'}`);
}

function toggleGraphicsQuality(): void {
  const qualities: Array<'low' | 'medium' | 'high' | 'ultra'> = ['low', 'medium', 'high', 'ultra'];
  const currentIndex = qualities.indexOf(gameState.graphicsQuality);
  const nextIndex = (currentIndex + 1) % qualities.length;
  gameState.graphicsQuality = qualities[nextIndex];
  
  console.log(`Graphics quality changed to: ${gameState.graphicsQuality}`);
}

// Loading progress update function
function updateLoadingProgress(progress: number, status: string): void {
  const loadingBar = document.getElementById('loading-progress-bar');
  const loadingText = document.getElementById('loading-progress-text');
  const loadingStatus = document.getElementById('loading-status');
  
  if (loadingBar) {
    loadingBar.style.width = progress + '%';
  }
  
  if (loadingText) {
    loadingText.textContent = `Loading... ${progress}%`;
  }
  
  if (loadingStatus) {
    loadingStatus.textContent = status;
  }
}

// Simulate loading progress
function simulateLoading(): void {
  const loadingSteps = [
    { progress: 10, status: "Initializing Uncharted: The Lost Legacy engine..." },
    { progress: 25, status: "Loading Chloe Frazer character model..." },
    { progress: 40, status: "Generating Western Ghats environment..." },
    { progress: 55, status: "Creating ancient Hoysala temple..." },
    { progress: 70, status: "Setting up story elements and dialogue..." },
    { progress: 85, status: "Optimizing ultra-realistic graphics..." },
    { progress: 95, status: "Preparing adventure for Chloe Frazer..." }
  ];

  let step = 0;
  const interval = setInterval(() => {
    if (step < loadingSteps.length) {
      const { progress, status } = loadingSteps[step];
      updateLoadingProgress(progress, status);
      step++;
    } else {
      clearInterval(interval);
    }
  }, 800);
}

// Handle window resize
function handleResize(): void {
  if (gameInstance && gameInstance.engine) {
    gameInstance.engine.resize();
  }
}

// Handle visibility change
function handleVisibilityChange(): void {
  if (document.hidden) {
    console.log('Game paused - tab is hidden');
  } else {
    console.log('Game resumed - tab is visible');
  }
}

// Start game function (called from HTML)
function startGame(): void {
  try {
    console.log('🎮 Starting Uncharted: The Lost Legacy - Advanced Indian Frontier...');
    
    // Hide instructions
    const gameInstructions = document.getElementById('game-instructions');
    if (gameInstructions) {
      gameInstructions.style.display = 'none';
    }

    // Start loading simulation
    simulateLoading();

    // Initialize game after a short delay
    setTimeout(() => {
      initializeGame();
    }, 1000);

  } catch (error) {
    console.error('Failed to start game:', error);
    showError('Failed to start game. Please refresh the page and try again.');
  }
}

// Event listeners
window.addEventListener("DOMContentLoaded", () => {
  console.log('📄 DOM loaded, setting up event listeners...');
  
  // Set up global event listeners
  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  
  // Prevent context menu on right click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  console.log('✅ Event listeners set up successfully');
});

// Export for global access
(window as any).startGame = startGame;
