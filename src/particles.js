import * as THREE from 'three';
import { getScene } from './scene.js';

let particleSystem = null;

/**
 * 创建浮动粒子效果（花粉/光点），增强场景氛围
 */
export function initParticles() {
  const scene = getScene();

  const count = 800;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 30 + 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    sizes[i] = 0.5 + Math.random() * 1.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(0.3, 'rgba(200,220,255,0.3)');
  gradient.addColorStop(1, 'rgba(200,220,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);

  const mat = new THREE.PointsMaterial({
    map: texture,
    size: 1.2,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0x88bbff,
  });

  particleSystem = new THREE.Points(geo, mat);
  particleSystem.position.y = 0;
  scene.add(particleSystem);

  return particleSystem;
}

export function updateParticles(time) {
  if (!particleSystem) return;

  // 粒子缓慢上下浮动
  const positions = particleSystem.geometry.attributes.position.array;
  for (let i = 0; i < positions.length / 3; i++) {
    // 只在Y轴微微浮动，用正弦波
    const idx = i * 3 + 1;
    const baseY = (i % 20) * 1.5 + 2;
    positions[idx] = baseY + Math.sin(time * 0.001 + i * 0.1) * 0.5;
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;
}
