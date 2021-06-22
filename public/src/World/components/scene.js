import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { camera } from "../World.js";

function createScene() {
  let colors = [];
  //from https://www.paulirish.com/2009/random-hex-color-code-snippets/

  for (let i = 0; i < 4; i++) {
    var randomColor =
      "#" +
      ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(
        -6
      );
    colors.push(randomColor);
  }
  console.log(colors);
  const scene = new THREE.Scene();

  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  scene.tick = () => {
    if (camera.position.x <= 0 && camera.position.z >= 0) {
      scene.background = new THREE.Color(colors[0]);
    } else if (camera.position.x <= 0 && camera.position.z <= 0) {
      scene.background = new THREE.Color(colors[1]);
    } else if (camera.position.x >= 0 && camera.position.z >= 0) {
      scene.background = new THREE.Color(colors[2]);
    } else {
      scene.background = new THREE.Color(colors[3]);
    }
  };

  return scene;
}

export { createScene };
