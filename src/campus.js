import * as THREE from 'three';
import { getScene } from './scene.js';
import { CAMPUS_DATA } from './data.js';

const layerGroups = { buildings: [], roads: [], vegetation: [] };
let interactiveObjects = [];

export function buildCampus() {
  const scene = getScene();
  createGround(scene);
  createRoads(scene);
  createSidewalks(scene);
  createBuildings(scene);
  createTrees(scene);
  createBushes(scene);
  createFlowerBeds(scene);
  createStreetLamps(scene);
  createBenches(scene);
  createSculpture(scene);
}

export function getLayerGroups() { return layerGroups; }
export function getInteractiveObjects() { return interactiveObjects; }

// ============================
//  地面 — 程序化草地纹理
// ============================
function createGround(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 基底绿色
  ctx.fillStyle = '#6da544';
  ctx.fillRect(0, 0, 512, 512);

  // 随机深浅草色块
  const greenShades = ['#5f9338', '#7ab84e', '#619a3d', '#80c054', '#6aa841', '#76b04a'];
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = greenShades[Math.floor(Math.random() * greenShades.length)];
    const x = Math.random() * 512, y = Math.random() * 512;
    const size = 4 + Math.random() * 12;
    ctx.globalAlpha = 0.3 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * (0.6 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 杂色点
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#8bc46a' : '#4e7f30';
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30);
  texture.anisotropy = 4;

  const geo = new THREE.PlaneGeometry(280, 280);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    metalness: 0,
    color: 0xffffff,
  });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

// ============================
//  道路 + 标线
// ============================
function createRoads(scene) {
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, roughness: 0.9, metalness: 0,
  });
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc, roughness: 0.6, metalness: 0,
  });

  CAMPUS_DATA.roads.forEach(road => {
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = new THREE.Vector3(pts[i][0], 0, pts[i][2]);
      const p2 = new THREE.Vector3(pts[i + 1][0], 0, pts[i + 1][2]);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dx = p2.x - p1.x, dz = p2.z - p1.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      // 路面
      const roadGeo = new THREE.PlaneGeometry(road.width, length);
      const mesh = new THREE.Mesh(roadGeo, roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = angle;
      mesh.position.set(mid.x, 0.08, mid.z);
      mesh.receiveShadow = true;
      scene.add(mesh);
      layerGroups.roads.push(mesh);

      // 中央标线（虚线）
      if (road.width >= 5) {
        const dashes = Math.floor(length / 3);
        for (let d = 0; d < dashes; d++) {
          if (d % 2 !== 0) continue;
          const t = (d / dashes);
          const lx = p1.x + dx * t;
          const lz = p1.z + dz * t;
          const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.5), lineMat);
          line.rotation.x = -Math.PI / 2;
          line.rotation.z = angle;
          line.position.set(lx, 0.1, lz);
          scene.add(line);
          layerGroups.roads.push(line);
        }
      }
    }
  });

  // 中心广场
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x666666, roughness: 0.7, metalness: 0.1,
  });
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.08, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);
  layerGroups.roads.push(plaza);
}

// ============================
//  人行道
// ============================
function createSidewalks(scene) {
  const swMat = new THREE.MeshStandardMaterial({
    color: 0x8a7f70, roughness: 0.95, metalness: 0,
  });
  // 建筑周边人行道
  CAMPUS_DATA.buildings.forEach(b => {
    const [w, , d] = b.size;
    const [x, , z] = b.pos;
    const sw = new THREE.Mesh(new THREE.BoxGeometry(w + 3, 0.15, d + 3), swMat);
    sw.position.set(x, 0.06, z);
    sw.receiveShadow = true;
    scene.add(sw);
    layerGroups.roads.push(sw);
  });
}

// ============================
//  建筑 — 增强版（屋顶+分层线+窗户）
// ============================
function createBuildings(scene) {
  CAMPUS_DATA.buildings.forEach(b => {
    const [w, h, d] = b.size;
    const [x, y, z] = b.pos;

    // 主墙体
    const wallMat = new THREE.MeshStandardMaterial({
      color: b.color, roughness: 0.65, metalness: 0.15,
    });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.9, d), wallMat);
    wall.position.set(x, y + h * 0.45, z);
    wall.castShadow = true; wall.receiveShadow = true;
    wall.userData = { buildingId: b.id, isBuilding: true };
    scene.add(wall);
    layerGroups.buildings.push(wall);
    interactiveObjects.push(wall);

    // 屋顶
    addRoof(scene, b);

    // 楼层分割线
    addFloorLines(scene, b);

    // 窗户
    addWindows(scene, b);
  });
}

