import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { camera } from "../../World.js";

function createScene() {
  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0x00000);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  return scene;
}

export { createScene };
