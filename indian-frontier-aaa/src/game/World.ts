import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  CubeTexture,
  Texture,
  SceneLoader,
  AbstractMesh
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";

export class World {
  private assetsLoaded = false;

  constructor(private scene: Scene) {}

  public async init(): Promise<void> {
    try {
      // Realistic skybox
      const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, this.scene);
      const skyboxMaterial = new StandardMaterial("skyBoxMat", this.scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new CubeTexture("https://assets.babylonjs.com/environments/environmentSpecular.env", this.scene);
      skyboxMaterial.reflectionTexture.coordinatesMode = 5;
      skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
      skyboxMaterial.specularColor = new Color3(0, 0, 0);
      skybox.material = skyboxMaterial;

      // Realistic terrain using a height map
      const ground = MeshBuilder.CreateGroundFromHeightMap(
        "ground",
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
      const groundMat = new StandardMaterial("groundMat", this.scene);
      groundMat.diffuseTexture = new Texture("https://assets.babylonjs.com/environments/villagegreen.png", this.scene);
      ground.material = groundMat;

      // Add a few "temple" pillars (Indian theme)
      for (let i = 0; i < 5; i++) {
        const pillar = MeshBuilder.CreateCylinder(`pillar${i}`, { diameter: 2, height: 8 }, this.scene);
        pillar.position = new Vector3(10 + i * 10, 4, 10 + Math.sin(i) * 10);
        const pillarMat = new StandardMaterial(`pillarMat${i}`, this.scene);
        pillarMat.diffuseColor = new Color3(0.9, 0.9, 0.7);
        pillar.material = pillarMat;
      }

      // Add a few trees (simple for now, can be replaced with models)
      for (let i = 0; i < 8; i++) {
        const trunk = MeshBuilder.CreateCylinder(`trunk${i}`, { diameter: 0.7, height: 4 }, this.scene);
        trunk.position = new Vector3(-30 + i * 8, 2, 15 + Math.sin(i) * 10);
        const trunkMat = new StandardMaterial(`trunkMat${i}`, this.scene);
        trunkMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
        trunk.material = trunkMat;

        const leaves = MeshBuilder.CreateSphere(`leaves${i}`, { diameter: 3 }, this.scene);
        leaves.position = trunk.position.add(new Vector3(0, 3, 0));
        const leavesMat = new StandardMaterial(`leavesMat${i}`, this.scene);
        leavesMat.diffuseColor = new Color3(0.1, 0.6, 0.2);
        leaves.material = leavesMat;
      }

      // Add river
      const riverMesh = MeshBuilder.CreateGround("river", { width: 40, height: 200, subdivisions: 32 }, this.scene);
      riverMesh.position = new Vector3(-40, 0.5, 0);
      const waterMaterial = new WaterMaterial("waterMaterial", this.scene);
      waterMaterial.backFaceCulling = true;
      waterMaterial.bumpTexture = new Texture("https://assets.babylonjs.com/environments/waterbump.png", this.scene);
      waterMaterial.windForce = 10;
      waterMaterial.waveHeight = 0.5;
      waterMaterial.bumpHeight = 0.1;
      waterMaterial.waterColor = new Color3(0.1, 0.3, 0.6);
      waterMaterial.colorBlendFactor = 0.3;
      waterMaterial.addToRenderList(this.scene.getMeshByName("skyBox")!);
      waterMaterial.addToRenderList(this.scene.getMeshByName("ground")!);
      riverMesh.material = waterMaterial;

      // Load a free Indian temple GLB model (replace with a real one when available)
      await this.loadGLBModel(
        "https://models.babylonjs.com/CornellBox/glTF/CornellBox.glb",
        new Vector3(30, 0, 30)
      );

      this.assetsLoaded = true;
    } catch (err) {
      alert("Failed to load world assets: " + (err instanceof Error ? err.message : err));
    }
  }

  // Modular asset loader for future streaming
  public async loadGLBModel(url: string, position: Vector3): Promise<AbstractMesh | null> {
    try {
      const result = await SceneLoader.ImportMeshAsync("", url, "", this.scene);
      if (result.meshes.length > 0) {
        result.meshes[0].position = position;
        return result.meshes[0];
      }
      return null;
    } catch (err) {
      console.error("Failed to load model:", url, err);
      return null;
    }
  }
}
