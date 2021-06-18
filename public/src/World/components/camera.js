import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";

function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);

  // camera.tick = () => {
  //   console.log(camera.position);
  // };

  return camera;
}

export { createCamera };