function addRoof(scene, b) {
  const [w, h, d] = b.size;
  const [x, , z] = b.pos;
  // 平顶带围栏
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x444444, roughness: 0.7, metalness: 0.3,
  });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.4, d * 0.98), roofMat);
  roof.position.set(x, h, z);
  roof.castShadow = true;
  scene.add(roof);
  layerGroups.buildings.push(roof);

  // 屋顶围栏边
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x555555, roughness: 0.6, metalness: 0.4,
  });
  const edgePositions = [
    [x, h + 0.3, z - d / 2], [x, h + 0.3, z + d / 2],
    [x - w / 2, h + 0.3, z], [x + w / 2, h + 0.3, z],
  ];
  edgePositions.forEach(ep => {
    const isX = ep[0] === x;
    const ew = isX ? w * 0.8 : 0.15;
    const ed = isX ? 0.15 : d * 0.8;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(ew, 0.3, ed), edgeMat);
    edge.position.set(ep[0], ep[1], ep[2]);
    scene.add(edge);
    layerGroups.buildings.push(edge);
  });
}

function addFloorLines(scene, b) {
  const [w, h, d] = b.size;
  const [x, , z] = b.pos;
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x333333, roughness: 0.5, metalness: 0.3,
  });
  const floorCount = Math.floor(h / 4);
  for (let i = 1; i < floorCount; i++) {
    const fy = i * (h / floorCount);
    const line = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, 0.08, d * 1.01), lineMat);
    line.position.set(x, fy, z);
    scene.add(line);
    layerGroups.buildings.push(line);
  }
}

function addWindows(scene, b) {
  const [w, h, d] = b.size;
  const [x, , z] = b.pos;

  const dayMat = new THREE.MeshStandardMaterial({
    color: 0x88bbee, emissive: 0x224466, emissiveIntensity: 0.2,
    roughness: 0.2, metalness: 0.3,
  });
  const nightMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 0.5,
    roughness: 0.3, metalness: 0.2,
  });
  // 使用白天材质（夜间模式会切换）
  const winMat = dayMat.clone();
  winMat.userData = { nightMat };

  const cols = Math.floor(w / 3);
  const rows = Math.floor(h / 3.5);
  const winGeo = new THREE.PlaneGeometry(0.7, 1.0);
  const winGapX = w / (cols + 1);
  const winGapY = h / (rows + 1);

  // 四面的窗户
  const faces = [
    { pos: [0, 0, d / 2 + 0.02], rot: 0 },        // 正面
    { pos: [0, 0, -d / 2 - 0.02], rot: Math.PI },  // 背面
    { pos: [w / 2 + 0.02, 0, 0], rot: Math.PI / 2 }, // 右面
    { pos: [-w / 2 - 0.02, 0, 0], rot: -Math.PI / 2 }, // 左面
  ];

  faces.forEach(face => {
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const win = new THREE.Mesh(winGeo, winMat.clone());
        const wx = -w / 2 + c * winGapX;
        const wy = r * winGapY;
        if (face.rot === 0) {
          win.position.set(x + wx, wy, z + face.pos[2]);
        } else if (face.rot === Math.PI) {
          win.position.set(x + wx, wy, z + face.pos[2]);
        } else if (face.rot === Math.PI / 2) {
          win.position.set(x + face.pos[0], wy, z + wx);
        } else {
          win.position.set(x + face.pos[0], wy, z + wx);
        }
        win.rotation.y = face.rot;
        scene.add(win);
        layerGroups.buildings.push(win);
      }
    }
  });
}

