import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Texture,
  CubeTexture,
  NoiseProceduralTexture,
  PhysicsImpostor,
  ShadowGenerator,
  Matrix,
  Tools,
  Animation,
  AnimationGroup,
  InstancedMesh,
  SubMesh,
  DynamicTexture,
  ProceduralTexture
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";

export interface WorldConfig {
  chunkSize: number;
  renderDistance: number;
  maxChunks: number;
  enableDynamicLoading: boolean;
  enableLOD: boolean;
}

export class AdvancedWorldSystem {
  private scene: Scene;
  private config: WorldConfig;
  private chunks: Map<string, any> = new Map();
  private playerPosition: Vector3 = Vector3.Zero();
  private loadedChunks: Set<string> = new Set();
  private worldGenerator: any = null;
  private environments: Map<string, any> = new Map();

  constructor(scene: Scene, config: WorldConfig) {
    this.scene = scene;
    this.config = config;
    this.initializeWorldSystem();
  }

  private async initializeWorldSystem(): Promise<void> {
    console.log('🌍 Initializing Advanced World System...');
    
    // Create world generator
    this.createWorldGenerator();
    
    // Create different environments
    await this.createEnvironments();
    
    // Setup dynamic loading
    this.setupDynamicLoading();
    
    console.log('✅ Advanced World System initialized');
  }

  private createWorldGenerator(): void {
    this.worldGenerator = {
      // Generate terrain height using noise
      getHeight: (x: number, z: number): number => {
        const noise = new NoiseProceduralTexture("noise", 256, this.scene);
        noise.octaves = 6;
        noise.persistence = 0.8;
        
        const nx = (x / 100) % 1;
        const nz = (z / 100) % 1;
        
              // Create multiple layers of noise for realistic terrain
      let height = 0;
      height += Math.sin(nx * 10) * Math.cos(nz * 10) * 20; // Large features
      height += Math.sin(nx * 20) * Math.cos(nz * 20) * 10; // Medium features
      height += Math.sin(nx * 40) * Math.cos(nz * 40) * 5; // Small features
        
        return height;
      },
      
      // Get biome type based on position
      getBiome: (x: number, z: number): string => {
        const distance = Math.sqrt(x * x + z * z);
        
        if (distance < 100) return 'village';
        if (distance < 300) return 'forest';
        if (distance < 500) return 'mountains';
        return 'desert';
      },
      
      // Generate chunk at position
      generateChunk: (chunkX: number, chunkZ: number): any => {
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunkSize = this.config.chunkSize;
        
        // Create ground mesh
        const ground = MeshBuilder.CreateGround(`chunk_${chunkKey}`, {
          width: chunkSize,
          height: chunkSize,
          subdivisions: 50
        }, this.scene);
        
        ground.position = new Vector3(chunkX * chunkSize, 0, chunkZ * chunkSize);
        
        // Apply height map
        this.applyHeightMap(ground, chunkX, chunkZ);
        
        // Apply biome-specific materials
        const biome = this.worldGenerator.getBiome(chunkX * chunkSize, chunkZ * chunkSize);
        this.applyBiomeMaterials(ground, biome);
        
        // Add physics
        ground.physicsImpostor = new PhysicsImpostor(
          ground,
          PhysicsImpostor.HeightmapImpostor,
          { mass: 0, restitution: 0.9 },
          this.scene
        );
        
        return {
          mesh: ground,
          biome: biome,
          position: new Vector3(chunkX * chunkSize, 0, chunkZ * chunkSize)
        };
      }
    };
  }

  private applyHeightMap(ground: Mesh, chunkX: number, chunkZ: number): void {
    const chunkSize = this.config.chunkSize;
    const vertices = ground.getVerticesData('position');
    
    if (vertices) {
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i] + chunkX * chunkSize;
        const z = vertices[i + 2] + chunkZ * chunkSize;
        const height = this.worldGenerator.getHeight(x, z);
        vertices[i + 1] = height;
      }
      
