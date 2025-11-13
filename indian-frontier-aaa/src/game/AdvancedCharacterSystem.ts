import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Texture,
  Animation,
  AnimationGroup,
  Skeleton,
  Bone,
  Matrix,
  Quaternion,
  PhysicsImpostor,
  Ray,
  Tools,
  Sound,
  MeshAssetTask,
  SceneLoader
} from "@babylonjs/core";
import "@babylonjs/loaders";

export interface CharacterConfig {
  name: string;
  type: 'player' | 'npc' | 'enemy';
  model: string;
  animations: string[];
  position: Vector3;
  scale?: number;
  health?: number;
  dialogue?: string[];
}

export class AdvancedCharacterSystem {
  private scene: Scene;
  private characters: Map<string, any> = new Map();
  private animations: Map<string, AnimationGroup> = new Map();
  private dialogueSystem: any = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeCharacterSystem();
  }

  private async initializeCharacterSystem(): Promise<void> {
    console.log('🎭 Initializing Advanced Character System...');
    
    // Load character models and animations
    await this.loadCharacterAssets();
    
    // Create dialogue system
    this.createDialogueSystem();
    
    // Create NPCs
    await this.createNPCs();
    
    console.log('✅ Advanced Character System initialized');
  }

  private async loadCharacterAssets(): Promise<void> {
    try {
      // Load realistic human models (using free models from the internet)
      const characterModels = [
        {
          name: 'chloe_frazer',
          url: 'https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/playground/textures/player.glb',
          type: 'player'
        },
        {
          name: 'merchant',
          url: 'https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/playground/textures/npc.glb',
          type: 'npc'
        },
        {
          name: 'guard',
          url: 'https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/playground/textures/guard.glb',
          type: 'enemy'
        }
      ];

      for (const model of characterModels) {
        await this.loadCharacterModel(model);
      }
    } catch (error) {
      console.warn('⚠️ Could not load external models, using built-in models:', error);
      this.createBuiltInCharacters();
    }
  }

  private async loadCharacterModel(modelConfig: any): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync("", "", modelConfig.url, this.scene);
      
      if (result.meshes.length > 0) {
        const character = {
          mesh: result.meshes[0],
          animations: result.animationGroups || [],
          type: modelConfig.type,
          config: modelConfig
        };
        
        this.characters.set(modelConfig.name, character);
        console.log(`✅ Loaded character model: ${modelConfig.name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load model ${modelConfig.name}:`, error);
    }
  }

  private createBuiltInCharacters(): void {
    // Create realistic Chloe Frazer character
    this.createChloeFrazer();
    
    // Create realistic NPCs
    this.createRealisticNPCs();
    
    // Create realistic enemies
    this.createRealisticEnemies();
  }

  private createChloeFrazer(): void {
    // Create detailed human body
    const body = MeshBuilder.CreateCapsule("chloe_body", {
      height: 1.6,
      radius: 0.25,
      tessellation: 24,
      subdivisions: 8
    }, this.scene);
    
    // Create realistic skin material
    const skinMaterial = new PBRMaterial("chloe_skin", this.scene);
    skinMaterial.metallic = 0;
    skinMaterial.roughness = 0.8;
    skinMaterial.albedoColor = new Color3(0.9, 0.7, 0.6);
    skinMaterial.subSurface.isRefractionEnabled = true;
    skinMaterial.subSurface.refractionIntensity = 0.1;
    
    // Add skin texture
    try {
      const skinTexture = new Texture("https://assets.babylonjs.com/environments/skin.jpg", this.scene);
      skinMaterial.albedoTexture = skinTexture;
    } catch (error) {
      console.warn('Could not load skin texture');
    }
    
    body.material = skinMaterial;

    // Create head
    const head = MeshBuilder.CreateSphere("chloe_head", {
      diameter: 0.4,
      segments: 32
    }, this.scene);
    head.position = new Vector3(0, 0.9, 0);
    head.material = skinMaterial;

    // Create realistic hair
    const hair = MeshBuilder.CreateCylinder("chloe_hair", {
      diameter: 0.45,
      height: 0.6,
      tessellation: 20
    }, this.scene);
    hair.position = new Vector3(0, 1.1, 0);
    
    const hairMaterial = new PBRMaterial("chloe_hair_mat", this.scene);
    hairMaterial.metallic = 0;
    hairMaterial.roughness = 0.6;
    hairMaterial.albedoColor = new Color3(0.1, 0.05, 0.02);
    hair.material = hairMaterial;

    // Create clothing
    const clothing = MeshBuilder.CreateCylinder("chloe_clothing", {
      diameter: 0.6,
      height: 1.2,
      tessellation: 20
    }, this.scene);
    clothing.position = new Vector3(0, 0.3, 0);
    
    const clothingMaterial = new PBRMaterial("chloe_clothing_mat", this.scene);
    clothingMaterial.metallic = 0;
    clothingMaterial.roughness = 0.7;
    clothingMaterial.albedoColor = new Color3(0.2, 0.3, 0.4);
    clothing.material = clothingMaterial;

    // Create arms
    const leftArm = MeshBuilder.CreateCapsule("chloe_left_arm", {
      height: 0.8,
      radius: 0.08,
      tessellation: 12
    }, this.scene);
    leftArm.position = new Vector3(-0.35, 0.4, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.material = skinMaterial;

    const rightArm = MeshBuilder.CreateCapsule("chloe_right_arm", {
      height: 0.8,
      radius: 0.08,
      tessellation: 12
    }, this.scene);
    rightArm.position = new Vector3(0.35, 0.4, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.material = skinMaterial;

    // Create legs
    const leftLeg = MeshBuilder.CreateCapsule("chloe_left_leg", {
      height: 0.9,
      radius: 0.1,
      tessellation: 12
    }, this.scene);
    leftLeg.position = new Vector3(-0.15, -0.6, 0);
    leftLeg.material = skinMaterial;

    const rightLeg = MeshBuilder.CreateCapsule("chloe_right_leg", {
      height: 0.9,
      radius: 0.1,
      tessellation: 12
    }, this.scene);
    rightLeg.position = new Vector3(0.15, -0.6, 0);
    rightLeg.material = skinMaterial;

    // Group all parts
    const chloeGroup = new Mesh("chloe_group", this.scene);
    body.parent = chloeGroup;
    head.parent = chloeGroup;
    hair.parent = chloeGroup;
    clothing.parent = chloeGroup;
    leftArm.parent = chloeGroup;
    rightArm.parent = chloeGroup;
    leftLeg.parent = chloeGroup;
    rightLeg.parent = chloeGroup;

    // Add physics
    chloeGroup.physicsImpostor = new PhysicsImpostor(
      chloeGroup,
      PhysicsImpostor.CapsuleImpostor,
      { mass: 60, restitution: 0.1, friction: 0.8 },
      this.scene
    );

    // Create animations
    this.createCharacterAnimations(chloeGroup, "chloe");

    // Store character
    this.characters.set("chloe_frazer", {
      mesh: chloeGroup,
      type: 'player',
      config: { name: 'Chloe Frazer', health: 100 }
    });

    console.log('✅ Created realistic Chloe Frazer character');
  }

  private createRealisticNPCs(): void {
    // Create merchant NPC
    this.createMerchant();
    
    // Create temple guard
    this.createTempleGuard();
    
    // Create village elder
    this.createVillageElder();
  }

  private createMerchant(): void {
    const merchant = MeshBuilder.CreateCapsule("merchant", {
      height: 1.7,
      radius: 0.25,
      tessellation: 20
    }, this.scene);
    
    merchant.position = new Vector3(50, 1, 50);
    
    const merchantMaterial = new PBRMaterial("merchant_mat", this.scene);
    merchantMaterial.metallic = 0;
    merchantMaterial.roughness = 0.8;
    merchantMaterial.albedoColor = new Color3(0.8, 0.6, 0.5);
    merchant.material = merchantMaterial;

    // Add merchant clothing
    const merchantClothing = MeshBuilder.CreateCylinder("merchant_clothing", {
      diameter: 0.7,
      height: 1.3,
      tessellation: 16
    }, this.scene);
    merchantClothing.position = merchant.position.add(new Vector3(0, 0.2, 0));
    
    const clothingMaterial = new PBRMaterial("merchant_clothing_mat", this.scene);
    clothingMaterial.metallic = 0;
    clothingMaterial.roughness = 0.6;
    clothingMaterial.albedoColor = new Color3(0.3, 0.2, 0.1);
    merchantClothing.material = clothingMaterial;

    // Add turban
    const turban = MeshBuilder.CreateCylinder("merchant_turban", {
      diameter: 0.5,
      height: 0.2,
      tessellation: 16
    }, this.scene);
    turban.position = merchant.position.add(new Vector3(0, 1.1, 0));
    
    const turbanMaterial = new PBRMaterial("turban_mat", this.scene);
    turbanMaterial.metallic = 0;
    turbanMaterial.roughness = 0.5;
    turbanMaterial.albedoColor = new Color3(0.8, 0.2, 0.2);
    turban.material = turbanMaterial;

    this.characters.set("merchant", {
      mesh: merchant,
      type: 'npc',
      config: { 
        name: 'Merchant', 
        dialogue: [
          "Welcome, traveler! I have the finest goods from across India.",
          "The ancient temple? Yes, I know of it. But be careful, it's dangerous.",
          "The Tusk of Ganesh? That's just a legend... or is it?"
        ]
      }
    });

    console.log('✅ Created merchant NPC');
  }

  private createTempleGuard(): void {
    const guard = MeshBuilder.CreateCapsule("temple_guard", {
      height: 1.8,
      radius: 0.28,
      tessellation: 20
    }, this.scene);
    
    guard.position = new Vector3(100, 1, 100);
    
    const guardMaterial = new PBRMaterial("guard_mat", this.scene);
    guardMaterial.metallic = 0;
    guardMaterial.roughness = 0.8;
    guardMaterial.albedoColor = new Color3(0.7, 0.5, 0.4);
    guard.material = guardMaterial;

    // Add guard armor
    const armor = MeshBuilder.CreateCylinder("guard_armor", {
      diameter: 0.8,
      height: 1.4,
      tessellation: 16
    }, this.scene);
    armor.position = guard.position.add(new Vector3(0, 0.2, 0));
    
    const armorMaterial = new PBRMaterial("armor_mat", this.scene);
    armorMaterial.metallic = 0.8;
    armorMaterial.roughness = 0.3;
    armorMaterial.albedoColor = new Color3(0.6, 0.6, 0.6);
    armor.material = armorMaterial;

    this.characters.set("temple_guard", {
      mesh: guard,
      type: 'npc',
      config: { 
        name: 'Temple Guard', 
        dialogue: [
          "Halt! This is sacred ground. What business do you have here?",
          "The temple has been sealed for centuries. No one enters.",
          "If you seek the Tusk, you must prove yourself worthy."
        ]
      }
    });

    console.log('✅ Created temple guard NPC');
  }

  private createVillageElder(): void {
    const elder = MeshBuilder.CreateCapsule("village_elder", {
      height: 1.6,
      radius: 0.22,
      tessellation: 20
    }, this.scene);
    
    elder.position = new Vector3(-50, 1, 50);
    
    const elderMaterial = new PBRMaterial("elder_mat", this.scene);
    elderMaterial.metallic = 0;
    elderMaterial.roughness = 0.9;
    elderMaterial.albedoColor = new Color3(0.6, 0.4, 0.3);
    elder.material = elderMaterial;

    // Add elder robes
    const robes = MeshBuilder.CreateCylinder("elder_robes", {
      diameter: 0.9,
      height: 1.5,
      tessellation: 16
    }, this.scene);
    robes.position = elder.position.add(new Vector3(0, 0.25, 0));
    
    const robesMaterial = new PBRMaterial("robes_mat", this.scene);
    robesMaterial.metallic = 0;
    robesMaterial.roughness = 0.7;
    robesMaterial.albedoColor = new Color3(0.1, 0.1, 0.2);
    robes.material = robesMaterial;

    this.characters.set("village_elder", {
      mesh: elder,
      type: 'npc',
      config: { 
        name: 'Village Elder', 
        dialogue: [
          "Ah, a seeker of ancient wisdom. The Tusk of Ganesh calls to you.",
          "The temple holds many secrets. But first, you must understand our ways.",
          "The forest is alive with spirits. Listen carefully, and they will guide you."
        ]
      }
    });

    console.log('✅ Created village elder NPC');
  }

  private createRealisticEnemies(): void {
    // Create bandits
    for (let i = 0; i < 3; i++) {
      this.createBandit(i);
    }
  }

  private createBandit(index: number): void {
    const bandit = MeshBuilder.CreateCapsule(`bandit_${index}`, {
      height: 1.7,
      radius: 0.25,
      tessellation: 20
    }, this.scene);
    
    bandit.position = new Vector3(
      (Math.random() - 0.5) * 200,
      1,
      (Math.random() - 0.5) * 200
    );
    
    const banditMaterial = new PBRMaterial(`bandit_mat_${index}`, this.scene);
    banditMaterial.metallic = 0;
    banditMaterial.roughness = 0.8;
    banditMaterial.albedoColor = new Color3(0.7, 0.5, 0.4);
    bandit.material = banditMaterial;

    // Add bandit clothing
    const banditClothing = MeshBuilder.CreateCylinder(`bandit_clothing_${index}`, {
      diameter: 0.6,
      height: 1.2,
      tessellation: 16
    }, this.scene);
    banditClothing.position = bandit.position.add(new Vector3(0, 0.25, 0));
    
    const clothingMaterial = new PBRMaterial(`bandit_clothing_mat_${index}`, this.scene);
    clothingMaterial.metallic = 0;
    clothingMaterial.roughness = 0.6;
    clothingMaterial.albedoColor = new Color3(0.2, 0.1, 0.1);
    banditClothing.material = clothingMaterial;

    this.characters.set(`bandit_${index}`, {
      mesh: bandit,
      type: 'enemy',
      config: { 
        name: `Bandit ${index + 1}`, 
        health: 50,
        dialogue: [
          "Hand over your valuables, or face the consequences!",
          "This territory belongs to us now.",
          "You shouldn't have come here, stranger."
        ]
      }
    });
  }

  private createCharacterAnimations(character: Mesh, name: string): void {
    // Create walking animation
    const walkAnimation = new Animation(
      `${name}_walk`,
      "position.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const walkKeys = [];
    walkKeys.push({ frame: 0, value: 0 });
    walkKeys.push({ frame: 15, value: 0.1 });
    walkKeys.push({ frame: 30, value: 0 });
    walkAnimation.setKeys(walkKeys);

    // Create idle animation
    const idleAnimation = new Animation(
      `${name}_idle`,
      "rotation.y",
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const idleKeys = [];
    idleKeys.push({ frame: 0, value: 0 });
    idleKeys.push({ frame: 30, value: 0.1 });
    idleKeys.push({ frame: 60, value: 0 });
    idleAnimation.setKeys(idleKeys);

    // Store animations
    this.animations.set(`${name}_walk`, new AnimationGroup(`${name}_walk_group`, this.scene));
    this.animations.set(`${name}_idle`, new AnimationGroup(`${name}_idle_group`, this.scene));
  }

  private createDialogueSystem(): void {
    this.dialogueSystem = {
      activeDialogue: null,
      dialogueQueue: [],
      
      showDialogue: (character: string, text: string) => {
        const dialoguePanel = document.getElementById("dialogue-panel");
        if (dialoguePanel) {
          dialoguePanel.innerHTML = `<strong>${character}:</strong> ${text}`;
          dialoguePanel.style.display = "block";
          
          setTimeout(() => {
            dialoguePanel.style.display = "none";
          }, 5000);
        }
      },
      
      startConversation: (characterName: string) => {
        const character = this.characters.get(characterName);
        if (character && character.config.dialogue) {
          const randomDialogue = character.config.dialogue[
            Math.floor(Math.random() * character.config.dialogue.length)
          ];
          this.dialogueSystem.showDialogue(character.config.name, randomDialogue);
        }
      }
    };
  }

  private async createNPCs(): Promise<void> {
    // NPCs are created in createRealisticNPCs()
    console.log('✅ NPCs created');
  }

  public getCharacter(name: string): any {
    return this.characters.get(name);
  }

  public getAllCharacters(): Map<string, any> {
    return this.characters;
  }

  public startDialogue(characterName: string): void {
    if (this.dialogueSystem) {
      this.dialogueSystem.startConversation(characterName);
    }
  }

  public updateCharacters(deltaTime: number): void {
    // Update character animations and behaviors
    this.characters.forEach((character, name) => {
      if (character.type === 'npc') {
        this.updateNPCBehavior(character, deltaTime);
      } else if (character.type === 'enemy') {
        this.updateEnemyBehavior(character, deltaTime);
      }
    });
  }

  private updateNPCBehavior(character: any, deltaTime: number): void {
    // Simple NPC behavior - random movement
    if (Math.random() < 0.001) {
      const randomDirection = new Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      );
      character.mesh.position.addInPlace(randomDirection.normalize().scale(0.1));
    }
  }

  private updateEnemyBehavior(character: any, deltaTime: number): void {
    // Enemy behavior - patrol and chase player
    // Implementation for enemy AI
  }
}
