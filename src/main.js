import { initScene, getScene, getCamera, getRenderer } from './scene.js';
import { initLighting, updateLighting, toggleDayNight } from './lighting.js';
import { buildCampus } from './campus.js';
import { initControls, switchView, toggleRoam, setRoamSpeed, updateControls, isRoamingState } from './controls.js';
import { initInteraction } from './interaction.js';
import { setupLayers } from './layers.js';
import * as THREE from 'three';

// ===== 初始化 =====
const container = document.getElementById('container');
const { scene, camera, renderer } = initScene(container);
initLighting();
buildCampus();
initControls();
initInteraction();
setupLayers();

// ===== UI 事件绑定 =====
// 视角切换
document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    switchView(btn.dataset.view);
  });
});

// 漫游切换
document.getElementById('roam-toggle').addEventListener('click', () => {
  const isRoaming = toggleRoam();
  document.getElementById('roam-toggle').textContent = isRoaming ? '⏸ 暂停漫游' : '▶ 开始漫游';
});

// 漫游速度
document.getElementById('roam-speed').addEventListener('input', (e) => {
  setRoamSpeed(parseFloat(e.target.value));
});

// 昼夜切换
document.getElementById('daynight-toggle').addEventListener('click', () => {
  const isNight = toggleDayNight();
  document.getElementById('daynight-toggle').textContent = isNight ? '☀️ 切换白天' : '🌙 切换夜晚';
});

// 信息弹窗关闭
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('info-modal').classList.add('hidden');
});
document.getElementById('modal-overlay').addEventListener('click', () => {
  document.getElementById('info-modal').classList.add('hidden');
});

// ===== FPS 计数 =====
let frameCount = 0;
let fpsTime = 0;

// ===== 动画循环 =====
function animate(time) {
  requestAnimationFrame(animate);

  // FPS
  frameCount++;
  if (time - fpsTime >= 1000) {
    document.getElementById('fps-display').textContent = `FPS: ${frameCount}`;
    frameCount = 0;
    fpsTime = time;
  }

  // 如果未在漫游状态，更新 OrbitControls
  if (!isRoamingState()) {
    updateControls();
  }

  // 光照过渡
  updateLighting();

  // 雕塑自转
  const sculpture = scene.getObjectByProperty('isSculpture', true);
  if (sculpture) {
    sculpture.rotation.y += 0.005;
  }

  renderer.render(scene, camera);
}

animate(0);
