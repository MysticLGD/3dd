import { BaseBiome } from './BaseBiome.js';

export class DesertBiome extends BaseBiome {
  constructor(world) {
    super(world);
    this.terrainNoise = new SimplexNoise();
  }

  getColor() {
    return { r: 0.76, g: 0.7, b: 0.5 };
  }

  generateTerrain(x, z) {
    const terrainScale = 0.02;
    const n1 = this.terrainNoise.noise2D(x * terrainScale * 0.5, z * terrainScale * 0.5);
    return n1 * 2;
  }

  getHeight(x, z) {
    const combined = this.generateTerrain(x, z);
    return Math.floor(16 + combined * 4);
  }
}