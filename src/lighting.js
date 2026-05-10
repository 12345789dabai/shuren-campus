import * as THREE from 'three';
import { getScene } from './scene.js';

let ambient, directional, hemisphere;
let isNight = false;
let targetIntensity = { ambient: 0.5, dir: 1.0, hemi: 0.4 };
let currentIntensity = { ambient: 0.5, dir: 1.0, hemi: 0.4 };
let transitioning = false;
let skyMesh = null;

export function initLighting() {
  const scene = getScene();

  // 找天空球
  scene.traverse(child => {
    if (child.isMesh && child.geometry.type === 'SphereGeometry' && child.material.side === THREE.BackSide) {
      skyMesh = child;
    }
  });

  ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  hemisphere = new THREE.HemisphereLight(0x87CEEB, 0x3a3a5c, 0.4);
  scene.add(hemisphere);

  directional = new THREE.DirectionalLight(0xffffff, 1.0);
  directional.position.set(50, 80, 30);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 2048;
  directional.shadow.mapSize.height = 2048;
  directional.shadow.camera.near = 1;
  directional.shadow.camera.far = 200;
  directional.shadow.camera.left = -100;
  directional.shadow.camera.right = 100;
  directional.shadow.camera.top = 100;
  directional.shadow.camera.bottom = -100;
  scene.add(directional);

  return { ambient, directional, hemisphere };
}

export function toggleDayNight() {
  isNight = !isNight;
  const scene = getScene();

  if (isNight) {
    targetIntensity = { ambient: 0.06, dir: 0.1, hemi: 0.05 };
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.005);
    updateSkyColors('#0a0a1a', '#0d1530', '#1a1a3a', '#1a1a3a', '#0a0a1a');
  } else {
    targetIntensity = { ambient: 0.5, dir: 1.0, hemi: 0.4 };
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.0025);
    updateSkyColors('#1a2744', '#3a5a8a', '#7fb0d8', '#b8d8e8', '#c8e0f0');
  }
  transitioning = true;
  return isNight;
}

function updateSkyColors(...colors) {
  if (!skyMesh) return;
  const canvas = document.createElement('canvas');
  canvas.width = 2; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.3, colors[1]);
  grad.addColorStop(0.6, colors[2]);
  grad.addColorStop(0.8, colors[3]);
  grad.addColorStop(1, colors[4]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  skyMesh.material.map = new THREE.CanvasTexture(canvas);
  skyMesh.material.needsUpdate = true;
}

export function isNightMode() { return isNight; }

export function updateLighting() {
  if (!transitioning) return;

  const speed = 0.02;
  currentIntensity.ambient += (targetIntensity.ambient - currentIntensity.ambient) * speed;
  currentIntensity.dir += (targetIntensity.dir - currentIntensity.dir) * speed;
  currentIntensity.hemi += (targetIntensity.hemi - currentIntensity.hemi) * speed;

  ambient.intensity = currentIntensity.ambient;
  directional.intensity = currentIntensity.dir;
  hemisphere.intensity = currentIntensity.hemi;

  if (Math.abs(currentIntensity.ambient - targetIntensity.ambient) < 0.005 &&
      Math.abs(currentIntensity.dir - targetIntensity.dir) < 0.005) {
    currentIntensity.ambient = targetIntensity.ambient;
    currentIntensity.dir = targetIntensity.dir;
    currentIntensity.hemi = targetIntensity.hemi;
    transitioning = false;
  }
}
