import { Scene, Vector3, Sound, Engine } from "@babylonjs/core";

export interface AudioConfig {
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  spatial?: boolean;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
}

export interface SoundEffect {
  sound: Sound;
  config: AudioConfig;
  isPlaying: boolean;
  volume: number;
}

export class AudioManager {
  private scene: Scene;
  private sounds: Map<string, SoundEffect> = new Map();
  private ambientSounds: Map<string, SoundEffect> = new Map();
  private musicTracks: Map<string, SoundEffect> = new Map();
  private masterVolume = 1.0;
  private sfxVolume = 0.8;
  private musicVolume = 0.6;
  private ambientVolume = 0.4;
  private isMuted = false;
  private audioListener: any; // Placeholder for audio listener

  // Ultra-realistic audio assets
  private readonly AUDIO_ASSETS = {
    // Ambient sounds
    forest_ambient: "https://assets.babylonjs.com/audio/forest_ambient.mp3",
    temple_ambient: "https://assets.babylonjs.com/audio/temple_ambient.mp3",
    village_ambient: "https://assets.babylonjs.com/audio/village_ambient.mp3",
    water_ambient: "https://assets.babylonjs.com/audio/water_ambient.mp3",
    
    // Sound effects
    footsteps_grass: "https://assets.babylonjs.com/audio/footsteps_grass.mp3",
    footsteps_stone: "https://assets.babylonjs.com/audio/footsteps_stone.mp3",
    footsteps_water: "https://assets.babylonjs.com/audio/footsteps_water.mp3",
    jump: "https://assets.babylonjs.com/audio/jump.mp3",
    land: "https://assets.babylonjs.com/audio/land.mp3",
    interact: "https://assets.babylonjs.com/audio/interact.mp3",
    water_splash: "https://assets.babylonjs.com/audio/water_splash.mp3",
    tree_rustle: "https://assets.babylonjs.com/audio/tree_rustle.mp3",
    ui_hover: "https://assets.babylonjs.com/audio/ui_hover.mp3",
    ui_click: "https://assets.babylonjs.com/audio/ui_click.mp3",
    ui_notification: "https://assets.babylonjs.com/audio/ui_notification.mp3",
    
    // Music tracks
    indian_theme: "https://assets.babylonjs.com/audio/indian_theme.mp3",
    temple_music: "https://assets.babylonjs.com/audio/temple_music.mp3",
    adventure_music: "https://assets.babylonjs.com/audio/adventure_music.mp3",
    battle_music: "https://assets.babylonjs.com/audio/battle_music.mp3"
  };

  constructor(scene: Scene) {
    this.scene = scene;
    this.audioListener = null; // Will be implemented with proper audio API
    this.initializeAudio();
  }

  private initializeAudio(): void {
    // Preload all audio assets
    this.preloadSounds();
    
    // Start ambient sounds
    this.startAmbientSounds();
    
    console.log("Ultra-realistic audio system initialized");
  }

  private preloadSounds(): void {
    // Preload ambient sounds
    Object.entries(this.AUDIO_ASSETS).forEach(([soundId, url]) => {
      this.loadSound(soundId, {
        volume: this.getDefaultVolume(soundId),
        loop: this.isAmbientSound(soundId),
        autoplay: false,
        spatial: this.isSpatialSound(soundId),
        maxDistance: 100,
        refDistance: 10,
        rolloffFactor: 1
      });
    });
  }

  private getDefaultVolume(soundId: string): number {
    if (soundId.includes('ambient')) return this.ambientVolume;
    if (soundId.includes('music')) return this.musicVolume;
    return this.sfxVolume;
  }

  private isAmbientSound(soundId: string): boolean {
    return soundId.includes('ambient') || soundId.includes('music');
  }

  private isSpatialSound(soundId: string): boolean {
    return soundId.includes('footsteps') || soundId.includes('splash') || soundId.includes('rustle');
  }

  private loadSound(soundId: string, config: AudioConfig): SoundEffect {
    try {
      const sound = new Sound(soundId, this.AUDIO_ASSETS[soundId as keyof typeof this.AUDIO_ASSETS], this.scene, () => {
        console.log(`Loaded audio: ${soundId}`);
      }, {
        volume: config.volume || 1.0,
        loop: config.loop || false,
        autoplay: config.autoplay || false,
        spatialSound: config.spatial || false,
        maxDistance: config.maxDistance || 100,
        refDistance: config.refDistance || 10,
        rolloffFactor: config.rolloffFactor || 1
      });

      const soundEffect: SoundEffect = {
        sound,
        config,
        isPlaying: false,
        volume: config.volume || 1.0
      };

      // Store in appropriate map
      if (this.isAmbientSound(soundId)) {
        if (soundId.includes('music')) {
          this.musicTracks.set(soundId, soundEffect);
        } else {
          this.ambientSounds.set(soundId, soundEffect);
        }
      } else {
        this.sounds.set(soundId, soundEffect);
      }

      return soundEffect;
    } catch (error) {
      console.error(`Failed to load sound: ${soundId}`, error);
      // Create a fallback silent sound
      const fallbackSound = new Sound(soundId, "", this.scene);
      return {
        sound: fallbackSound,
        config,
        isPlaying: false,
        volume: 0
      };
    }
  }

  private startAmbientSounds(): void {
    // Start forest ambient sound
    const forestAmbient = this.ambientSounds.get('forest_ambient');
    if (forestAmbient) {
      forestAmbient.sound.play();
      forestAmbient.isPlaying = true;
    }

    // Start Indian theme music
    const indianTheme = this.musicTracks.get('indian_theme');
    if (indianTheme) {
      indianTheme.sound.play();
      indianTheme.isPlaying = true;
    }
  }

