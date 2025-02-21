import { BaseBiome } from './BaseBiome.js';

export class GrasslandBiome extends BaseBiome {
  constructor(world) {
    super(world);
    this.terrainNoise = new SimplexNoise();
    this.detailNoise = new SimplexNoise();
  }

  getColor() {
    return { r: 0.2, g: 0.6, b: 0.2 };
  }

  generateTerrain(x, z) {
    const terrainScale = 0.02;
    const n1 = this.terrainNoise.noise2D(x * terrainScale, z * terrainScale);
    const n2 = this.terrainNoise.noise2D(x * terrainScale * 2, z * terrainScale * 2) * 0.3;
    const n3 = this.detailNoise.noise2D(x * terrainScale * 4, z * terrainScale * 4) * 0.1;
    
    // Add rolling hills characteristic of grasslands
    const baseHeight = (n1 + n2 + n3);
    return Math.pow(Math.abs(baseHeight), 1.2) * Math.sign(baseHeight);
  }

  getHeight(x, z) {
    const combined = this.generateTerrain(x, z);
    return Math.floor(16 + combined * 6);
  }
}