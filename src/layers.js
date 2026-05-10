import { getLayerGroups } from './campus.js';

export function setupLayers() {
  const checkboxes = document.querySelectorAll('[data-layer]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const layerName = cb.dataset.layer;
      toggleLayer(layerName, cb.checked);
    });
  });
}

function toggleLayer(name, visible) {
  const groups = getLayerGroups();
  const objects = groups[name];
  if (!objects) return;

  objects.forEach(obj => {
    obj.visible = visible;
  });
}
