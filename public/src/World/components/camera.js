import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";

let count;
let trigger = false;

function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);

  camera.tick = () => {
    if (camera.position.x > -43 && camera.position.x < -10) {
      console.log("HEY");
      trigger = true;
    }
  };

  return camera;
}

function createCounter() {}

export { createCamera };
