import { VoxelWorld } from './VoxelWorld.js';
import { FirstPersonControls } from './FirstPersonControls.js';

let camera, scene, renderer;
let world, controls;
let lastTime = performance.now();
let frameCount = 0;
let lastFpsUpdate = 0;
const fpsUpdateInterval = 500;
const fpsElement = document.getElementById('fps');

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const ambientLight = new THREE.AmbientLight(0x888888);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  scene.add(directionalLight);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  world = new VoxelWorld();
  
  // Generate initial chunks around starting position
  world.generate(new THREE.Vector3(32, 40, 32));
  
  scene.add(world.groundGroup);
  scene.add(world.cloudGroup);
  scene.add(world.waterGroup);

  // Move camera to a better starting position
  camera.position.set(32, 40, 32);
  
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('container').appendChild(renderer.domElement);

  controls = new FirstPersonControls(camera, renderer.domElement, world);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  frameCount++;
  
  if (currentTime - lastFpsUpdate > fpsUpdateInterval) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
    fpsElement.textContent = fps;
    frameCount = 0;
    lastFpsUpdate = currentTime;
  }

  world.generate(camera.position);
  world.update(currentTime * 0.001, camera.position);
  controls.update(deltaTime);

  document.getElementById('coords').textContent =
    `${Math.round(camera.position.x)}, ${Math.round(camera.position.y)}, ${Math.round(camera.position.z)}`;
  document.getElementById('biome').textContent = world.getBiome(camera.position.x, camera.position.z);
  
  renderer.render(scene, camera);
}