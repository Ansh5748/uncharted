import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  CubeTexture,
  Texture,
  DirectionalLight,
  HemisphericLight,
  ShadowGenerator,
  Animation,
  Mesh,
  InstancedMesh,
  PointLight
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";

export interface WorldConfig {
  size: number;
  terrainHeight: number;
  vegetationDensity: number;
  waterLevel: number;
  weatherType: 'sunny' | 'rainy' | 'foggy' | 'stormy';
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
}

export interface TempleConfig {
  position: Vector3;
  size: number;
  style: 'ancient' | 'modern' | 'ruined';
  deity: 'ganesha' | 'shiva' | 'vishnu' | 'durga';
}

export class AdvancedWorld {
  private scene: Scene;
  private config: WorldConfig;
  private meshes: Map<string, Mesh> = new Map();
  private lights: Map<string, any> = new Map();
  private materials: Map<string, StandardMaterial> = new Map();

  constructor(scene: Scene, config: WorldConfig) {
    this.scene = scene;
    this.config = config;
  }

  public async init(): Promise<void> {
    try {
      console.log("Initializing advanced world...");

      // Create world elements
      await this.createSkybox();
      await this.createTerrain();
      await this.createVegetation();
      await this.createWaterBodies();
      await this.createTemples();
      await this.createMountains();
      await this.createVillages();
      await this.createSpecialEffects();

      // Setup lighting and shadows
      this.setupLighting();
      this.setupShadows();

      console.log("Advanced world initialized successfully!");
    } catch (error) {
      console.error("Failed to initialize advanced world:", error);
      throw error;
    }
  }