  public playSound(soundId: string, position?: Vector3, volume?: number): void {
    const soundEffect = this.sounds.get(soundId) || this.ambientSounds.get(soundId) || this.musicTracks.get(soundId);
    
    if (!soundEffect) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    if (position && soundEffect.config.spatial) {
      this.playSpatialSound(soundEffect, position);
    } else {
      soundEffect.sound.setVolume((volume || soundEffect.volume) * this.masterVolume);
      soundEffect.sound.play();
      soundEffect.isPlaying = true;
    }
  }

  private playSpatialSound(soundEffect: SoundEffect, position: Vector3): void {
    // Set spatial position
    soundEffect.sound.setPosition(position);
    soundEffect.sound.setVolume(soundEffect.volume * this.masterVolume);
    soundEffect.sound.play();
    soundEffect.isPlaying = true;
  }

  public playFootstep(surfaceType: 'grass' | 'stone' | 'water', position?: Vector3): void {
    const soundId = `footsteps_${surfaceType}`;
    this.playSound(soundId, position, this.sfxVolume);
  }

  public playJump(position?: Vector3): void {
    this.playSound('jump', position, this.sfxVolume);
  }

  public playLand(position?: Vector3): void {
    this.playSound('land', position, this.sfxVolume);
  }

  public playInteraction(position?: Vector3): void {
    this.playSound('interact', position, this.sfxVolume);
  }

  public playWaterSplash(position?: Vector3): void {
    this.playSound('water_splash', position, this.sfxVolume);
  }

  public playTreeRustle(position?: Vector3): void {
    this.playSound('tree_rustle', position, this.sfxVolume);
  }

  public playUISound(soundId: 'hover' | 'click' | 'notification'): void {
    const uiSoundId = `ui_${soundId}`;
    this.playSound(uiSoundId, undefined, this.sfxVolume);
  }

  public playMusic(trackId: string, fadeIn: boolean = true): void {
    const musicTrack = this.musicTracks.get(trackId);
    if (!musicTrack) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    // Stop current music
    this.stopMusic(false);

    if (fadeIn) {
      musicTrack.sound.setVolume(0);
      musicTrack.sound.play();
      musicTrack.isPlaying = true;
      
      // Fade in over 2 seconds
      let volume = 0;
      const fadeInterval = setInterval(() => {
        volume += 0.01;
        musicTrack.sound.setVolume(volume * this.musicVolume * this.masterVolume);
        if (volume >= 1) {
          clearInterval(fadeInterval);
        }
      }, 20);
    } else {
      musicTrack.sound.setVolume(this.musicVolume * this.masterVolume);
      musicTrack.sound.play();
      musicTrack.isPlaying = true;
    }
  }

  public stopMusic(fadeOut: boolean = true): void {
    this.musicTracks.forEach(track => {
      if (track.isPlaying) {
        if (fadeOut) {
          // Fade out over 1 second
          let volume = track.volume;
          const fadeInterval = setInterval(() => {
            volume -= 0.01;
            track.sound.setVolume(volume * this.musicVolume * this.masterVolume);
            if (volume <= 0) {
              track.sound.stop();
              track.isPlaying = false;
              clearInterval(fadeInterval);
            }
          }, 10);
        } else {
          track.sound.stop();
          track.isPlaying = false;
        }
      }
    });
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  public setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  private updateAllVolumes(): void {
    // Update SFX volumes
    this.sounds.forEach(soundEffect => {
      soundEffect.sound.setVolume(soundEffect.volume * this.sfxVolume * this.masterVolume);
    });

    // Update ambient volumes
    this.ambientSounds.forEach(soundEffect => {
      soundEffect.sound.setVolume(soundEffect.volume * this.ambientVolume * this.masterVolume);
    });

    // Update music volumes
    this.musicTracks.forEach(soundEffect => {
      soundEffect.sound.setVolume(soundEffect.volume * this.musicVolume * this.masterVolume);
    });
  }

  public mute(): void {
    this.isMuted = true;
    this.setMasterVolume(0);
  }

  public unmute(): void {
    this.isMuted = false;
    this.setMasterVolume(1);
  }

  public toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  public updateSpatialAudio(playerPosition: Vector3): void {
    // Update audio listener position
    if (this.audioListener) {
      this.audioListener.setPosition(playerPosition);
    }

    // Update spatial sounds based on player position
    this.sounds.forEach(soundEffect => {
      if (soundEffect.config.spatial && soundEffect.isPlaying) {
        // Calculate distance and adjust volume
        const distance = Vector3.Distance(playerPosition, Vector3.Zero()); // Sound position not available in current Babylon.js version
        const maxDistance = soundEffect.config.maxDistance || 100;
        
        if (distance > maxDistance) {
          soundEffect.sound.setVolume(0);
        } else {
          const volume = 1 - (distance / maxDistance);
          soundEffect.sound.setVolume(volume * soundEffect.volume * this.sfxVolume * this.masterVolume);
        }
      }
    });
  }

  public dispose(): void {
    // Dispose all sounds
    this.sounds.forEach(soundEffect => {
      soundEffect.sound.dispose();
    });
    this.ambientSounds.forEach(soundEffect => {
      soundEffect.sound.dispose();
    });
    this.musicTracks.forEach(soundEffect => {
      soundEffect.sound.dispose();
    });

    // Clear maps
    this.sounds.clear();
    this.ambientSounds.clear();
    this.musicTracks.clear();

    // Dispose audio listener
    if (this.audioListener) {
      this.audioListener.dispose();
    }
  }
}
