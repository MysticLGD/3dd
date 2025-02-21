export class BaseBiome {
  constructor(world) {
    this.world = world;
  }

  getHeight(x, z) {
    return 0;
  }

  getColor() {
    return { r: 0.5, g: 0.5, b: 0.5 };
  }

  generateTerrain(x, z) {
    return 0;
  }
}