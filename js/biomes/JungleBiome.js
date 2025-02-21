import { BaseBiome } from './BaseBiome.js';

export class JungleBiome extends BaseBiome {
  constructor(world) {
    super(world);
    this.terrainNoise = new SimplexNoise();
    this.detailNoise = new SimplexNoise();
  }

  getColor() {
    return { r: 0.15, g: 0.5, b: 0.15 };
  }

  generateTerrain(x, z) {
    const terrainScale = 0.02;
    // Create more varied and steep terrain for jungle
    const n1 = this.terrainNoise.noise2D(x * terrainScale, z * terrainScale);
    const n2 = this.terrainNoise.noise2D(x * terrainScale * 2, z * terrainScale * 2) * 0.5;
    const n3 = this.detailNoise.noise2D(x * terrainScale * 4, z * terrainScale * 4) * 0.25;
    return (n1 + n2 + n3) * 1.5; // Amplified terrain
  }

  getHeight(x, z) {
    const combined = this.generateTerrain(x, z);
    return Math.floor(18 + combined * 8); // Higher base height and more vertical variation
  }
}