      ground.setVerticesData('position', vertices);
      ground.computeWorldMatrix(true);
    }
  }

  private applyBiomeMaterials(ground: Mesh, biome: string): void {
    const material = new PBRMaterial(`biome_${biome}_mat`, this.scene);
    
    switch (biome) {
      case 'village':
        material.albedoColor = new Color3(0.6, 0.5, 0.3);
        material.roughness = 0.8;
        break;
      case 'forest':
        material.albedoColor = new Color3(0.2, 0.4, 0.1);
        material.roughness = 0.9;
        break;
      case 'mountains':
        material.albedoColor = new Color3(0.5, 0.5, 0.5);
        material.roughness = 0.7;
        break;
      case 'desert':
        material.albedoColor = new Color3(0.8, 0.7, 0.5);
        material.roughness = 0.6;
        break;
    }
    
    ground.material = material;
  }

  private async createEnvironments(): Promise<void> {
    // Create Village Environment
    await this.createVillageEnvironment();
    
    // Create Forest Environment
    await this.createForestEnvironment();
    
    // Create Mountain Environment
    await this.createMountainEnvironment();
    
    // Create Temple Environment
    await this.createTempleEnvironment();
    
    // Create Market Environment
    await this.createMarketEnvironment();
  }

  private async createVillageEnvironment(): Promise<void> {
    console.log('🏘️ Creating Village Environment...');
    
    const village = {
      buildings: [] as Mesh[],
      npcs: [] as any[],
      props: [] as Mesh[]
    };

    // Create village buildings
    for (let i = 0; i < 15; i++) {
      const building = this.createVillageBuilding(i);
      village.buildings.push(building);
    }

    // Create village center
    const villageCenter = this.createVillageCenter();
    village.buildings.push(villageCenter);

    // Create village props (well, carts, etc.)
    const well = this.createVillageWell();
    village.props.push(well);

    this.environments.set('village', village);
    console.log('✅ Village Environment created');
  }

  private createVillageBuilding(index: number): Mesh {
    const building = MeshBuilder.CreateBox(`village_building_${index}`, {
      width: 8 + Math.random() * 4,
      height: 6 + Math.random() * 4,
      depth: 8 + Math.random() * 4
    }, this.scene);
    
    building.position = new Vector3(
      (Math.random() - 0.5) * 200,
      3,
      (Math.random() - 0.5) * 200
    );
    
    const buildingMaterial = new PBRMaterial(`building_mat_${index}`, this.scene);
    buildingMaterial.metallic = 0;
    buildingMaterial.roughness = 0.8;
    buildingMaterial.albedoColor = new Color3(
      0.6 + Math.random() * 0.2,
      0.4 + Math.random() * 0.2,
      0.2 + Math.random() * 0.2
    );
    building.material = buildingMaterial;

    // Add roof
    const roof = MeshBuilder.CreateCylinder(`roof_${index}`, {
      diameter: 10,
      height: 2
    }, this.scene);
    roof.position = building.position.add(new Vector3(0, 5, 0));
    
    const roofMaterial = new PBRMaterial(`roof_mat_${index}`, this.scene);
    roofMaterial.metallic = 0;
    roofMaterial.roughness = 0.6;
    roofMaterial.albedoColor = new Color3(0.3, 0.2, 0.1);
    roof.material = roofMaterial;

    return building;
  }

  private createVillageCenter(): Mesh {
    const center = MeshBuilder.CreateCylinder("village_center", {
      diameter: 20,
      height: 8
    }, this.scene);
    
    center.position = new Vector3(0, 4, 0);
    
    const centerMaterial = new PBRMaterial("center_mat", this.scene);
    centerMaterial.metallic = 0;
    centerMaterial.roughness = 0.7;
    centerMaterial.albedoColor = new Color3(0.7, 0.6, 0.4);
    center.material = centerMaterial;

    return center;
  }

  private createVillageWell(): Mesh {
    const well = MeshBuilder.CreateCylinder("village_well", {
      diameter: 3,
      height: 4
    }, this.scene);
    
    well.position = new Vector3(20, 2, 20);
    
    const wellMaterial = new PBRMaterial("well_mat", this.scene);
    wellMaterial.metallic = 0.3;
    wellMaterial.roughness = 0.5;
    wellMaterial.albedoColor = new Color3(0.5, 0.5, 0.5);
    well.material = wellMaterial;

    return well;
  }

  private async createForestEnvironment(): Promise<void> {
    console.log('🌲 Creating Forest Environment...');
    
    const forest = {
      trees: [] as Mesh[],
      plants: [] as Mesh[],
      animals: [] as Mesh[]
    };

    // Create dense forest with different tree types
    for (let i = 0; i < 200; i++) {
      const tree = this.createForestTree(i);
      forest.trees.push(tree);
    }

    // Create undergrowth
    for (let i = 0; i < 100; i++) {
      const plant = this.createForestPlant(i);
      forest.plants.push(plant);
    }

    this.environments.set('forest', forest);
    console.log('✅ Forest Environment created');
  }

  private createForestTree(index: number): Mesh {
    const treeTypes = [
      { name: 'teak', height: 15, diameter: 3, color: new Color3(0.2, 0.4, 0.1) },
      { name: 'sandalwood', height: 12, diameter: 2.5, color: new Color3(0.1, 0.3, 0.1) },
      { name: 'bamboo', height: 20, diameter: 1.5, color: new Color3(0.3, 0.5, 0.2) },
      { name: 'banyan', height: 25, diameter: 4, color: new Color3(0.15, 0.35, 0.1) }
    ];

    const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    
    // Create trunk
    const trunk = MeshBuilder.CreateCylinder(`tree_trunk_${index}`, {
      diameter: treeType.diameter * 0.3,
      height: treeType.height * 0.6,
      tessellation: 16
    }, this.scene);
    
    const x = (Math.random() - 0.5) * 400;
    const z = (Math.random() - 0.5) * 400;
    trunk.position = new Vector3(x, treeType.height * 0.3, z);
    
    const trunkMaterial = new PBRMaterial(`trunk_mat_${index}`, this.scene);
    trunkMaterial.metallic = 0;
    trunkMaterial.roughness = 0.9;
    trunkMaterial.albedoColor = new Color3(0.4, 0.2, 0.1);
    trunk.material = trunkMaterial;

    // Create leaves
    const leaves = MeshBuilder.CreateSphere(`tree_leaves_${index}`, {
      diameter: treeType.diameter,
      segments: 20
    }, this.scene);
    
    leaves.position = trunk.position.add(new Vector3(0, treeType.height * 0.8, 0));
    
    const leavesMaterial = new PBRMaterial(`leaves_mat_${index}`, this.scene);
    leavesMaterial.metallic = 0;
    leavesMaterial.roughness = 0.7;
    leavesMaterial.albedoColor = treeType.color;
    leaves.material = leavesMaterial;

    return trunk;
  }

  private createForestPlant(index: number): Mesh {
    const plant = MeshBuilder.CreateCylinder(`forest_plant_${index}`, {
      diameter: 0.5 + Math.random() * 1,
      height: 1 + Math.random() * 2,
      tessellation: 8
    }, this.scene);
    
    const x = (Math.random() - 0.5) * 400;
    const z = (Math.random() - 0.5) * 400;
    plant.position = new Vector3(x, 0.5, z);
    
    const plantMaterial = new PBRMaterial(`plant_mat_${index}`, this.scene);
    plantMaterial.metallic = 0;
    plantMaterial.roughness = 0.8;
    plantMaterial.albedoColor = new Color3(
      0.1 + Math.random() * 0.3,
      0.3 + Math.random() * 0.4,
      0.1 + Math.random() * 0.2
    );
    plant.material = plantMaterial;

    return plant;
  }

  private async createMountainEnvironment(): Promise<void> {
    console.log('⛰️ Creating Mountain Environment...');
    
    const mountains = {
      peaks: [] as Mesh[],
      caves: [] as Mesh[],
      rocks: [] as Mesh[]
    };

    // Create mountain peaks
    for (let i = 0; i < 8; i++) {
      const peak = this.createMountainPeak(i);
      mountains.peaks.push(peak);
    }

    // Create caves
    for (let i = 0; i < 5; i++) {
      const cave = this.createMountainCave(i);
      mountains.caves.push(cave);
    }

    this.environments.set('mountains', mountains);
    console.log('✅ Mountain Environment created');
  }

  private createMountainPeak(index: number): Mesh {
    const peak = MeshBuilder.CreateCylinder(`mountain_peak_${index}`, {
      diameter: 20 + Math.random() * 30,
      height: 30 + Math.random() * 50,
      tessellation: 20
    }, this.scene);
    
    const angle = (index / 8) * Math.PI * 2;
    const distance = 300 + Math.random() * 200;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    peak.position = new Vector3(x, 15, z);
    
    const peakMaterial = new PBRMaterial(`peak_mat_${index}`, this.scene);
    peakMaterial.metallic = 0;
    peakMaterial.roughness = 0.8;
    peakMaterial.albedoColor = new Color3(0.6, 0.6, 0.6);
    peak.material = peakMaterial;

    return peak;
  }

  private createMountainCave(index: number): Mesh {
    const cave = MeshBuilder.CreateSphere(`mountain_cave_${index}`, {
      diameter: 8 + Math.random() * 6,
      segments: 16
    }, this.scene);
    
    const angle = (index / 5) * Math.PI * 2;
    const distance = 250 + Math.random() * 100;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    cave.position = new Vector3(x, 5, z);
    
    const caveMaterial = new PBRMaterial(`cave_mat_${index}`, this.scene);
    caveMaterial.metallic = 0;
    caveMaterial.roughness = 0.9;
    caveMaterial.albedoColor = new Color3(0.2, 0.2, 0.2);
    cave.material = caveMaterial;

    return cave;
  }

  private async createTempleEnvironment(): Promise<void> {
    console.log('🏛️ Creating Temple Environment...');
    
    const temple = {
      mainTemple: null as Mesh | null,
      pillars: [] as Mesh[],
      statues: [] as Mesh[],
      decorations: [] as Mesh[]
    };

    // Create main temple structure
    temple.mainTemple = this.createMainTemple();

    // Create temple pillars
    for (let i = 0; i < 12; i++) {
      const pillar = this.createTemplePillar(i);
      temple.pillars.push(pillar);
    }

    // Create temple statues
    for (let i = 0; i < 6; i++) {
      const statue = this.createTempleStatue(i);
      temple.statues.push(statue);
    }

    this.environments.set('temple', temple);
    console.log('✅ Temple Environment created');
  }

  private createMainTemple(): Mesh {
    // Temple base
    const base = MeshBuilder.CreateBox("temple_base", {
      width: 40,
      height: 4,
      depth: 40
    }, this.scene);
    
    base.position = new Vector3(100, 2, 100);
    
    const baseMaterial = new PBRMaterial("temple_base_mat", this.scene);
    baseMaterial.metallic = 0;
    baseMaterial.roughness = 0.6;
    baseMaterial.albedoColor = new Color3(0.9, 0.9, 0.7);
    base.material = baseMaterial;

    // Temple dome
    const dome = MeshBuilder.CreateSphere("temple_dome", {
      diameter: 16,
      segments: 32
    }, this.scene);
    
    dome.position = new Vector3(100, 17, 100);
    
    const domeMaterial = new PBRMaterial("temple_dome_mat", this.scene);
    domeMaterial.metallic = 1;
    domeMaterial.roughness = 0.1;
    domeMaterial.albedoColor = new Color3(1, 0.8, 0);
    dome.material = domeMaterial;

    return base;
  }

  private createTemplePillar(index: number): Mesh {
    const pillar = MeshBuilder.CreateCylinder(`temple_pillar_${index}`, {
      diameter: 1.5,
      height: 15,
      tessellation: 20
    }, this.scene);
    
    const angle = (index / 12) * Math.PI * 2;
    const distance = 25;
    const x = 100 + Math.cos(angle) * distance;
    const z = 100 + Math.sin(angle) * distance;
    
    pillar.position = new Vector3(x, 9.5, z);
    
    const pillarMaterial = new PBRMaterial(`pillar_mat_${index}`, this.scene);
    pillarMaterial.metallic = 0;
    pillarMaterial.roughness = 0.5;
    pillarMaterial.albedoColor = new Color3(0.8, 0.8, 0.6);
    pillar.material = pillarMaterial;

    return pillar;
  }

  private createTempleStatue(index: number): Mesh {
    const statue = MeshBuilder.CreateCylinder(`temple_statue_${index}`, {
      diameter: 2,
      height: 8,
      tessellation: 16
    }, this.scene);
    
    const angle = (index / 6) * Math.PI * 2;
    const distance = 15;
    const x = 100 + Math.cos(angle) * distance;
    const z = 100 + Math.sin(angle) * distance;
    
    statue.position = new Vector3(x, 6, z);
    
    const statueMaterial = new PBRMaterial(`statue_mat_${index}`, this.scene);
    statueMaterial.metallic = 0.8;
    statueMaterial.roughness = 0.2;
    statueMaterial.albedoColor = new Color3(0.9, 0.9, 0.9);
    statue.material = statueMaterial;

    return statue;
  }

  private async createMarketEnvironment(): Promise<void> {
    console.log('🛒 Creating Market Environment...');
    
    const market = {
      stalls: [] as Mesh[],
      goods: [] as Mesh[],
      decorations: [] as Mesh[]
    };

    // Create market stalls
    for (let i = 0; i < 20; i++) {
      const stall = this.createMarketStall(i);
      market.stalls.push(stall);
    }

    // Create market goods
    for (let i = 0; i < 50; i++) {
      const good = this.createMarketGood(i);
      market.goods.push(good);
    }

    this.environments.set('market', market);
    console.log('✅ Market Environment created');
  }

  private createMarketStall(index: number): Mesh {
    const stall = MeshBuilder.CreateBox(`market_stall_${index}`, {
      width: 6,
      height: 3,
      depth: 4
    }, this.scene);
    
    const angle = (index / 20) * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    stall.position = new Vector3(x, 1.5, z);
    
    const stallMaterial = new PBRMaterial(`stall_mat_${index}`, this.scene);
    stallMaterial.metallic = 0;
    stallMaterial.roughness = 0.7;
    stallMaterial.albedoColor = new Color3(
      0.6 + Math.random() * 0.2,
      0.4 + Math.random() * 0.2,
      0.2 + Math.random() * 0.2
    );
    stall.material = stallMaterial;

    return stall;
  }

  private createMarketGood(index: number): Mesh {
    const goodTypes = ['fruit', 'cloth', 'pottery', 'jewelry'];
    const goodType = goodTypes[Math.floor(Math.random() * goodTypes.length)];
    
    let good: Mesh;
    
    switch (goodType) {
      case 'fruit':
        good = MeshBuilder.CreateSphere(`market_good_${index}`, {
          diameter: 0.3,
          segments: 12
        }, this.scene);
        break;
      case 'cloth':
        good = MeshBuilder.CreateBox(`market_good_${index}`, {
          width: 0.5,
          height: 0.1,
          depth: 0.5
        }, this.scene);
        break;
      case 'pottery':
        good = MeshBuilder.CreateCylinder(`market_good_${index}`, {
          diameter: 0.4,
          height: 0.6,
          tessellation: 12
        }, this.scene);
        break;
      case 'jewelry':
        good = MeshBuilder.CreateBox(`market_good_${index}`, {
          width: 0.2,
          height: 0.2,
          depth: 0.2
        }, this.scene);
        break;
      default:
        good = MeshBuilder.CreateSphere(`market_good_${index}`, {
          diameter: 0.3,
          segments: 12
        }, this.scene);
    }
    
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    good.position = new Vector3(x, 0.5, z);
    
    const goodMaterial = new PBRMaterial(`good_mat_${index}`, this.scene);
    goodMaterial.metallic = goodType === 'jewelry' ? 0.8 : 0;
    goodMaterial.roughness = 0.6;
    
    switch (goodType) {
      case 'fruit':
        goodMaterial.albedoColor = new Color3(1, 0.5, 0);
        break;
      case 'cloth':
        goodMaterial.albedoColor = new Color3(0.8, 0.2, 0.2);
        break;
      case 'pottery':
        goodMaterial.albedoColor = new Color3(0.6, 0.3, 0.1);
        break;
      case 'jewelry':
        goodMaterial.albedoColor = new Color3(1, 1, 0);
        break;
    }
    
    good.material = goodMaterial;

    return good;
  }

  private setupDynamicLoading(): void {
    // Set up chunk loading based on player position
    this.scene.onBeforeRenderObservable.add(() => {
      this.updateChunkLoading();
    });
  }

  private updateChunkLoading(): void {
    const chunkX = Math.floor(this.playerPosition.x / this.config.chunkSize);
    const chunkZ = Math.floor(this.playerPosition.z / this.config.chunkSize);
    
    // Load chunks in render distance
    for (let x = chunkX - this.config.renderDistance; x <= chunkX + this.config.renderDistance; x++) {
      for (let z = chunkZ - this.config.renderDistance; z <= chunkZ + this.config.renderDistance; z++) {
        const chunkKey = `${x},${z}`;
        
        if (!this.loadedChunks.has(chunkKey)) {
          this.loadChunk(x, z);
        }
      }
    }
    
    // Unload distant chunks
    this.unloadDistantChunks(chunkX, chunkZ);
  }

  private loadChunk(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    if (this.loadedChunks.has(chunkKey)) return;
    
    const chunk = this.worldGenerator.generateChunk(chunkX, chunkZ);
    this.chunks.set(chunkKey, chunk);
    this.loadedChunks.add(chunkKey);
    
    console.log(`✅ Loaded chunk: ${chunkKey}`);
  }

  private unloadDistantChunks(playerChunkX: number, playerChunkZ: number): void {
    const chunksToUnload: string[] = [];
    
    this.loadedChunks.forEach(chunkKey => {
      const [x, z] = chunkKey.split(',').map(Number);
      const distance = Math.max(Math.abs(x - playerChunkX), Math.abs(z - playerChunkZ));
      
      if (distance > this.config.renderDistance + 1) {
        chunksToUnload.push(chunkKey);
      }
    });
    
    chunksToUnload.forEach(chunkKey => {
      const chunk = this.chunks.get(chunkKey);
      if (chunk && chunk.mesh) {
        chunk.mesh.dispose();
      }
      this.chunks.delete(chunkKey);
      this.loadedChunks.delete(chunkKey);
      
      console.log(`🗑️ Unloaded chunk: ${chunkKey}`);
    });
  }

  public updatePlayerPosition(position: Vector3): void {
    this.playerPosition = position;
  }

  public getEnvironment(name: string): any {
    return this.environments.get(name);
  }

  public getAllEnvironments(): Map<string, any> {
    return this.environments;
  }

  public getChunkAt(x: number, z: number): any {
    const chunkX = Math.floor(x / this.config.chunkSize);
    const chunkZ = Math.floor(z / this.config.chunkSize);
    const chunkKey = `${chunkX},${chunkZ}`;
    
    return this.chunks.get(chunkKey);
  }
}