  private async createSkybox(): Promise<void> {
    // Create realistic skybox with Indian theme
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 2000 }, this.scene);
    const skyboxMaterial = new StandardMaterial("skyBoxMat", this.scene);
    skyboxMaterial.backFaceCulling = false;
    
    // Use high-quality skybox texture
    skyboxMaterial.reflectionTexture = new CubeTexture(
      "https://assets.babylonjs.com/environments/environmentSpecular.env", 
      this.scene
    );
    skyboxMaterial.reflectionTexture.coordinatesMode = 5;
    skyboxMaterial.diffuseColor = new Color3(0.4, 0.6, 0.8);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    this.meshes.set("skybox", skybox);
  }

  private async createTerrain(): Promise<void> {
    // Create realistic terrain with height map
    const terrain = MeshBuilder.CreateGroundFromHeightMap(
      "terrain",
      "https://assets.babylonjs.com/environments/villageheightmap.png",
      {
        width: 200,
        height: 200,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 20,
      },
      this.scene
    );

    const terrainMat = new StandardMaterial("terrainMat", this.scene);
    terrainMat.diffuseTexture = new Texture("https://assets.babylonjs.com/environments/villagegreen.png", this.scene);
    terrain.material = terrainMat;

    this.meshes.set("terrain", terrain);
  }

  private async createVegetation(): Promise<void> {
    // Create diverse vegetation
    for (let i = 0; i < 50; i++) {
      const tree = this.createTree();
      tree.position = new Vector3(
        (Math.random() - 0.5) * 200,
        0,
        (Math.random() - 0.5) * 200
      );
      this.meshes.set(`tree_${i}`, tree);
    }
  }

  private createTree(): Mesh {
    // Create realistic tree
    const trunk = MeshBuilder.CreateCylinder("trunk", { diameter: 0.7, height: 4 }, this.scene);
    const trunkMat = new StandardMaterial("trunkMat", this.scene);
    trunkMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
    trunk.material = trunkMat;

    const leaves = MeshBuilder.CreateSphere("leaves", { diameter: 3 }, this.scene);
    leaves.position = new Vector3(0, 3, 0);
    const leavesMat = new StandardMaterial("leavesMat", this.scene);
    leavesMat.diffuseColor = new Color3(0.1, 0.6, 0.2);
    leaves.material = leavesMat;
    leaves.parent = trunk;

    return trunk;
  }

  private async createWaterBodies(): Promise<void> {
    // Create river
    const river = MeshBuilder.CreateGround("river", { width: 40, height: 200, subdivisions: 32 }, this.scene);
    river.position = new Vector3(-40, 0.5, 0);
    const waterMaterial = new WaterMaterial("waterMaterial", this.scene);
    waterMaterial.backFaceCulling = true;
    waterMaterial.bumpTexture = new Texture("https://assets.babylonjs.com/environments/waterbump.png", this.scene);
    waterMaterial.windForce = 10;
    waterMaterial.waveHeight = 0.5;
    waterMaterial.bumpHeight = 0.1;
    waterMaterial.waterColor = new Color3(0.1, 0.3, 0.6);
    waterMaterial.colorBlendFactor = 0.3;
    river.material = waterMaterial;

    this.meshes.set("river", river);
  }

  private async createTemples(): Promise<void> {
    // Create multiple temples with different styles
    const templeConfigs: TempleConfig[] = [
      {
        position: new Vector3(50, 0, 50),
        size: 15,
        style: 'ancient',
        deity: 'ganesha'
      },
      {
        position: new Vector3(-80, 0, 30),
        size: 12,
        style: 'modern',
        deity: 'shiva'
      },
      {
        position: new Vector3(20, 0, -60),
        size: 10,
        style: 'ruined',
        deity: 'vishnu'
      }
    ];

    for (const config of templeConfigs) {
      const temple = this.createTemple(config);
      this.meshes.set(`temple_${config.deity}`, temple);
    }
  }

  private createTemple(config: TempleConfig): Mesh {
    // Create temple based on configuration
    const temple = new Mesh(`temple_${config.deity}`, this.scene);
    temple.position = config.position;

    // Create temple structure
    const base = MeshBuilder.CreateBox("templeBase", {
      width: config.size,
      height: config.size * 0.3,
      depth: config.size
    }, this.scene);
    
    const baseMat = new StandardMaterial("templeBaseMat", this.scene);
    baseMat.diffuseColor = new Color3(0.8, 0.7, 0.5);
    base.material = baseMat;
    base.parent = temple;

    // Create main structure
    const mainStructure = MeshBuilder.CreateCylinder("templeMain", {
      diameter: config.size * 0.8,
      height: config.size * 0.8
    }, this.scene);
    mainStructure.position = new Vector3(0, config.size * 0.55, 0);
    
    const mainMat = new StandardMaterial("templeMainMat", this.scene);
    mainMat.diffuseColor = new Color3(0.9, 0.8, 0.6);
    mainStructure.material = mainMat;
    mainStructure.parent = temple;

    // Create dome
    const dome = MeshBuilder.CreateSphere("templeDome", {
      diameter: config.size * 0.9
    }, this.scene);
    dome.position = new Vector3(0, config.size * 1.1, 0);
    dome.scaling.y = 0.5;
    
    const domeMat = new StandardMaterial("templeDomeMat", this.scene);
    domeMat.diffuseColor = new Color3(1, 0.8, 0);
    domeMat.emissiveColor = new Color3(0.1, 0.05, 0);
    dome.material = domeMat;
    dome.parent = temple;

    // Add deity statue if Ganesha
    if (config.deity === 'ganesha') {
      const ganeshaStatue = this.createGaneshaStatue();
      ganeshaStatue.position = new Vector3(0, config.size * 0.3, 0);
      ganeshaStatue.scaling.scaleInPlace(0.3);
      ganeshaStatue.parent = temple;
    }

    return temple;
  }

  private createGaneshaStatue(): Mesh {
    // Create Lord Ganesha statue
    const ganesha = new Mesh("ganesha", this.scene);

    // Body
    const body = MeshBuilder.CreateSphere("ganeshaBody", { diameter: 1 }, this.scene);
    const bodyMat = new StandardMaterial("ganeshaBodyMat", this.scene);
    bodyMat.diffuseColor = new Color3(0.8, 0.6, 0.4);
    body.material = bodyMat;
    body.parent = ganesha;

    // Head
    const head = MeshBuilder.CreateSphere("ganeshaHead", { diameter: 0.8 }, this.scene);
    head.position = new Vector3(0, 0.8, 0);
    head.material = bodyMat;
    head.parent = ganesha;

    // Elephant trunk
    const trunk = MeshBuilder.CreateCylinder("ganeshaTrunk", { diameter: 0.2, height: 0.6 }, this.scene);
    trunk.position = new Vector3(0, 0.6, 0.3);
    trunk.rotation.x = Math.PI / 4;
    trunk.material = bodyMat;
    trunk.parent = ganesha;

    // Ears
    const leftEar = MeshBuilder.CreateCylinder("leftEar", { diameter: 0.3, height: 0.1 }, this.scene);
    leftEar.position = new Vector3(-0.4, 0.8, 0);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.material = bodyMat;
    leftEar.parent = ganesha;

    const rightEar = MeshBuilder.CreateCylinder("rightEar", { diameter: 0.3, height: 0.1 }, this.scene);
    rightEar.position = new Vector3(0.4, 0.8, 0);
    rightEar.rotation.z = -Math.PI / 2;
    rightEar.material = bodyMat;
    rightEar.parent = ganesha;

    // Crown
    const crown = MeshBuilder.CreateCylinder("ganeshaCrown", { diameter: 0.9, height: 0.2 }, this.scene);
    crown.position = new Vector3(0, 1.3, 0);
    
    const crownMat = new StandardMaterial("crownMat", this.scene);
    crownMat.diffuseColor = new Color3(1, 0.8, 0);
    crownMat.emissiveColor = new Color3(0.2, 0.1, 0);
    crown.material = crownMat;
    crown.parent = ganesha;

    return ganesha;
  }

  private async createMountains(): Promise<void> {
    // Create realistic mountain ranges
    const mountainPositions = [
      new Vector3(100, 0, 100),
      new Vector3(-100, 0, 80),
      new Vector3(60, 0, -100),
      new Vector3(-120, 0, -60)
    ];

    mountainPositions.forEach((position, index) => {
      const mountain = this.createMountain(position, 20 + Math.random() * 30);
      this.meshes.set(`mountain_${index}`, mountain);
    });
  }

  private createMountain(position: Vector3, height: number): Mesh {
    // Create realistic mountain
    const mountain = MeshBuilder.CreateCylinder("mountain", {
      diameter: 40 + Math.random() * 20,
      height: height,
      tessellation: 16
    }, this.scene);

    mountain.position = position;
    mountain.scaling.y = 1 + Math.random() * 0.5;

    // Create mountain material
    const mountainMat = new StandardMaterial("mountainMat", this.scene);
    mountainMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
    mountainMat.specularColor = new Color3(0.1, 0.1, 0.1);
    mountain.material = mountainMat;

    return mountain;
  }

  private async createVillages(): Promise<void> {
    // Create Indian villages with traditional architecture
    const villagePositions = [
      new Vector3(30, 0, 20),
      new Vector3(-40, 0, -30),
      new Vector3(80, 0, -20)
    ];

    villagePositions.forEach((position, index) => {
      const village = this.createVillage(position);
      this.meshes.set(`village_${index}`, village);
    });
  }

  private createVillage(position: Vector3): Mesh {
    // Create village center
    const village = new Mesh("village", this.scene);
    village.position = position;

    // Create traditional Indian houses
    for (let i = 0; i < 8; i++) {
      const house = this.createTraditionalHouse();
      const angle = (i / 8) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      house.position = new Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      house.parent = village;
    }

    // Create village center (chowk)
    const chowk = MeshBuilder.CreateCylinder("chowk", {
      diameter: 8,
      height: 0.5
    }, this.scene);
    chowk.position = new Vector3(0, 0.25, 0);
    
    const chowkMat = new StandardMaterial("chowkMat", this.scene);
    chowkMat.diffuseColor = new Color3(0.6, 0.5, 0.3);
    chowk.material = chowkMat;
    chowk.parent = village;

    return village;
  }

  private createTraditionalHouse(): Mesh {
    // Create traditional Indian house
    const house = new Mesh("house", this.scene);

    // Main structure
    const mainStructure = MeshBuilder.CreateBox("mainStructure", {
      width: 4,
      height: 3,
      depth: 4
    }, this.scene);
    
    const houseMat = new StandardMaterial("houseMat", this.scene);
    houseMat.diffuseColor = new Color3(0.8, 0.7, 0.5);
    mainStructure.material = houseMat;
    mainStructure.parent = house;

    // Roof
    const roof = MeshBuilder.CreateCylinder("roof", {
      diameter: 5,
      height: 1
    }, this.scene);
    roof.position = new Vector3(0, 2, 0);
    roof.scaling.y = 0.3;
    
    const roofMat = new StandardMaterial("roofMat", this.scene);
    roofMat.diffuseColor = new Color3(0.3, 0.2, 0.1);
    roof.material = roofMat;
    roof.parent = house;

    return house;
  }

  private async createSpecialEffects(): Promise<void> {
    // Create special effects like fire, smoke, and magical elements
    this.createSacredFires();
    this.createTempleBells();
  }

  private createSacredFires(): void {
    // Create sacred fire pits near temples
    const firePositions = [
      new Vector3(50, 0, 45),
      new Vector3(-80, 0, 25),
      new Vector3(20, 0, -65)
    ];

    firePositions.forEach((position, index) => {
      const firePit = this.createFirePit(position);
      this.meshes.set(`firePit_${index}`, firePit);
    });
  }

  private createFirePit(position: Vector3): Mesh {
    // Create fire pit structure
    const firePit = MeshBuilder.CreateCylinder("firePit", {
      diameter: 3,
      height: 1
    }, this.scene);
    firePit.position = position;

    const firePitMat = new StandardMaterial("firePitMat", this.scene);
    firePitMat.diffuseColor = new Color3(0.3, 0.2, 0.1);
    firePit.material = firePitMat;

    // Add fire light
    const fireLight = new PointLight("fireLight", position.add(new Vector3(0, 2, 0)), this.scene);
    fireLight.diffuse = new Color3(1, 0.5, 0);
    fireLight.intensity = 2;
    fireLight.range = 10;

    this.lights.set(`fireLight_${position.toString()}`, fireLight);

    return firePit;
  }

  private createTempleBells(): void {
    // Create temple bells that ring periodically
    const bellPositions = [
      new Vector3(55, 5, 55),
      new Vector3(-75, 5, 35),
      new Vector3(25, 5, -55)
    ];

    bellPositions.forEach((position, index) => {
      const bell = this.createBell(position);
      this.meshes.set(`bell_${index}`, bell);
    });
  }

  private createBell(position: Vector3): Mesh {
    // Create bell shape
    const bell = MeshBuilder.CreateCylinder("bell", {
      diameter: 1,
      height: 2
    }, this.scene);
    bell.position = position;
    bell.scaling.y = 0.5;

    const bellMat = new StandardMaterial("bellMat", this.scene);
    bellMat.diffuseColor = new Color3(1, 0.8, 0);
    bell.material = bellMat;

    // Add swinging animation
    const swingAnimation = new Animation("bellSwing", "rotation.z", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    const keys = [
      { frame: 0, value: 0 },
      { frame: 15, value: 0.1 },
      { frame: 30, value: 0 }
    ];
    swingAnimation.setKeys(keys);
    bell.animations = [swingAnimation];
    this.scene.beginAnimation(bell, 0, 30, true);

    return bell;
  }

  private setupLighting(): void {
    // Setup advanced lighting system
    const mainLight = new DirectionalLight("mainLight", new Vector3(-1, -2, -1), this.scene);
    mainLight.intensity = 0.8;
    mainLight.position = new Vector3(50, 100, 50);

    const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.6;

    this.lights.set("mainLight", mainLight);
    this.lights.set("ambientLight", ambientLight);
  }

  private setupShadows(): void {
    // Setup shadow system for realistic shadows
    const mainLight = this.lights.get("mainLight");
    if (mainLight) {
      const shadowGenerator = new ShadowGenerator(2048, mainLight);
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurKernel = 32;

      // Add shadows to all meshes
      this.meshes.forEach(mesh => {
        shadowGenerator.addShadowCaster(mesh, true);
        mesh.receiveShadows = true;
      });
    }
  }

  public update(deltaTime: number): void {
    // Update world systems
  }

  public getMeshes(): Map<string, Mesh> {
    return this.meshes;
  }

  public getLights(): Map<string, any> {
    return this.lights;
  }

  public dispose(): void {
    // Dispose all resources
    this.meshes.forEach(mesh => mesh.dispose());
    this.lights.forEach(light => light.dispose());
    this.materials.forEach(material => material.dispose());
  }
}
