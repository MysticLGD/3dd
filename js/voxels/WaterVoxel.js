import { BaseVoxel } from './BaseVoxel.js';

export class WaterVoxel extends BaseVoxel {
  constructor(world) {
    super(world);
    this.material = new THREE.MeshPhongMaterial({
      color: 0x4060ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2
    });
    this.waterLevel = 16;
  }

  getMaterial() {
    return this.material;
  }

  generateMesh(chunkX, chunkZ) {
    const startX = chunkX * this.world.chunkSize;
    const startZ = chunkZ * this.world.chunkSize;
    const segments = this.world.chunkSize;

    const geometry = new THREE.PlaneBufferGeometry(
      this.world.chunkSize, 
      this.world.chunkSize, 
      segments, 
      segments
    );
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(
      startX + this.world.chunkSize / 2, 
      this.waterLevel, 
      startZ + this.world.chunkSize / 2
    );
    
    geometry.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false;
    
    return mesh;
  }
}