import * as THREE from 'three';

let scene, camera, renderer;

export function initScene(container) {
  scene = new THREE.Scene();

  // 渐变天空（用大球体）
  createSky(scene);

  // 雾气
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.0025);

  // 相机
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(45, 35, 65);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 响应式
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function createSky(scene) {
  // 渐变天空球
  const skyGeo = new THREE.SphereGeometry(250, 32, 32);
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2; skyCanvas.height = 256;
  const ctx = skyCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#1a2744');
  gradient.addColorStop(0.3, '#3a5a8a');
  gradient.addColorStop(0.6, '#7fb0d8');
  gradient.addColorStop(0.8, '#b8d8e8');
  gradient.addColorStop(1, '#c8e0f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture, side: THREE.BackSide, depthWrite: false
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.y = 0;
  scene.add(sky);
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
