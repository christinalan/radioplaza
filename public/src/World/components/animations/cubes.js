import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { createRenderer } from "../../systems/renderer.js";
import { scene, controls } from "../../World.js";
import { raycaster } from "../controls.js";

let cubes = [];

let prevTime = performance.now();
let time = performance.now();
let velocity = new THREE.Vector3();
let canJump = false;

let script;

function createCube() {
  const cGeo = new THREE.BoxGeometry(10, 10, 10);
  const cMat = new THREE.MeshLambertMaterial({
    color: 0xff0000,
  });

  const cube = new THREE.Mesh(cGeo, cMat);
  cube.position.set(0, 10, -50);

  const cube1 = new THREE.Mesh(cGeo, cMat);
  cube1.position.set(-20, 10, -50);

  const cube2 = new THREE.Mesh(cGeo, cMat);
  cube2.position.set(-25, 20, -60);

  cubes.push(cube, cube1, cube2);

  cubes.tick = () => {
    if (controls.isLocked === true) {
      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster.ray.origin.y += 10;

      const intersections = raycaster.intersectObjects(cubes);

      const onObject = intersections.length > 0;

      const delta = (time - prevTime) / 1000;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      if (onObject === true) {
        console.log("enter portal");

        // script = document.createElement("script");
        // script.type = "module";
        // script.src = "leaks.js";
        // document.head.appendChild(script);

        velocity.y = Math.max(0, velocity.y);
        canJump = true;
      }

      controls.getObject().position.y += velocity.y * delta; // new behavior

      if (controls.getObject().position.y < 10) {
        velocity.y = 0;
        controls.getObject().position.y = 20;

        canJump = true;
      }
    }
    prevTime = time;
  };

  return cubes;
}

export { createCube };
