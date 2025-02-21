import { BaseBiome } from './BaseBiome.js';

export class MountainBiome extends BaseBiome {
  constructor(world) {
    super(world);
    this.terrainNoise = new SimplexNoise();
    this.peakNoise = new SimplexNoise();
  }

  getColor() {
    return { r: 0.6, g: 0.6, b: 0.65 };
  }

  generateTerrain(x, z) {
    const terrainScale = 0.015;
    // Create sharp peaks and ridges
    const n1 = Math.abs(this.terrainNoise.noise2D(x * terrainScale, z * terrainScale));
    const n2 = Math.abs(this.terrainNoise.noise2D(x * terrainScale * 2, z * terrainScale * 2)) * 0.5;
    const peak = Math.pow(this.peakNoise.noise2D(x * terrainScale * 0.5, z * terrainScale * 0.5), 2) * 2;
    return n1 + n2 + peak;
  }

  getHeight(x, z) {
    const combined = this.generateTerrain(x, z);
    return Math.floor(20 + combined * 15); // Much higher terrain
  }
}