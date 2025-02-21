import { BaseVoxel } from './BaseVoxel.js';
import { DesertBiome } from '../biomes/DesertBiome.js';
import { GrasslandBiome } from '../biomes/GrasslandBiome.js';
import { SnowBiome } from '../biomes/SnowBiome.js';
import { JungleBiome } from '../biomes/JungleBiome.js';
import { MountainBiome } from '../biomes/MountainBiome.js';
import { TundraBiome } from '../biomes/TundraBiome.js';

export class GroundVoxel extends BaseVoxel {
  constructor(world) {
    super(world);
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.biomeNoise = new SimplexNoise();
    this.riverNoise = new SimplexNoise();
    this.riverDetailNoise = new SimplexNoise();

    // Initialize biomes with temperature and moisture preferences
    this.biomes = [
      { name: 'desert', biome: new DesertBiome(world), temperature: 0.7, moisture: -0.2 },
      { name: 'grassland', biome: new GrasslandBiome(world), temperature: 0.0, moisture: 0.1 },
      { name: 'snow', biome: new SnowBiome(world), temperature: -0.7, moisture: 0.0 },
      { name: 'jungle', biome: new JungleBiome(world), temperature: 0.7, moisture: 0.7 },
      { name: 'mountain', biome: new MountainBiome(world), temperature: -0.3, moisture: -0.3 },
      { name: 'tundra', biome: new TundraBiome(world), temperature: -0.5, moisture: 0.1 }
    ];
  }

  calculateRiverValue(x, z) {
    const riverScale = 0.002;
    const riverDetailScale = 0.01;
    
    const riverValue = this.riverNoise.noise2D(x * riverScale, z * riverScale);
    const riverDetail = this.riverDetailNoise.noise2D(x * riverDetailScale, z * riverDetailScale) * 0.3;
    
    const combinedRiver = Math.abs(riverValue + riverDetail * 0.3);
    
    return Math.pow(combinedRiver, 1.5);
  }

  getHeight(x, z) {
    const biomeScale = 0.005;
    const temperatureNoise = this.biomeNoise.noise2D(x * biomeScale, z * biomeScale);
    const moistureNoise = this.biomeNoise.noise2D(x * biomeScale + 1000, z * biomeScale + 1000);

    let totalWeight = 0;
    const biomeHeights = [];
    for (const biomeData of this.biomes) {
      const tempDiff = temperatureNoise - biomeData.temperature;
      const moistureDiff = moistureNoise - biomeData.moisture;
      const weight = 1 / (tempDiff * tempDiff + moistureDiff * moistureDiff + 0.001);
      biomeHeights.push({
        weight,
        height: biomeData.biome.getHeight(x, z)
      });
      totalWeight += weight;
    }

    let h = 0;
    for (const biomeHeight of biomeHeights) {
      const normalizedWeight = biomeHeight.weight / totalWeight;
      h += biomeHeight.height * normalizedWeight;
    }

    const riverValue = this.calculateRiverValue(x, z);
    const riverThreshold = 0.1;
    
    if (riverValue < riverThreshold) {
      const riverDepth = (riverThreshold - riverValue) * 20;
      const minRiverHeight = this.world.waterVoxel.waterLevel - 2;
      
      const valleyFactor = Math.min(1, Math.max(0, (h - minRiverHeight) / 10));
      h -= riverDepth * valleyFactor;
      h = Math.max(h, minRiverHeight);
    }

    return Math.floor(h);
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

    const positions = geometry.attributes.position.array;
    const colors = new Float32Array(positions.length);

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += startX + this.world.chunkSize / 2;
      positions[i + 2] += startZ + this.world.chunkSize / 2;

      const worldX = positions[i];
      const worldZ = positions[i + 2];
      const h = this.getHeight(worldX, worldZ);
      positions[i + 1] = h;

      const biomeScale = 0.005;
      const temperatureNoise = this.biomeNoise.noise2D(worldX * biomeScale, worldZ * biomeScale);
      const moistureNoise = this.biomeNoise.noise2D(worldX * biomeScale + 1000, worldZ * biomeScale + 1000);

      let totalWeight = 0;
      const biomeColors = [];
      for (const biomeData of this.biomes) {
        const tempDiff = temperatureNoise - biomeData.temperature;
        const moistureDiff = moistureNoise - biomeData.moisture;
        const weight = 1 / (tempDiff * tempDiff + moistureDiff * moistureDiff + 0.001);
        biomeColors.push({
          weight,
          color: biomeData.biome.getColor()
        });
        totalWeight += weight;
      }

      let r = 0, g = 0, b = 0;
      for (const biomeColor of biomeColors) {
        const normalizedWeight = biomeColor.weight / totalWeight;
        r += biomeColor.color.r * normalizedWeight;
        g += biomeColor.color.g * normalizedWeight;
        b += biomeColor.color.b * normalizedWeight;
      }

      const variation = Math.random() * 0.1 - 0.05;
      const riverValue = this.calculateRiverValue(worldX, worldZ);
      const riverThreshold = 0.1;
      const isRiver = riverValue < riverThreshold;
      
      if (h < this.world.waterVoxel.waterLevel) {
        const depth = (this.world.waterVoxel.waterLevel - h) / 10;
        const depthFactor = Math.min(depth, 1);
        
        if (isRiver) {
          colors[i]     = 0.4 * (1 - depthFactor) + variation;
          colors[i + 1] = 0.4 * (1 - depthFactor) + variation;
          colors[i + 2] = 0.5 * (1 - depthFactor) + variation;
        } else {
          colors[i]     = (r + variation) * (1 - depthFactor * 0.5);
          colors[i + 1] = (g + variation) * (1 - depthFactor * 0.3);
          colors[i + 2] = (b + variation) + depthFactor * 0.2;
        }
      } else {
        if (isRiver) {
          const bankFactor = (riverThreshold - riverValue) / riverThreshold;
          r = r * (1 - bankFactor) + 0.6 * bankFactor;
          g = g * (1 - bankFactor) + 0.6 * bankFactor;
          b = b * (1 - bankFactor) + 0.5 * bankFactor;
        }
        colors[i]     = r + variation;
        colors[i + 1] = g + variation;
        colors[i + 2] = b + variation;
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false;

    return mesh;
  }

  getBiome(x, z) {
    const biomeScale = 0.005;
    const temperatureNoise = this.biomeNoise.noise2D(x * biomeScale, z * biomeScale);
    const moistureNoise = this.biomeNoise.noise2D(x * biomeScale + 1000, z * biomeScale + 1000);
    let bestWeight = -Infinity;
    let bestBiome = null;
    for (const biomeData of this.biomes) {
      const tempDiff = temperatureNoise - biomeData.temperature;
      const moistureDiff = moistureNoise - biomeData.moisture;
      const weight = 1 / (tempDiff * tempDiff + moistureDiff * moistureDiff + 0.001);
      if (weight > bestWeight) {
        bestWeight = weight;
        bestBiome = biomeData.name;
      }
    }
    return bestBiome;
  }
}