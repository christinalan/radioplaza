import { createCamera } from "./components/camera.js";
import {
  createFloor,
  createMainHall,
  createDoors,
  createWalls,
} from "./components/building.js";
import { createScene } from "./components/scene.js";
import { createControls } from "./components/controls.js";
import { createAmbient, createDirectional } from "./components/light.js";

import { createTube } from "./components/animations/leaky.js";
import { createParticle } from "./components/animations/particles.js";
import { createWire } from "./components/animations/wires.js";

import { setStream } from "./components/audio.js";

import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";

let camera;
let renderer;
let scene;
let loop;

class World {
  // 1. Create an instance of the World app
  constructor(container) {
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    const controls = createControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    const ambientL = createAmbient();
    const dirL = createDirectional();
    const floor = createFloor();
    const walls = createMainHall();
    const doors = createDoors();
    const otherwalls = createWalls();

    const audio = setStream();
    scene.add(audio);

    //animations
    const tubes = createTube();
    const particles = createParticle();
    const wires = createWire();

    loop.updatables.push(camera, controls, tubes);

    console.log(camera);

    scene.add(ambientL, dirL, floor);
    scene.add(walls[0], walls[1], doors[0], doors[1]);

    for (let i = 0; i < otherwalls.length; i++) {
      scene.add(otherwalls[i]);
    }

    for (let i = 0; i < tubes.length; i++) {
      scene.add(tubes[i]);
    }

    for (let i = 0; i < particles.length; i++) {
      scene.add(particles[i]);
    }

    for (let i = 0; i < wires.length; i++) {
      scene.add(wires[i]);
    }

    const resizer = new Resizer(container, camera, renderer);
  }

  // 2. Render the scene
  render() {
    renderer.render(scene, camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World };
