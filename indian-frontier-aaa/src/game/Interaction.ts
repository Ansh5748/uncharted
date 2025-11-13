import { 
  Scene, 
  Vector3, 
  Ray, 
  AbstractMesh, 
  StandardMaterial, 
  Color3, 
  MeshBuilder,
  Mesh,
  Animation,
  EasingFunction,
  CircleEase,
  PointerEventTypes,
  KeyboardEventTypes
} from "@babylonjs/core";
import { Player } from "./Player";

export interface InteractableObject {
  mesh: AbstractMesh;
  type: InteractionType;
  name: string;
  description: string;
  action: () => void;
  isActive: boolean;
  highlightMaterial?: StandardMaterial;
  originalMaterial?: any;
}

export enum InteractionType {
  PICKUP = "pickup",
  DOOR = "door",
  LADDER = "ladder",
  CHEST = "chest",
  NPC = "npc",
  WATER = "water",
  FOOD = "food",
  WEAPON = "weapon",
  CLIMBABLE = "climbable"
}

export interface InteractionPrompt {
  element: HTMLElement;
  isVisible: boolean;
  targetObject: InteractableObject | null;
}

export class Interaction {
  private interactableObjects: Map<string, InteractableObject> = new Map();
  private currentTarget: InteractableObject | null = null;
  private interactionPrompt: InteractionPrompt;
  private interactionRange = 5;
  private highlightColor = new Color3(1, 1, 0); // Yellow highlight
  private isInteracting = false;
  private interactionCooldown = 500; // ms
  private lastInteractionTime = 0;

  constructor(private scene: Scene, private player: Player) {
    this.interactionPrompt = this.createInteractionPrompt();
    this.setupInteractionInput();
  }

  public async init(): Promise<void> {
    try {
      await this.createDefaultInteractables();
      this.startInteractionLoop();
      console.log("Interaction system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize interaction system:", error);
      throw error;
    }
  }

  private createInteractionPrompt(): InteractionPrompt {
    // Create interaction prompt UI
    const promptElement = document.createElement("div");
    promptElement.id = "interaction-prompt";
    promptElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: 'Arial', sans-serif;
      font-size: 16px;
      z-index: 1000;
      display: none;
      border: 2px solid #ffd700;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    `;
    promptElement.innerHTML = "Press E to interact";
    document.body.appendChild(promptElement);

    return {
      element: promptElement,
      isVisible: false,
      targetObject: null
    };
  }

