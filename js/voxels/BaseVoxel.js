export class BaseVoxel {
  constructor(world) {
    this.world = world;
  }

  // Base methods that can be overridden by specific voxel types
  getHeight(x, z) {
    return 0;
  }

  getMaterial() {
    return null;
  }

  generateMesh(chunkX, chunkZ, time) {
    return null;
  }

  update(mesh, time) {
    // Default no update behavior
  }
}