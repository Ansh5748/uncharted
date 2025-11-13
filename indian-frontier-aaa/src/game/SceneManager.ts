import { Scene } from "@babylonjs/core";
export class SceneManager {
  constructor(private scene: Scene) {}
  public async loadInitialScene(): Promise<void> {}
}
