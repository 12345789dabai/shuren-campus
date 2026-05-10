import * as THREE from 'three';
import { getCamera, getRenderer } from './scene.js';
import { getInteractiveObjects } from './campus.js';
import { CAMPUS_DATA } from './data.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedObject = null;
let originalColor = null;

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
    originalColor = mesh.material.color.getHex();
    mesh.material.color.setHex(0x88ccff);
    mesh.material.emissive = new THREE.Color(0x224466);
    mesh.material.emissiveIntensity = 0.3;
  }
}

function clearHighlight() {
  if (selectedObject && selectedObject.material) {
    if (originalColor !== null) {
      selectedObject.material.color.setHex(originalColor);
      selectedObject.material.emissive = new THREE.Color(0x000000);
      selectedObject.material.emissiveIntensity = 0;
    }
  }
  selectedObject = null;
  originalColor = null;
}

function showBuildingInfo(buildingId) {
  const building = CAMPUS_DATA.buildings.find(b => b.id === buildingId);
  if (!building) return;

  const modal = document.getElementById('info-modal');
  document.getElementById('modal-title').textContent = building.name;
  document.getElementById('modal-desc').textContent = building.info.desc;

  const detailsEl = document.getElementById('modal-details');
  detailsEl.innerHTML = `
    层数：${building.info.floors}<br />
    面积：${building.info.area}<br />
    用途：${building.info.用途}
  `;

  modal.classList.remove('hidden');
}

function hideInfo() {
  document.getElementById('info-modal').classList.add('hidden');
}
