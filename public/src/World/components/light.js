import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";

function createAmbient() {
  const ambientLight = new THREE.AmbientLight(0xff0024, 0.8);

  return ambientLight;
}

function createDirectional() {
  const directionalLight = new THREE.DirectionalLight(0x730101, 0.7);
  directionalLight.position.set(0, 10, 5);

  const d = 5;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 20;

  directionalLight.shadow.mapSize.x = 1024;
  directionalLight.shadow.mapSize.y = 1024;

  return directionalLight;
}

export { createAmbient, createDirectional };