// ============================
//  树木 — 增强版
// ============================
function createTrees(scene) {
  CAMPUS_DATA.trees.forEach(pos => {
    const [x, y, z] = pos;
    const group = new THREE.Group();
    const scale = 0.8 + Math.random() * 0.5;

    // 树干（稍弯效果）
    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.07 + Math.random() * 0.03, 0.3, 0.2 + Math.random() * 0.15),
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * scale, 0.4 * scale, 2.5 * scale, 6), trunkMat);
    trunk.position.y = 1.25 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // 树冠 — 3层渐变
    const hue = 0.28 + Math.random() * 0.06;
    const crownMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.5, 0.3 + Math.random() * 0.1),
      roughness: 0.8,
    });
    const crownMat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue + 0.02, 0.45, 0.35 + Math.random() * 0.1),
      roughness: 0.8,
    });
    const crownMat3 = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue + 0.04, 0.4, 0.4 + Math.random() * 0.1),
      roughness: 0.8,
    });

    const crown1 = new THREE.Mesh(new THREE.SphereGeometry(1.6 * scale, 7, 6), crownMat1);
    crown1.position.y = 3.2 * scale; crown1.scale.y = 0.7;
    crown1.castShadow = true;
    group.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.3 * scale, 7, 6), crownMat2);
    crown2.position.y = 4.5 * scale; crown2.scale.y = 0.6;
    crown2.castShadow = true;
    group.add(crown2);

    const crown3 = new THREE.Mesh(new THREE.SphereGeometry(1.0 * scale, 7, 5), crownMat3);
    crown3.position.y = 5.6 * scale; crown3.scale.y = 0.5;
    crown3.castShadow = true;
    group.add(crown3);

    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
    layerGroups.vegetation.push(group);
  });
}

// ============================
//  灌木
// ============================
function createBushes(scene) {
  CAMPUS_DATA.bushes.forEach(pos => {
    const [x, y, z] = pos;
    const group = new THREE.Group();

    const hue = 0.30 + Math.random() * 0.05;
    const mat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.5, 0.3), roughness: 0.85,
    });
    const mat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue + 0.02, 0.45, 0.35), roughness: 0.85,
    });

    const b1 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 5), mat1);
    b1.position.set(0, 0.5, 0); b1.scale.set(1.2, 0.6, 1.2);
    b1.castShadow = true;
    group.add(b1);

    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), mat2);
    b2.position.set(0.6, 0.3, 0.5); b2.scale.set(1.0, 0.5, 1.0);
    group.add(b2);

    const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5), mat2);
    b3.position.set(-0.5, 0.2, -0.4); b3.scale.set(0.9, 0.5, 0.9);
    group.add(b3);

    group.position.set(x, y, z);
    scene.add(group);
    layerGroups.vegetation.push(group);
  });
}

// ============================
//  花坛
// ============================
function createFlowerBeds(scene) {
  // 图书馆前花坛
  const fbPos = [[-25, 0, -12], [-25, 0, 12]];
  fbPos.forEach(pos => {
    const [x, , z] = pos;
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xff6688, roughness: 0.5, metalness: 0.1,
    });

    const bed = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 0.6, 12), bedMat);
    bed.position.set(x, 0.3, z);
    bed.receiveShadow = true;
    scene.add(bed);
    layerGroups.vegetation.push(bed);

    const soil = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.2, 12), soilMat);
    soil.position.set(x, 0.6, z);
    scene.add(soil);
    layerGroups.vegetation.push(soil);

    // 花
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
      const r = 1.0 + Math.random() * 0.8;
      const fm = new THREE.MeshStandardMaterial({
        color: [0xff4466, 0xff8844, 0xffbb44, 0xff66aa][Math.floor(Math.random() * 4)],
        roughness: 0.5,
      });
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4), fm);
      flower.position.set(x + Math.cos(angle) * r, 0.8 + Math.random() * 0.2, z + Math.sin(angle) * r);
      scene.add(flower);
      layerGroups.vegetation.push(flower);
    }
  });
}

