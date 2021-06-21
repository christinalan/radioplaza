// importing these scripts from the web keeps us from having to include them locally
// but also necessitates us using a local server
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { GLTFLoader } from "https://unpkg.com/three@0.119.0/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, clock;

let mic, context, source, sourceOutput;

let analyser;
let data;
let mouse;

let wires = [];
let wires1 = [];

let tube, tube1, tube2;

let geometryT, materialT, texture;

// const startButton = document.getElementById("startButton");
// startButton.addEventListener("click", init);

init();

function init() {
  // const overlay = document.getElementById("overlay");
  // overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffb036);

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 40, 75);

  // lights

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.set(0, 10, 0);
  scene.add(directionalLight);

  const d = 5;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 50;

  directionalLight.shadow.mapSize.x = 1024;
  directionalLight.shadow.mapSize.y = 1024;

  // floor

  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.receiveShadow = true;
  // scene.add(floor);

  //reg balls

  class CustomSinCurve extends THREE.Curve {
    constructor(scale = 1) {
      super();

      this.scale = scale;
    }

    getPoint(t, optionalTarget = new THREE.Vector3()) {
      const tx = t * 4 - 1.5;
      const ty = Math.cos(2 * Math.PI * t);
      const tz = 0;

      return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
    }
  }

  const path = new CustomSinCurve(10);
  geometryT = new THREE.TubeGeometry(path, 20, 1, 4, false);
  const geometryT2 = new THREE.TubeGeometry(path, 20, 1, 4, false);
  geometryT2.translate(0, -10, 0);
  const geometryT3 = new THREE.TubeGeometry(path, 20, 1, 4, false);
  geometryT3.translate(0, -20, 0);
  materialT = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.3,
    transparent: true,
  });
  const textureLoader = new THREE.TextureLoader();
  texture = textureLoader.load("objects/images/Contestiathmb.png");

  for (let i = 0; i < 30; i++) {
    const s = (i / 2) * Math.PI;
    tube = new THREE.Mesh(geometryT, materialT);
    tube1 = new THREE.Mesh(geometryT2, materialT);
    tube2 = new THREE.Mesh(geometryT3, materialT);
    tube.position.set(0, 0, s);
    tube1.position.set(0, 0, s);
    tube2.position.set(s, s, s);
    tube.rotation.set(Math.PI, 0, 0);
    tube1.rotation.set(Math.PI, 0, 0);
    tube2.rotation.set(Math.PI, 0, 0);

    scene.add(tube);
    scene.add(tube1);
    scene.add(tube2);

    tube.material.map = texture;

    wires.push(tube);
    wires.push(tube1);
    wires.push(tube2);
  }

  // audio

  const audioLoader = new THREE.AudioLoader();

  const listener = new THREE.AudioListener();
  camera.add(listener);

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(handleSuccess);

  function handleSuccess(stream) {
    mic = new THREE.Audio(listener);
    listener.gain.disconnect();
    context = listener.context;

    source = context.createMediaStreamSource(stream);

    mic.setNodeSource(source);

    sourceOutput = context.createMediaStreamDestination();
    mic.connect(sourceOutput);

    // analyser = context.createAnalyser();
    analyser = new THREE.AudioAnalyser(mic, 256);

    animate();
  }

  // create objects when audio buffer is loaded

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.01;
  controls.maxDistance = 500;

  //

  mouse = new THREE.Vector2();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("click", onMouseDown, false);
}

function onMouseDown(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function animate() {
  requestAnimationFrame(animate);

  render();
}

let angle = 0;
let angleV = 0;
let angleA = 0;

let speed;
let length, barHeight, x;

function render() {
  speed += angleA;

  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  data = analyser.getFrequencyData();

  const dataAvg = analyser.getAverageFrequency();
  const dataArray = new Uint8Array(data);
  length = dataAvg * 2.5;
  x = 0;

  for (let i = 0; i < data.length; i++) {
    barHeight = data[i] / 2;
    let value = 1;
    var v = data[i] / 2048;
    var y = (v * 300) / 5000;

    var newMap = mapRange(value, 0, 100, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);

    for (let i = 0; i < wires.length; i++) {
      if (data[i] >= 0) {
        wires[i].scale.x = barHeight;
        //   wires[i].scale.y = x;
        //   x += length + 1;
        // wires[i].scale.y -= newMap;
        wires[i].scale.y += newMap;
        wires[i].scale.x -= newMap;

        var a = wires[i].position.x;
        var b = wires[i].position.y;

        wires[i].rotation.z = angle;
        // wires[i].rotation.z += y;

        wires[i].position.x = 2 * Math.sin(angle);
        wires[i].position.y = 23 * Math.sin(angle);

        //   angle += Math.sin(newMap * 0.1);

        angle += angleV;
        angleV += Math.sin(barHeight);

        // wires[i].rotation.z = Math.sin(newMap + Math.sqrt(a * a + b * b));
      } else {
        wires[i].scale.x = 1;
        wires[i].position.y = 1;
      }
    }
  }

  renderer.render(scene, camera);
}
