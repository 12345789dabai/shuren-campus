import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

/**
 * 加载 GLB/GLTF 模型，加载失败时使用备用生成函数
 * @param {string} path - 模型文件路径
 * @param {Function} fallbackFn - 备用生成函数，返回 Object3D
 * @returns {Promise<THREE.Object3D>}
 */
export function loadModel(path, fallbackFn) {
  return new Promise((resolve) => {
    gltfLoader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        resolve(model);
      },
      undefined,
      () => {
        console.warn(`[ModelLoader] 加载失败: ${path}，使用备用模型`);
        resolve(fallbackFn ? fallbackFn() : createDummy());
      }
    );
  });
}

function createDummy() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xff00ff, wireframe: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
  group.add(mesh);
  return group;
}