// ============================
//  路灯
// ============================
function createStreetLamps(scene) {
  const lampPositions = [
    [-30, 0, -48], [-20, 0, -48],
    [-30, 0, -22], [-20, 0, -22],
    [-30, 0, 13],  [-20, 0, 13],
    [-30, 0, 48],  [-20, 0, 48],
    [20, 0, -48],  [30, 0, -48],
    [20, 0, -22],  [30, 0, -22],
    [20, 0, 13],   [30, 0, 13],
    [20, 0, 48],   [30, 0, 48],
  ];

  lampPositions.forEach(pos => {
    const [x, , z] = pos;
    const group = new THREE.Group();

    // 灯柱
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x555555, roughness: 0.4, metalness: 0.7,
    });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 4.5, 8), poleMat);
    pole.position.y = 2.25;
    pole.castShadow = true;
    group.add(pole);

    // 灯臂
    const armMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.7 });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.15), armMat);
    arm.position.set(0.5, 4.3, 0);
    group.add(arm);

    // 灯罩
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffeedd, emissive: 0xffaa44, emissiveIntensity: 0.3,
      roughness: 0.2, metalness: 0.1,
    });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), lampMat);
    lamp.position.set(0.5, 4.15, 0);
    lamp.scale.set(1, 0.6, 1);
    group.add(lamp);

    group.position.set(x, 0, z);
    scene.add(group);
    layerGroups.vegetation.push(group);

    // 点光源
    const pl = new THREE.PointLight(0xffcc66, 0.6, 8);
    pl.position.set(x, 4.2, z);
    pl.userData.isStreetLight = true;
    scene.add(pl);
  });
}

// ============================
//  长椅
// ============================
function createBenches(scene) {
  const benchPos = [
    [-30, 0, -40], [30, 0, -40], [-30, 0, -15], [30, 0, -15],
    [-30, 0, 20],  [30, 0, 20],  [-30, 0, 40],  [30, 0, 40],
  ];

  benchPos.forEach(pos => {
    const [x, , z] = pos;
    const angle = Math.random() > 0.5 ? 0 : Math.PI / 2;
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6b4c2a, roughness: 0.9, metalness: 0,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x444444, roughness: 0.5, metalness: 0.8,
    });

    const group = new THREE.Group();

    // 座面
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.5), woodMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    group.add(seat);

    // 靠背
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.08), woodMat);
    back.position.set(0, 0.75, -0.25);
    group.add(back);

    // 四条腿
    [[-0.7, 0.2, -0.2], [-0.7, 0.2, 0.2], [0.7, 0.2, -0.2], [0.7, 0.2, 0.2]].forEach(lp => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 4), metalMat);
      leg.position.set(lp[0], lp[1], lp[2]);
      group.add(leg);
    });

    // 扶手
    [[-0.8, 0.55, -0.2], [0.8, 0.55, -0.2]].forEach(ap => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.5), woodMat);
      arm.position.set(ap[0], ap[1], ap[2]);
      group.add(arm);
    });

    group.position.set(x, 0, z);
    group.rotation.y = angle;
    scene.add(group);
    layerGroups.vegetation.push(group);
  });
}

// ============================
//  中心雕塑 (增强)
// ============================
function createSculpture(scene) {
  const group = new THREE.Group();

  // 底座台阶
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x666666, roughness: 0.3, metalness: 0.7,
  });
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 0.5, 16), baseMat);
  step1.position.y = 0.25; step1.castShadow = true;
  group.add(step1);

  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3, 0.4, 16), baseMat);
  step2.position.y = 0.7; step2.castShadow = true;
  group.add(step2);

  // 主柱
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x888888, roughness: 0.2, metalness: 0.8,
  });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4.5, 10), pillarMat);
  pillar.position.y = 3.15; pillar.castShadow = true;
  group.add(pillar);

  // 装饰环
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xaaaacc, roughness: 0.2, metalness: 0.9,
  });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5 + i * 0.3, 0.1, 6, 20), ringMat);
    ring.position.y = 3 + i * 1.2;
    ring.rotation.x = Math.PI / 3 + i * 0.2;
    ring.rotation.z = i * 0.5;
    group.add(ring);
  }

  // 顶部发光球
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xcceeff, emissive: 0x4488ff, emissiveIntensity: 0.15,
    roughness: 0.1, metalness: 0.9,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), sphereMat);
  sphere.position.y = 5.8;
  sphere.castShadow = true;
  group.add(sphere);

  // 顶部小尖
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: 0xeee, metalness: 0.9, roughness: 0.1 })
  );
  tip.position.y = 6.6;
  group.add(tip);

  group.position.set(0, 0, 0);
  group.userData.isSculpture = true;
  scene.add(group);
  layerGroups.vegetation.push(group);
}
