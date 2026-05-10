import * as THREE from 'three';
import { getScene } from './scene.js';

let ambient, directional, hemisphere;
let isNight = false;
let targetIntensity = { ambient: 0.5, dir: 1.0 };
let currentIntensity = { ambient: 0.5, dir: 1.0 };
let transitioning = false;

export function initLighting() {
  const scene = getScene();

  // 环境光
  ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // 半球光（模拟天光）
  hemisphere = new THREE.HemisphereLight(0x87CEEB, 0x3a3a5c, 0.4);
  scene.add(hemisphere);

  // 方向光（主光源）
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
    targetIntensity = { ambient: 0.08, dir: 0.15 };
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 80, 150);
  } else {
    targetIntensity = { ambient: 0.5, dir: 1.0 };
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 180, 280);
  }
  transitioning = true;
  return isNight;
}

export function isNightMode() {
  return isNight;
}

export function updateLighting() {
  if (!transitioning) return;

  const speed = 0.02;
  currentIntensity.ambient += (targetIntensity.ambient - currentIntensity.ambient) * speed;
  currentIntensity.dir += (targetIntensity.dir - currentIntensity.dir) * speed;

  ambient.intensity = currentIntensity.ambient;
  directional.intensity = currentIntensity.dir;

  if (Math.abs(currentIntensity.ambient - targetIntensity.ambient) < 0.01 &&
      Math.abs(currentIntensity.dir - targetIntensity.dir) < 0.01) {
    currentIntensity.ambient = targetIntensity.ambient;
    currentIntensity.dir = targetIntensity.dir;
    transitioning = false;
  }
}
