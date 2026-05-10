import * as THREE from 'three';
import { getCamera, getRenderer } from './scene.js';
import { getInteractiveObjects } from './campus.js';
import { CAMPUS_DATA } from './data.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedObject = null;
let originalEmissive = null;

export function initInteraction() {
  const renderer = getRenderer();
  renderer.domElement.addEventListener('click', onPointerClick);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
}

function onPointerClick(event) {
  const camera = getCamera();
  const objects = getInteractiveObjects();

  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const buildingId = hit.userData.buildingId;
    if (buildingId) {
      highlightBuilding(hit);
      showBuildingInfo(buildingId);
      return;
    }
  }

  clearHighlight();
  hideInfo();
}

function onPointerMove(event) {
  const camera = getCamera();
  const objects = getInteractiveObjects();

  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(objects);

  const renderer = getRenderer();
  if (intersects.length > 0 && intersects[0].object.userData.isBuilding) {
    renderer.domElement.style.cursor = 'pointer';
  } else {
    renderer.domElement.style.cursor = 'default';
  }
}

function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function highlightBuilding(mesh) {
  clearHighlight();
  selectedObject = mesh;
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => {
        originalEmissive = m.emissive.getHex();
        m.emissive = new THREE.Color(0x4a7cff);
        m.emissiveIntensity = 0.3;
      });
    } else {
      originalEmissive = mesh.material.emissive.getHex();
      mesh.material.emissive = new THREE.Color(0x4a7cff);
      mesh.material.emissiveIntensity = 0.3;
    }
  }
}

function clearHighlight() {
  if (selectedObject && selectedObject.material) {
    if (Array.isArray(selectedObject.material)) {
      selectedObject.material.forEach(m => {
        m.emissive = new THREE.Color(originalEmissive || 0x000000);
        m.emissiveIntensity = 0;
      });
    } else {
      selectedObject.material.emissive = new THREE.Color(originalEmissive || 0x000000);
      selectedObject.material.emissiveIntensity = 0;
    }
  }
  selectedObject = null;
  originalEmissive = null;
}

function showBuildingInfo(buildingId) {
  const building = CAMPUS_DATA.buildings.find(b => b.id === buildingId);
  if (!building) return;

  document.getElementById('modal-title').textContent = building.name;
  document.getElementById('modal-desc').textContent = building.info.desc;
  document.getElementById('modal-floors').textContent = building.info.floors;
  document.getElementById('modal-area').textContent = building.info.area;
  document.getElementById('modal-usage').textContent = building.info.用途;

  document.getElementById('info-modal').classList.remove('hidden');
}

function hideInfo() {
  document.getElementById('info-modal').classList.add('hidden');
}
