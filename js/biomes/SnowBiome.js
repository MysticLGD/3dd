import { BaseBiome } from './BaseBiome.js';

export class SnowBiome extends BaseBiome {
  constructor(world) {
    super(world);
    this.terrainNoise = new SimplexNoise();
  }

  getColor() {
    return { r: 0.9, g: 0.9, b: 0.9 };
  }

  generateTerrain(x, z) {
    const terrainScale = 0.02;
    const n1 = this.terrainNoise.noise2D(x * terrainScale * 0.8, z * terrainScale * 0.8);
    const n2 = this.terrainNoise.noise2D(x * terrainScale * 1.6, z * terrainScale * 1.6) * 0.4;
    const n3 = this.terrainNoise.noise2D(x * terrainScale * 3.2, z * terrainScale * 3.2) * 0.2;
    return n1 + n2 + n3;
  }

  getHeight(x, z) {
    const combined = this.generateTerrain(x, z);
    return Math.floor(16 + combined * 4);
  }
}