import { 
  Scene, 
  Vector3, 
  Mesh, 
  StandardMaterial, 
  Color3, 
  Texture,
  MeshBuilder,
  Animation,
  EasingFunction,
  CircleEase,
  Matrix,
  Quaternion,
  SceneLoader,
  AbstractMesh,
  Skeleton,
  Bone,
  TransformNode,
  AnimationGroup,
  Nullable
} from "@babylonjs/core";

export interface CharacterConfig {
  name: string;
  gender: 'male' | 'female';
  height: number;
  build: 'slim' | 'average' | 'athletic' | 'heavy';
  skinTone: Color3;
  hairStyle: string;
  hairColor: Color3;
  clothing: CharacterClothing;
  accessories: string[];
}

export interface CharacterClothing {
  top: string;
  bottom: string;
  footwear: string;
  headgear?: string;
  jewelry?: string[];
}

export interface CharacterAnimation {
  name: string;
  frameRate: number;
  loopMode: number;
  keys: any[];
}

export class CharacterSystem {
  private scene: Scene;
  private characters: Map<string, Character> = new Map();
  private characterModels: Map<string, AbstractMesh[]> = new Map();
  private animations: Map<string, AnimationGroup> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeCharacterSystem();
  }

  private async initializeCharacterSystem(): Promise<void> {
    try {
      // Load character models and animations
      await this.loadCharacterModels();
      await this.loadAnimations();
      console.log("Character system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize character system:", error);
      // Fallback to basic character creation
      this.createFallbackCharacter();
    }
  }

  private async loadCharacterModels(): Promise<void> {
    // Try to load realistic character models
    const modelUrls = [
      "https://assets.babylonjs.com/models/character/male_character.glb",
      "https://assets.babylonjs.com/models/character/female_character.glb"
    ];

    for (const url of modelUrls) {
      try {
        const result = await SceneLoader.ImportMeshAsync("", url, "", this.scene);
        if (result.meshes.length > 0) {
          const characterName = url.includes('male') ? 'male_base' : 'female_base';
          this.characterModels.set(characterName, result.meshes);
          
          // Store animations
          if (result.animationGroups) {
            result.animationGroups.forEach(anim => {
              this.animations.set(anim.name, anim);
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to load character model from ${url}:`, error);
      }
    }
  }

  private async loadAnimations(): Promise<void> {
    // Define basic animations for fallback
    const basicAnimations = [
      'idle', 'walk', 'run', 'jump', 'climb', 'interact', 'attack'
    ];

    basicAnimations.forEach(animName => {
      const animation = this.createBasicAnimation(animName);
      if (animation) {
        this.animations.set(animName, animation);
      }
    });
  }

  private createBasicAnimation(animName: string): AnimationGroup | null {
    // Create basic keyframe animations
    const animation = new AnimationGroup(animName, this.scene);
    
    switch (animName) {
      case 'idle':
        // Subtle breathing animation
        const idleAnim = new Animation("idle", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const idleKeys = [
          { frame: 0, value: 0 },
          { frame: 30, value: 0.05 },
          { frame: 60, value: 0 }
        ];
        idleAnim.setKeys(idleKeys);
        animation.addTargetedAnimation(idleAnim, null);
        break;

      case 'walk':
        // Walking animation
        const walkAnim = new Animation("walk", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const walkKeys = [
          { frame: 0, value: 0 },
          { frame: 15, value: 0.1 },
          { frame: 30, value: 0 }
        ];
        walkAnim.setKeys(walkKeys);
        animation.addTargetedAnimation(walkAnim, null);
        break;

      case 'run':
        // Running animation
        const runAnim = new Animation("run", "position.y", 20, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const runKeys = [
          { frame: 0, value: 0 },
          { frame: 10, value: 0.15 },
          { frame: 20, value: 0 }
        ];
        runAnim.setKeys(runKeys);
        animation.addTargetedAnimation(runAnim, null);
        break;

      case 'jump':
        // Jumping animation
        const jumpAnim = new Animation("jump", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const jumpKeys = [
          { frame: 0, value: 0 },
          { frame: 15, value: 1.5 },
          { frame: 30, value: 0 }
        ];
        jumpAnim.setKeys(jumpKeys);
        animation.addTargetedAnimation(jumpAnim, null);
        break;
    }

    return animation;
  }

  private createFallbackCharacter(): void {
    // Create a basic humanoid character as fallback
    const character = this.createHumanoidCharacter();
    this.characterModels.set('fallback', [character]);
  }

  private createHumanoidCharacter(): Mesh {
    // Create a more detailed humanoid character
    const character = new Mesh("humanoid_character", this.scene);

    // Head
    const head = MeshBuilder.CreateSphere("head", { diameter: 0.5 }, this.scene);
    head.position = new Vector3(0, 1.7, 0);
    
    const headMat = new StandardMaterial("headMat", this.scene);
    headMat.diffuseColor = new Color3(0.8, 0.6, 0.4); // Skin tone
    head.material = headMat;

    // Body (torso)
    const torso = MeshBuilder.CreateCylinder("torso", { 
      diameter: 0.6, 
      height: 0.8 
    }, this.scene);
    torso.position = new Vector3(0, 1.2, 0);
    
    const torsoMat = new StandardMaterial("torsoMat", this.scene);
    torsoMat.diffuseColor = new Color3(0.2, 0.4, 0.8); // Blue clothing
    torso.material = torsoMat;

    // Arms
    const leftArm = MeshBuilder.CreateCylinder("leftArm", { 
      diameter: 0.2, 
      height: 0.6 
    }, this.scene);
    leftArm.position = new Vector3(-0.4, 1.3, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.material = headMat;

    const rightArm = MeshBuilder.CreateCylinder("rightArm", { 
      diameter: 0.2, 
      height: 0.6 
    }, this.scene);
    rightArm.position = new Vector3(0.4, 1.3, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.material = headMat;

    // Legs
    const leftLeg = MeshBuilder.CreateCylinder("leftLeg", { 
      diameter: 0.25, 
      height: 0.8 
    }, this.scene);
    leftLeg.position = new Vector3(-0.15, 0.6, 0);
    leftLeg.material = new StandardMaterial("legMat", this.scene);

    const rightLeg = MeshBuilder.CreateCylinder("rightLeg", { 
      diameter: 0.25, 
      height: 0.8 
    }, this.scene);
    rightLeg.position = new Vector3(0.15, 0.6, 0);
    rightLeg.material = new StandardMaterial("legMat", this.scene);

    // Feet
    const leftFoot = MeshBuilder.CreateBox("leftFoot", { 
      width: 0.3, 
      height: 0.1, 
      depth: 0.4 
    }, this.scene);
    leftFoot.position = new Vector3(-0.15, 0.2, 0.1);
    leftFoot.material = new StandardMaterial("footMat", this.scene);

    const rightFoot = MeshBuilder.CreateBox("rightFoot", { 
      width: 0.3, 
      height: 0.1, 
      depth: 0.4 
    }, this.scene);
    rightFoot.position = new Vector3(0.15, 0.2, 0.1);
    rightFoot.material = new StandardMaterial("footMat", this.scene);

    // Add Indian-themed accessories
    this.addIndianAccessories(head, torso);

    // Parent all parts to character
    [head, torso, leftArm, rightArm, leftLeg, rightLeg, leftFoot, rightFoot].forEach(part => {
      part.parent = character;
    });

    return character;
  }

  private addIndianAccessories(head: Mesh, torso: Mesh): void {
    // Turban
    const turban = MeshBuilder.CreateCylinder("turban", { 
      diameter: 0.6, 
      height: 0.2 
    }, this.scene);
    turban.position = head.position.add(new Vector3(0, 0.3, 0));
    
    const turbanMat = new StandardMaterial("turbanMat", this.scene);
    turbanMat.diffuseColor = new Color3(0.8, 0.2, 0.2); // Red turban
    turban.material = turbanMat;
    turban.parent = head;

    // Necklace
    const necklace = MeshBuilder.CreateTorus("necklace", { 
      diameter: 0.7, 
      thickness: 0.05 
    }, this.scene);
    necklace.position = head.position.add(new Vector3(0, -0.2, 0));
    
    const necklaceMat = new StandardMaterial("necklaceMat", this.scene);
    necklaceMat.diffuseColor = new Color3(1, 0.8, 0); // Gold
    necklaceMat.emissiveColor = new Color3(0.2, 0.1, 0);
    necklace.material = necklaceMat;
    necklace.parent = head;

    // Arm bands
    const leftArmBand = MeshBuilder.CreateTorus("leftArmBand", { 
      diameter: 0.25, 
      thickness: 0.02 
    }, this.scene);
    leftArmBand.position = new Vector3(-0.4, 1.0, 0);
    leftArmBand.material = necklaceMat;
    leftArmBand.parent = torso;

    const rightArmBand = MeshBuilder.CreateTorus("rightArmBand", { 
      diameter: 0.25, 
      thickness: 0.02 
    }, this.scene);
    rightArmBand.position = new Vector3(0.4, 1.0, 0);
    rightArmBand.material = necklaceMat;
    rightArmBand.parent = torso;
  }

  public createCharacter(config: CharacterConfig, position: Vector3): Character {
    const character = new Character(this.scene, config, position);
    this.characters.set(config.name, character);
    return character;
  }

  public getCharacter(name: string): Character | undefined {
    return this.characters.get(name);
  }

  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  public dispose(): void {
    this.characters.forEach(character => character.dispose());
    this.characters.clear();
    this.characterModels.clear();
    this.animations.clear();
  }
}

export class Character {
  private scene: Scene;
  private config: CharacterConfig;
  private mesh: Mesh;
  private currentAnimation: AnimationGroup | null = null;
  private isAnimating = false;

  constructor(scene: Scene, config: CharacterConfig, position: Vector3) {
    this.scene = scene;
    this.config = config;
    this.mesh = this.createCharacterMesh();
    this.mesh.position = position;
  }

  private createCharacterMesh(): Mesh {
    // Create character based on configuration
    const character = new Mesh(`character_${this.config.name}`, this.scene);

    // Apply character customization
    this.applyCharacterCustomization(character);

    return character;
  }

  private applyCharacterCustomization(character: Mesh): void {
    // Apply height scaling
    character.scaling.y = this.config.height / 1.7; // Base height

    // Apply build scaling
    switch (this.config.build) {
      case 'slim':
        character.scaling.x = 0.8;
        character.scaling.z = 0.8;
        break;
      case 'athletic':
        character.scaling.x = 1.1;
        character.scaling.z = 1.1;
        break;
      case 'heavy':
        character.scaling.x = 1.3;
        character.scaling.z = 1.3;
        break;
      default: // average
        character.scaling.x = 1.0;
        character.scaling.z = 1.0;
    }

    // Apply skin tone and other visual customizations
    this.applyVisualCustomization(character);
  }

  private applyVisualCustomization(character: Mesh): void {
    // Apply skin tone to head and arms
    const skinMaterial = new StandardMaterial("skinMat", this.scene);
    skinMaterial.diffuseColor = this.config.skinTone;
    skinMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

    // Apply clothing colors
    const clothingMaterial = new StandardMaterial("clothingMat", this.scene);
    clothingMaterial.diffuseColor = new Color3(0.2, 0.4, 0.8); // Default blue

    // Apply hair style and color
    this.applyHairStyle(character);
  }

  private applyHairStyle(character: Mesh): void {
    // Create hair based on style
    const hair = MeshBuilder.CreateSphere("hair", { diameter: 0.55 }, this.scene);
    hair.position = new Vector3(0, 1.75, 0);
    
    const hairMat = new StandardMaterial("hairMat", this.scene);
    hairMat.diffuseColor = this.config.hairColor;
    hair.material = hairMat;
    hair.parent = character;
  }

  public playAnimation(animationName: string, loop: boolean = true): void {
    // Stop current animation
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }

    // Play new animation
    // This would integrate with the animation system
    this.isAnimating = true;
    
    // For now, create a simple animation
    const animation = new Animation(
      animationName,
      "position.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      loop ? Animation.ANIMATIONLOOPMODE_CYCLE : Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [];
    switch (animationName) {
      case 'idle':
        keys.push({ frame: 0, value: 0 });
        keys.push({ frame: 30, value: 0.05 });
        keys.push({ frame: 60, value: 0 });
        break;
      case 'walk':
        keys.push({ frame: 0, value: 0 });
        keys.push({ frame: 15, value: 0.1 });
        keys.push({ frame: 30, value: 0 });
        break;
      case 'run':
        keys.push({ frame: 0, value: 0 });
        keys.push({ frame: 10, value: 0.15 });
        keys.push({ frame: 20, value: 0 });
        break;
      case 'jump':
        keys.push({ frame: 0, value: 0 });
        keys.push({ frame: 15, value: 1.5 });
        keys.push({ frame: 30, value: 0 });
        break;
    }

    animation.setKeys(keys);
    this.mesh.animations = [animation];
    this.scene.beginAnimation(this.mesh, 0, keys.length > 0 ? keys[keys.length - 1].frame : 30, loop);
  }

  public stopAnimation(): void {
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }
    this.isAnimating = false;
  }

  public moveTo(position: Vector3, duration: number = 1000): void {
    // Create movement animation
    const moveAnimation = new Animation(
      "move",
      "position",
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: this.mesh.position.clone() },
      { frame: 30, value: position }
    ];

    moveAnimation.setKeys(keys);
    this.mesh.animations = [moveAnimation];
    this.scene.beginAnimation(this.mesh, 0, 30, false, 1, () => {
      this.playAnimation('idle');
    });
  }

  public rotateTo(targetRotation: number, duration: number = 500): void {
    // Create rotation animation
    const rotateAnimation = new Animation(
      "rotate",
      "rotation.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: this.mesh.rotation.y },
      { frame: 30, value: targetRotation }
    ];

    rotateAnimation.setKeys(keys);
    this.mesh.animations = [rotateAnimation];
    this.scene.beginAnimation(this.mesh, 0, 30, false);
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public getPosition(): Vector3 {
    return this.mesh.position.clone();
  }

  public setPosition(position: Vector3): void {
    this.mesh.position = position;
  }

  public getRotation(): Vector3 {
    return this.mesh.rotation.clone();
  }

  public setRotation(rotation: Vector3): void {
    this.mesh.rotation = rotation;
  }

  public getConfig(): CharacterConfig {
    return { ...this.config };
  }

  public dispose(): void {
    this.mesh.dispose();
  }
}
