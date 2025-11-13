// This file exports custom types and interfaces used throughout the project, ensuring strict TypeScript compliance.

export interface GameConfig {
    title: string;
    version: string;
    width: number;
    height: number;
}

export interface Player {
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    health: number;
}

export interface SceneConfig {
    name: string;
    assets: string[];
    ambientLightIntensity: number;
}

export type GameState = 'running' | 'paused' | 'stopped';
