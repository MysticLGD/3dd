import { BaseBiome } from './BaseBiome.js';

export class TundraBiome extends BaseBiome {
  constructor(world) {
    super(world);
    this.terrainNoise = new SimplexNoise();
    this.roughnessNoise = new SimplexNoise();
  }

  getColor() {
    return { r: 0.85, g: 0.87, b: 0.9 };
  }

  generateTerrain(x, z) {
    const terrainScale = 0.025;
    // Create flat terrain with occasional small hills
    const n1 = this.terrainNoise.noise2D(x * terrainScale, z * terrainScale) * 0.7;
    const roughness = this.roughnessNoise.noise2D(x * terrainScale * 3, z * terrainScale * 3) * 0.3;
    return n1 + roughness;
  }

  getHeight(x, z) {
    const combined = this.generateTerrain(x, z);
    return Math.floor(15 + combined * 3); // Relatively flat terrain
  }
}