  private setupInteractionInput(): void {
    // Handle interaction key press
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        const key = kbInfo.event.key.toLowerCase();
        if ((key === "e" || key === "f") && this.currentTarget && !this.isInteracting) {
          this.performInteraction(this.currentTarget);
        }
      }
    });
  }

  private async createDefaultInteractables(): Promise<void> {
    // Create some default interactable objects in the world
    
    // Water source (for hydration)
    const waterSource = this.createWaterSource(new Vector3(20, 0, 20));
    
    // Food items
    const foodItem1 = this.createFoodItem(new Vector3(-15, 1, 15), "Mango", 25);
    const foodItem2 = this.createFoodItem(new Vector3(25, 1, -10), "Coconut", 30);
    
    // Climbable surfaces
    const climbableWall = this.createClimbableSurface(new Vector3(0, 0, 30));
    
    // Treasure chest
    const treasureChest = this.createTreasureChest(new Vector3(-30, 0, -20));
    
    // Door
    const door = this.createDoor(new Vector3(40, 0, 0));
  }

  private createWaterSource(position: Vector3): InteractableObject {
    const waterMesh = MeshBuilder.CreateCylinder("waterSource", { 
      diameter: 2, 
      height: 1 
    }, this.scene);
    waterMesh.position = position;
    
    const waterMat = new StandardMaterial("waterSourceMat", this.scene);
    waterMat.diffuseColor = new Color3(0.2, 0.4, 0.8);
    waterMat.alpha = 0.7;
    waterMesh.material = waterMat;

    const interactable: InteractableObject = {
      mesh: waterMesh,
      type: InteractionType.WATER,
      name: "Sacred Water Source",
      description: "A pure water source. Drink to restore hydration.",
      action: () => {
        const playerStats = this.player.getStats();
        if (playerStats.hydration < 100) {
          this.player.addHydration(50);
          this.showNotification("💧 Hydration restored!", "success");
        } else {
          this.showNotification("You're already fully hydrated.", "info");
        }
      },
      isActive: true
    };

    this.addInteractable(interactable);
    return interactable;
  }

  private createFoodItem(position: Vector3, name: string, nutritionValue: number): InteractableObject {
    const foodMesh = MeshBuilder.CreateSphere("foodItem", { diameter: 0.5 }, this.scene);
    foodMesh.position = position;
    
    const foodMat = new StandardMaterial("foodMat", this.scene);
    foodMat.diffuseColor = new Color3(0.8, 0.6, 0.2);
    foodMesh.material = foodMat;

    const interactable: InteractableObject = {
      mesh: foodMesh,
      type: InteractionType.FOOD,
      name: name,
      description: `A fresh ${name.toLowerCase()}. Eat to restore health and stamina.`,
      action: () => {
        this.player.heal(nutritionValue);
        this.player.addStamina(nutritionValue * 0.5);
        this.player.addExperience(10);
        this.showNotification(`🍎 Ate ${name}! Health and stamina restored.`, "success");
        
        // Remove the food item after consumption
        this.removeInteractable(interactable);
        foodMesh.dispose();
      },
      isActive: true
    };

    this.addInteractable(interactable);
    return interactable;
  }

  private createClimbableSurface(position: Vector3): InteractableObject {
    const wallMesh = MeshBuilder.CreateBox("climbableWall", { 
      width: 4, 
      height: 8, 
      depth: 0.5 
    }, this.scene);
    wallMesh.position = position;
    wallMesh.name = "climbable"; // Important for climbing detection
    
    const wallMat = new StandardMaterial("wallMat", this.scene);
    wallMat.diffuseColor = new Color3(0.6, 0.6, 0.6);
    wallMesh.material = wallMat;

    const interactable: InteractableObject = {
      mesh: wallMesh,
      type: InteractionType.CLIMBABLE,
      name: "Climbable Wall",
      description: "A sturdy wall that can be climbed.",
      action: () => {
        this.showNotification("🧗 Climbing wall...", "info");
        // TODO: Implement climbing mechanics
      },
      isActive: true
    };

    this.addInteractable(interactable);
    return interactable;
  }

  private createTreasureChest(position: Vector3): InteractableObject {
    const chestMesh = MeshBuilder.CreateBox("treasureChest", { 
      width: 1.5, 
      height: 1, 
      depth: 1 
    }, this.scene);
    chestMesh.position = position;
    
    const chestMat = new StandardMaterial("chestMat", this.scene);
    chestMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
    chestMesh.material = chestMat;

    const interactable: InteractableObject = {
      mesh: chestMesh,
      type: InteractionType.CHEST,
      name: "Ancient Treasure Chest",
      description: "An old chest that might contain valuable items.",
      action: () => {
        this.player.addExperience(50);
        this.showNotification("💎 Found treasure! +50 XP", "success");
        
        // Animate chest opening
        this.animateChestOpening(chestMesh);
      },
      isActive: true
    };

    this.addInteractable(interactable);
    return interactable;
  }

  private createDoor(position: Vector3): InteractableObject {
    const doorMesh = MeshBuilder.CreateBox("door", { 
      width: 2, 
      height: 3, 
      depth: 0.2 
    }, this.scene);
    doorMesh.position = position;
    
    const doorMat = new StandardMaterial("doorMat", this.scene);
    doorMat.diffuseColor = new Color3(0.3, 0.2, 0.1);
    doorMesh.material = doorMat;

    const interactable: InteractableObject = {
      mesh: doorMesh,
      type: InteractionType.DOOR,
      name: "Temple Door",
      description: "A heavy wooden door leading to an ancient temple.",
      action: () => {
        this.showNotification("🚪 Door opened!", "info");
        // TODO: Implement door opening animation and teleportation
      },
      isActive: true
    };

    this.addInteractable(interactable);
    return interactable;
  }

  private animateChestOpening(chestMesh: Mesh): void {
    const openAnimation = new Animation(
      "chestOpen",
      "rotation.z",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keyFrames = [];
    keyFrames.push({ frame: 0, value: 0 });
    keyFrames.push({ frame: 30, value: Math.PI / 4 });

    openAnimation.setKeys(keyFrames);
    chestMesh.animations = [openAnimation];
    
    this.scene.beginAnimation(chestMesh, 0, 30, false);
  }

  private startInteractionLoop(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      this.updateInteractionDetection();
    });
  }

  private updateInteractionDetection(): void {
    const playerPosition = this.player.getPosition();
    if (!playerPosition) return;

    let closestObject: InteractableObject | null = null;
    let closestDistance = this.interactionRange;

    // Check all interactable objects
    for (const [id, interactable] of this.interactableObjects) {
      if (!interactable.isActive) continue;

      const distance = Vector3.Distance(playerPosition, interactable.mesh.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestObject = interactable;
      }
    }

    // Update current target and UI
    if (closestObject !== this.currentTarget) {
      this.setCurrentTarget(closestObject);
    }
  }

  private setCurrentTarget(target: InteractableObject | null): void {
    // Remove highlight from previous target
    if (this.currentTarget && this.currentTarget.highlightMaterial) {
      this.currentTarget.mesh.material = this.currentTarget.originalMaterial;
    }

    this.currentTarget = target;

    // Add highlight to new target
    if (target) {
      this.highlightObject(target);
      this.showInteractionPrompt(target);
    } else {
      this.hideInteractionPrompt();
    }
  }

  private highlightObject(interactable: InteractableObject): void {
    if (!interactable.mesh.material) return;

    // Store original material
    interactable.originalMaterial = interactable.mesh.material;

    // Create highlight material
    const highlightMat = new StandardMaterial("highlightMat", this.scene);
    highlightMat.diffuseColor = this.highlightColor;
    highlightMat.emissiveColor = this.highlightColor.scale(0.3);
    highlightMat.alpha = 0.8;

    interactable.highlightMaterial = highlightMat;
    interactable.mesh.material = highlightMat;
  }

  private showInteractionPrompt(interactable: InteractableObject): void {
    if (this.interactionPrompt.isVisible) return;

    this.interactionPrompt.element.innerHTML = `
      <div style="text-align: center;">
        <div style="font-weight: bold; margin-bottom: 5px;">${interactable.name}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 10px;">${interactable.description}</div>
        <div style="color: #ffd700;">Press E to interact</div>
      </div>
    `;
    this.interactionPrompt.element.style.display = "block";
    this.interactionPrompt.isVisible = true;
    this.interactionPrompt.targetObject = interactable;
  }

  private hideInteractionPrompt(): void {
    if (!this.interactionPrompt.isVisible) return;

    this.interactionPrompt.element.style.display = "none";
    this.interactionPrompt.isVisible = false;
    this.interactionPrompt.targetObject = null;
  }

  private performInteraction(interactable: InteractableObject): void {
    const now = Date.now();
    if (now - this.lastInteractionTime < this.interactionCooldown) return;

    this.lastInteractionTime = now;
    this.isInteracting = true;

    try {
      // Execute the interaction action
      interactable.action();
      
      // Add interaction feedback
      this.addInteractionFeedback(interactable.mesh.position);
      
    } catch (error) {
      console.error("Interaction failed:", error);
      this.showNotification("Interaction failed!", "error");
    } finally {
      // Reset interaction state after a delay
      setTimeout(() => {
        this.isInteracting = false;
      }, 300);
    }
  }

  private addInteractionFeedback(position: Vector3): void {
    // Create a visual feedback effect at the interaction point
    const feedbackMesh = MeshBuilder.CreateSphere("feedback", { diameter: 0.5 }, this.scene);
    feedbackMesh.position = position.add(new Vector3(0, 2, 0));
    
    const feedbackMat = new StandardMaterial("feedbackMat", this.scene);
    feedbackMat.diffuseColor = new Color3(1, 1, 0);
    feedbackMat.emissiveColor = new Color3(1, 1, 0);
    feedbackMat.alpha = 0.8;
    feedbackMesh.material = feedbackMat;

    // Animate the feedback
    const feedbackAnimation = new Animation(
      "feedbackAnim",
      "scaling",
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keyFrames = [];
    keyFrames.push({ frame: 0, value: new Vector3(0, 0, 0) });
    keyFrames.push({ frame: 15, value: new Vector3(2, 2, 2) });
    keyFrames.push({ frame: 30, value: new Vector3(0, 0, 0) });

    feedbackAnimation.setKeys(keyFrames);
    feedbackMesh.animations = [feedbackAnimation];
    
    this.scene.beginAnimation(feedbackMesh, 0, 30, false, 1, () => {
      feedbackMesh.dispose();
    });
  }

  private showNotification(message: string, type: "success" | "error" | "info"): void {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      z-index: 1001;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Public methods for external access
  public addInteractable(interactable: InteractableObject): void {
    const id = `${interactable.type}_${interactable.mesh.name}_${Date.now()}`;
    this.interactableObjects.set(id, interactable);
  }

  public removeInteractable(interactable: InteractableObject): void {
    for (const [id, obj] of this.interactableObjects) {
      if (obj === interactable) {
        this.interactableObjects.delete(id);
        break;
      }
    }
  }

  public getCurrentTarget(): InteractableObject | null {
    return this.currentTarget;
  }

  public isInteractionAvailable(): boolean {
    return this.currentTarget !== null && !this.isInteracting;
  }

  public getInteractableCount(): number {
    return this.interactableObjects.size;
  }
}
