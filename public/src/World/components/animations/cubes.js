import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";
import { camera, World } from "../../World.js";

let audioStream;
let cubes = [];

function createCube() {
  const cGeo = new THREE.BoxGeometry(10, 10, 10);
  const cMat = new THREE.MeshLambertMaterial({
    color: 0x00f4ff,
  });

  const cube = new THREE.Mesh(cGeo, cMat);
  cube.position.set(0, 10, -50);

  const cube1 = new THREE.Mesh(cGeo, cMat);
  cube1.position.set(-20, 10, -50);

  const cube2 = new THREE.Mesh(cGeo, cMat);
  cube2.position.set(-25, 20, -60);

  cubes.push(cube, cube1, cube2);
  return cubes;
}

export { createCube };
