import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getCamera, getRenderer } from './scene.js';
import * as THREE from 'three';

let controls;
let isRoaming = false;
let roamSpeed = 0.005;
let curve;
let roamProgress = 0;
let roamDirection = 1;
let animationId = null;

// 预设视角
const VIEWS = {
  perspective: { pos: [40, 30, 60], target: [0, 5, 0] },
  birdseye:    { pos: [0, 80, 2],   target: [0, 0, 0] },
  library:     { pos: [-25, 15, 30], target: [-25, 7, 0] },
  gate:        { pos: [0, 5, 80],    target: [0, 3, 65] },
};

export function initControls() {
  const camera = getCamera();
  const renderer = getRenderer();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 180;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 5, 0);
  controls.update();

  initRoamPath();

  return controls;
}

export function getControls() {
  return controls;
}

// ===== 视角切换 =====
export function switchView(viewName) {
  const view = VIEWS[viewName];
  if (!view) return;

  const camera = getCamera();
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const toPos = new THREE.Vector3(...view.pos);
  const toTarget = new THREE.Vector3(...view.target);
  const duration = 1000;
  const start = performance.now();

  function animate() {
    const elapsed = performance.now() - start;
    const t = Math.min(elapsed / duration, 1);
    // easeInOutQuad
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    camera.position.lerpVectors(fromPos, toPos, ease);
    controls.target.lerpVectors(fromTarget, toTarget, ease);
    controls.update();

    if (t < 1) requestAnimationFrame(animate);
  }
  animate();
}

// ===== 自动漫游 =====
function initRoamPath() {
  const points = [
    [0, 45, 85],
    [60, 25, 50],
    [70, 15, 0],
    [60, 10, -45],
    [0, 15, -50],
    [-50, 10, -40],
    [-65, 20, 0],
    [-50, 30, 50],
    [0, 45, 85],
  ].map(p => new THREE.Vector3(p[0], p[1], p[2]));

  curve = new THREE.CatmullRomCurve3(points);
}

export function toggleRoam() {
  if (isRoaming) {
    stopRoam();
  } else {
    startRoam();
  }
  return isRoaming;
}

export function isRoamingState() {
  return isRoaming;
}

function startRoam() {
  isRoaming = true;
  const camera = getCamera();

  function animate() {
    if (!isRoaming) return;

    roamProgress += roamSpeed * roamDirection;

    if (roamProgress >= 1) {
      roamProgress = 0;
    }
    if (roamProgress < 0) roamProgress = 0;

    const pos = curve.getPoint(roamProgress);
    const lookAhead = curve.getPoint(Math.min(roamProgress + 0.02, 1));

    camera.position.copy(pos);
    controls.target.copy(lookAhead);
    controls.update();

    animationId = requestAnimationFrame(animate);
  }
  animate();
}

function stopRoam() {
  isRoaming = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function setRoamSpeed(speed) {
  roamSpeed = speed * 0.001;
}

export function updateControls() {
  if (controls) {
    controls.update();
  }
}
