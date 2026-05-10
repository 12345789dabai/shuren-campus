import * as THREE from 'three';
import { getScene } from './scene.js';
import { CAMPUS_DATA } from './data.js';

// 图层分组
const layerGroups = {
  buildings: [],
  roads: [],
  vegetation: []
};

// 所有可交互对象
let interactiveObjects = [];

export function buildCampus() {
  const scene = getScene();
  createGround(scene);
  createRoads(scene);
  createBuildings(scene);
  createTrees(scene);
  createBushes(scene);
  createSculpture(scene);
}

export function getLayerGroups() {
  return layerGroups;
}

export function getInteractiveObjects() {
  return interactiveObjects;
}

// ===== 地面 =====
function createGround(scene) {
  const geo = new THREE.PlaneGeometry(240, 240);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7ec850,
    roughness: 0.9,
    metalness: 0,
  });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 网格辅助
  const grid = new THREE.GridHelper(240, 40, 0x5a9e3a, 0x5a9e3a);
  grid.position.y = 0.05;
  grid.material.transparent = true;
  grid.material.opacity = 0.3;
  scene.add(grid);
}

// ===== 道路 =====
function createRoads(scene) {
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.8,
    metalness: 0,
  });

  CAMPUS_DATA.roads.forEach(road => {
    const points = road.points;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new THREE.Vector3(points[i][0], 0, points[i][2]);
      const p2 = new THREE.Vector3(points[i + 1][0], 0, points[i + 1][2]);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const geo = new THREE.PlaneGeometry(road.width, length);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = angle;
      mesh.position.set(mid.x, 0.1, mid.z);
      mesh.receiveShadow = true;
      scene.add(mesh);
      layerGroups.roads.push(mesh);
    }
  });

  // 中心广场
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.7,
    metalness: 0.1,
  });
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.1, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);
  layerGroups.roads.push(plaza);
}

// ===== 建筑 =====
function createBuildings(scene) {
  CAMPUS_DATA.buildings.forEach(b => {
    const [w, h, d] = b.size;
    const [x, y, z] = b.pos;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: b.color,
      roughness: 0.6,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      buildingId: b.id,
      isBuilding: true,
    };
    scene.add(mesh);
    layerGroups.buildings.push(mesh);
    interactiveObjects.push(mesh);

    // 窗户细节（在建筑正面添加小方块）
    addWindows(mesh, w, h, d, b.color);
  });
}

function addWindows(building, w, h, d, baseColor) {
  const scene = getScene();
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x112244,
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.5,
  });

  const cols = Math.floor(w / 3);
  const rows = Math.floor(h / 3);
  const winW = 0.8;
  const winH = 1.2;
  const winGeo = new THREE.PlaneGeometry(winW, winH);

  // 在建筑四面添加窗户
  for (let side of [0, 1, 2, 3]) {
    const startX = -(cols - 1) * 1.2 / 2;
    const startY = -(rows - 1) * 1.5 / 2 + 2;

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const win = new THREE.Mesh(winGeo, winMat);
        const px = startX + c * 1.2;
        const py = startY + r * 1.5;

        if (side === 0) {
          win.position.set(px, building.position.y + py, building.position.z + d / 2 + 0.05);
          win.rotation.y = 0;
        } else if (side === 1) {
          win.position.set(building.position.x + w / 2 + 0.05, building.position.y + py, px);
          win.rotation.y = Math.PI / 2;
        } else if (side === 2) {
          win.position.set(px, building.position.y + py, building.position.z - d / 2 - 0.05);
          win.rotation.y = Math.PI;
        } else {
          win.position.set(building.position.x - w / 2 - 0.05, building.position.y + py, px);
          win.rotation.y = -Math.PI / 2;
        }
        scene.add(win);
      }
    }
  }
}

// ===== 树木 =====
function createTrees(scene) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });

  CAMPUS_DATA.trees.forEach(pos => {
    const [x, y, z] = pos;
    const group = new THREE.Group();

    // 树干
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5), trunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    group.add(trunk);

    // 树冠（球体堆叠）
    const crown1 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 6), crownMat);
    crown1.position.y = 3.5;
    crown1.scale.y = 0.8;
    crown1.castShadow = true;
    group.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 6, 6), crownMat);
    crown2.position.y = 5;
    crown2.scale.y = 0.7;
    crown2.castShadow = true;
    group.add(crown2);

    group.position.set(x, y, z);
    // 随机大小和旋转
    const s = 0.8 + Math.random() * 0.4;
    group.scale.set(s, s, s);
    group.rotation.y = Math.random() * Math.PI * 2;

    scene.add(group);
    layerGroups.vegetation.push(group);
  });
}

// ===== 灌木 =====
function createBushes(scene) {
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8 });

  CAMPUS_DATA.bushes.forEach(pos => {
    const [x, y, z] = pos;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 6), bushMat);
    bush.position.set(x, 0.6, z);
    bush.scale.set(1.2, 0.7, 1.2);
    bush.castShadow = true;
    scene.add(bush);
    layerGroups.vegetation.push(bush);

    // 第二层小冠
    const bush2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6), bushMat);
    bush2.position.set(x + 0.6, 0.3, z + 0.5);
    bush2.scale.set(1.0, 0.6, 1.0);
    scene.add(bush2);
    layerGroups.vegetation.push(bush2);
  });
}

// ===== 中心雕塑 =====
function createSculpture(scene) {
  const group = new THREE.Group();

  // 底座
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 1), baseMat);
  base.position.y = 0.5;
  base.castShadow = true;
  group.add(base);

  // 主柱
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 4), pillarMat);
  pillar.position.y = 3;
  pillar.castShadow = true;
  group.add(pillar);

  // 顶部球体
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0x446688,
    emissiveIntensity: 0.1,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), sphereMat);
  sphere.position.y = 5.2;
  sphere.castShadow = true;
  group.add(sphere);

  // 环绕环
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.7 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.15, 8, 24), ringMat);
  ring.position.y = 4.5;
  ring.rotation.x = Math.PI / 3;
  ring.castShadow = true;
  group.add(ring);

  const ring2 = ring.clone();
  ring2.position.y = 3.8;
  ring2.rotation.x = -Math.PI / 4;
  group.add(ring2);

  group.position.set(0, 0, 0);
  group.userData.isSculpture = true;
  scene.add(group);
  layerGroups.vegetation.push(group);
}
