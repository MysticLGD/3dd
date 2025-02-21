import { BaseVoxel } from './BaseVoxel.js';

const vertexShader = `
  varying vec4 vColor;
  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec4 vColor;
  void main() {
    if(vColor.a < 0.1) discard;
    gl_FragColor = vColor;
  }
`;

export class CloudVoxel extends BaseVoxel {
  constructor(world) {
    super(world);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.baseCloudNoise = new SimplexNoise();
    this.dynamicCloudNoise = new SimplexNoise();
    this.verticalCloudNoise = new SimplexNoise();
    this.shapeCloudNoise = new SimplexNoise();
    this.cloudHeight = 100;
    this.cloudThickness = 20;
    
    // Add timing variables for stepped animation
    this.lastUpdateTime = 0;
    this.currentTimeState = 0;
    this.nextTimeState = 0;
    this.transitionProgress = 0;
  }

  getMaterial() {
    return this.material;
  }

  generateMesh(chunkX, chunkZ, time) {
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
    const vertexCount = positions.length / 3;
    const colors = new Float32Array(vertexCount * 4);

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += startX + this.world.chunkSize / 2;
      positions[i + 2] += startZ + this.world.chunkSize / 2;
    }

    this.updatePositionsAndColors(positions, colors, time);

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    geometry.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false;
    
    return mesh;
  }

  update(mesh, time) {
    const positions = mesh.geometry.attributes.position.array;
    const colors = mesh.geometry.attributes.color.array;
    
    this.updatePositionsAndColors(positions, colors, time);
    
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  updatePositionsAndColors(positions, colors, time) {
    // Update time states for stepped animation - changed to 5-second steps
    const timeStep = Math.floor(time / 5);
    if (timeStep !== this.currentTimeState) {
      this.currentTimeState = timeStep;
      this.nextTimeState = timeStep + 1;
    }

    const cloudThreshold = 0.6;
    const scale = 0.01;
    const vertexCount = positions.length / 3;
    const fadeRange = 0.1;

    for (let i = 0; i < vertexCount; i++) {
      const posIndex = i * 3;
      const colorIndex = i * 4;

      const posX = positions[posIndex];
      const posZ = positions[posIndex + 2];

      // Use stepped time for noise calculations with further reduced speed
      const currentTime = this.currentTimeState * 0.75; // Reduced from 1.5
      
      // Base cloud noise - further reduced movement speed
      const baseNoise = this.baseCloudNoise.noise3D(
        posX * scale + currentTime * 0.005, // Reduced from 0.01
        this.cloudHeight * 0.01,
        posZ * scale + currentTime * 0.0025 // Reduced from 0.005
      );
      
      // Dynamic movement noise - further reduced influence and speed
      const dynamicNoise = this.dynamicCloudNoise.noise4D(
        posX * scale * 0.5,
        posZ * scale * 0.5,
        currentTime * 0.0075, // Reduced from 0.015
        0
      ) * 0.075; // Reduced from 0.15
      
      // Shape-changing noise - further reduced influence and speed
      const shapeNoise = this.shapeCloudNoise.noise4D(
        posX * scale * 0.3,
        posZ * scale * 0.3,
        currentTime * 0.0025, // Reduced from 0.005
        0
      ) * 0.1; // Reduced from 0.2
      
      // Vertical variation noise with further reduced movement
      const verticalNoise = this.verticalCloudNoise.noise4D(
        posX * scale * 2,
        posZ * scale * 2,
        currentTime * 0.005, // Reduced from 0.01
        0
      ) * this.cloudThickness;
      
      const noiseValue = baseNoise + dynamicNoise + shapeNoise;

      if (noiseValue > cloudThreshold) {
        const heightVariation = Math.min(verticalNoise * 2, this.cloudThickness);
        
        // Further reduced vertical movement amplitude
        const timeOffset = Math.sin(currentTime * 0.125 + posX * 0.01 + posZ * 0.01) * 0.5; // Reduced from 1
        positions[posIndex + 1] = this.cloudHeight + heightVariation + timeOffset;
        
        let alpha = Math.min(Math.max((noiseValue - cloudThreshold) / fadeRange, 0), 1);
        
        // Keep high brightness for white clouds
        const brightness = 0.98 + (noiseValue - cloudThreshold) * 0.02;
        
        colors[colorIndex] = brightness;
        colors[colorIndex + 1] = brightness;
        colors[colorIndex + 2] = brightness;
        colors[colorIndex + 3] = alpha * 0.8;
      } else {
        positions[posIndex + 1] = this.cloudHeight;
        colors[colorIndex] = 1.0;
        colors[colorIndex + 1] = 1.0;
        colors[colorIndex + 2] = 1.0;
        colors[colorIndex + 3] = 0.0;
      }
    }
  }
}