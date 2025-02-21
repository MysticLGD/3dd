import { GroundVoxel } from './voxels/GroundVoxel.js';
import { CloudVoxel } from './voxels/CloudVoxel.js';
import { WaterVoxel } from './voxels/WaterVoxel.js';

export class VoxelWorld {
  constructor() {
    this.chunkSize = 32;
    this.renderDistance = 4;
    this.cloudRenderDistance = this.renderDistance + 5; 
    this.chunks = new Map();
    this.cloudChunks = new Map(); 
    
    this.groundVoxel = new GroundVoxel(this);
    this.cloudVoxel = new CloudVoxel(this);
    this.waterVoxel = new WaterVoxel(this);
    
    this.groundGroup = new THREE.Group();
    this.cloudGroup = new THREE.Group();
    this.waterGroup = new THREE.Group();

    this.cloudUpdateInterval = 3.0;
    
    this.heightCache = new Map();
    this.voxelCache = new Map();
    this.biomeCache = new Map();
  }

  getGroundHeight(x, z) {
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    if (this.heightCache.has(key)) {
      return this.heightCache.get(key);
    }

    const height = this.groundVoxel.getHeight(x, z);
    this.heightCache.set(key, height);
    return height;
  }

  getVoxel(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    if (this.voxelCache.has(key)) {
      return this.voxelCache.get(key);
    }

    const groundHeight = this.getGroundHeight(x, z);
    let voxelType;
    if (y < groundHeight) voxelType = 1;
    else if (y === groundHeight) voxelType = 3;
    else voxelType = 0;

    this.voxelCache.set(key, voxelType);
    return voxelType;
  }

  getBiome(x, z) {
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    if (this.biomeCache.has(key)) {
      return this.biomeCache.get(key);
    }

    const biome = this.groundVoxel.getBiome(x, z);
    this.biomeCache.set(key, biome);
    return biome;
  }

  generate(cameraPosition) {
    this.updateChunks(cameraPosition, performance.now() * 0.001);
  }

  update(time, cameraPosition) {
    if (time % 3 === 0) {
      this.updateChunks(cameraPosition, time);
    }
  }

  updateChunks(cameraPosition, time) {
    const centerChunkX = Math.floor(cameraPosition.x / this.chunkSize);
    const centerChunkZ = Math.floor(cameraPosition.z / this.chunkSize);

    const activeGroundChunks = new Set();
    const activeCloudChunks = new Set();

    for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
      for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
        if (Math.abs(dx) + Math.abs(dz) > this.renderDistance * 1.5) continue;
        
        const cx = centerChunkX + dx;
        const cz = centerChunkZ + dz;
        const key = `${cx},${cz}`;
        activeGroundChunks.add(key);
        
        if (!this.chunks.has(key)) {
          const chunk = this.generateGroundChunk(cx, cz);
          this.chunks.set(key, chunk);
        }
      }
    }

    for (let dz = -this.cloudRenderDistance; dz <= this.cloudRenderDistance; dz++) {
      for (let dx = -this.cloudRenderDistance; dx <= this.cloudRenderDistance; dx++) {
        if (Math.abs(dx) + Math.abs(dz) > this.cloudRenderDistance * 1.5) continue;
        
        const cx = centerChunkX + dx;
        const cz = centerChunkZ + dz;
        const key = `${cx},${cz}`;
        activeCloudChunks.add(key);
        
        if (!this.cloudChunks.has(key)) {
          const cloudMesh = this.cloudVoxel.generateMesh(cx, cz, time);
          this.cloudGroup.add(cloudMesh);
          this.cloudChunks.set(key, { 
            cloudMesh,
            lastCloudUpdate: time
          });
        } else if (time - this.cloudChunks.get(key).lastCloudUpdate > this.cloudUpdateInterval) {
          this.cloudVoxel.update(this.cloudChunks.get(key).cloudMesh, time);
          this.cloudChunks.get(key).lastCloudUpdate = time;
        }
      }
    }

    for (const [key, chunk] of this.chunks.entries()) {
      if (!activeGroundChunks.has(key)) {
        this.groundGroup.remove(chunk.groundMesh);
        this.waterGroup.remove(chunk.waterMesh);
        chunk.groundMesh.geometry.dispose();
        chunk.waterMesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }

    for (const [key, chunk] of this.cloudChunks.entries()) {
      if (!activeCloudChunks.has(key)) {
        this.cloudGroup.remove(chunk.cloudMesh);
        chunk.cloudMesh.geometry.dispose();
        this.cloudChunks.delete(key);
      }
    }
  }

  generateGroundChunk(chunkX, chunkZ) {
    const groundMesh = this.groundVoxel.generateMesh(chunkX, chunkZ);
    const waterMesh = this.waterVoxel.generateMesh(chunkX, chunkZ);

    this.groundGroup.add(groundMesh);
    this.waterGroup.add(waterMesh);

    return {
      chunkX,
      chunkZ,
      groundMesh,
      waterMesh
    };
  }
}