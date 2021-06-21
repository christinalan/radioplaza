// importing these scripts from the web keeps us from having to include them locally
// but also necessitates us using a local server
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { GLTFLoader } from "https://unpkg.com/three@0.119.0/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, clock;

let mic, context, source, sourceOutput;

let analyser, fft;
let data;
let mouse;

let wires = [];
let wires1 = [];

let tube, tube1, tube2;

let geometryT, materialT, texture, dataTexture;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xa9fdff);

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  camera.position.set(100, 10, 1000);

  // lights

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x79ffe6, 4);
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

    fft = 32;

    analyser = new THREE.AudioAnalyser(mic, fft);
    data = analyser.getFrequencyData();

    const format = renderer.capabilities.isWebGL2
      ? THREE.RedFormat
      : THREE.LuminanceFormat;

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("objects/images/texture.jpeg");

    dataTexture = new THREE.DataTexture(data, fft / 10, 1, format);

    console.log(dataTexture.image);

    //reg balls

    class CustomSinCurve extends THREE.Curve {
      constructor(scale = 1) {
        super();

        this.scale = scale;
      }

      getPoint(t, optionalTarget = new THREE.Vector3()) {
        const tx = t * 3 - 1.5;
        const ty = Math.sin(Math.PI * t);
        const tz = 0;

        return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
      }
    }

    const path = new CustomSinCurve(10);
    geometryT = new THREE.TubeGeometry(path, 20, 1, 10, false);
    // geometryT.translate(-50, 100, 0);
    const geometryT2 = new THREE.TubeGeometry(path, 20, 1, 4, false);
    geometryT2.translate(0, 0, 0);
    const geometryT3 = new THREE.TubeGeometry(path, 20, 1, 4, false);
    geometryT3.translate(0, -20, 0);

    materialT = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.3,
      transparent: true,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    for (let i = 0; i < 10; i++) {
      const s = (i / 2) * Math.PI;
      tube = new THREE.Mesh(geometryT, materialT);
      tube.position.set(0, s, 0);

      tube1 = new THREE.Mesh(geometryT2, materialT);
      tube1.position.set(s, 0, s);

      tube.rotation.set(Math.PI, 0, 0);
      tube1.rotation.set(0, 0, Math.PI);

      // scene.add(tube);
      // scene.add(tube1);

      // wires.push(tube);
      // wires.push(tube1);
    }

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
  controls.maxDistance = 1000;

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
  analyser.getFrequencyData();

  tube.material.emissiveMap.needsUpdate = true;
  //   tube.material.color.setHex(0xff79cb);

  speed += angleA;

  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  data = analyser.getFrequencyData();

  const dataAvg = analyser.getAverageFrequency();
  const dataArray = new Uint8Array(data);
  length = dataAvg * 2.5;
  x = 0;

  for (let i = 0; i < data.length; i += 3000) {
    let value = 1;
    var v = data[i] / 2048;
    var y = (v * 300) / 5000;

    var newMap = mapRange(value, 0, 100, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);

    barHeight = data[i];

    wires1[i] = new THREE.Mesh(geometryT, materialT);
    wires1[i].position.set(barHeight - data.length * y, 0, 0);

    wires1[i].scale.set(
      (barHeight / 2 - data.length) / 5,
      ((barHeight - data.length) / 5) * angle,
      (barHeight / 2 - data.length) / 5
    );

    wires1[i].rotation.set(barHeight / 2, barHeight / angle, 0);

    angle += Math.sin(newMap);
    angle += angleV;
    angleV += otherMap;
    scene.add(wires1[i]);
  }

  renderer.render(scene, camera);
}
