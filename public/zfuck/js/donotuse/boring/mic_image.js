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

let ball, text;

let ballGeometry, ballMaterial, texture, texture2;
let textGeo, textMat;

// let raycaster, mouse;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(7, 3, 7);

  // lights

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xe7f5ff, 2);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);

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

  // floor
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.receiveShadow = true;
  //   scene.add(floor);

  //reg balls

  ballGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.05);
  ballGeometry.translate(0, 0, 0);
  ballMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.7,
    transparent: true,
  });

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

    //image
    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("objects/images/930amNOAA18_1379124.png");
    texture2 = textureLoader.load("objects/images/914am1371.png");

    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0, 0);
    ball.rotation.set(0, 0, 0);
    scene.add(ball);
    ball.material.map = texture;

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
  controls.minDistance = 0.1;
  controls.maxDistance = 500;

  //

  mouse = new THREE.Vector2();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseDown, false);
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

let angle = 0.1;
let angleV = 0;
let angleA = 0.1;

let speed, velocity;

function render() {
  const displacement = new THREE.Vector3(0, speed, 0);
  const target = new THREE.Vector3();
  velocity = new THREE.Vector3(0, 1, 0);

  speed -= angleA;

  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  const raycaster = new THREE.Raycaster();

  raycaster.setFromCamera(mouse, camera);

  data = analyser.getFrequencyData();

  const dataAvg = analyser.getAverageFrequency();

  const intersects = raycaster.intersectObjects(scene.children);

  for (let i = 0; i < intersects.length; i++) {
    var randomColor = Math.floor(Math.random() * 16777215).toString(4);
    const intersect = intersects[0];
    intersects[i].object.material.color.setHex(0xe7ffff);

    //displacement
    displacement.copy(velocity).multiplyScalar(delta);
    //target
    target.copy(intersect.point).add(displacement);

    const newBall = new THREE.Mesh(ballGeometry, ballMaterial);
    newBall.position
      .copy(target)
      .add(intersect.face.normal)
      .divideScalar(Math.sin(dataAvg));

    newBall.material.map = texture;
    scene.add(newBall);
    wires.push(newBall);
  }

  for (let i = 0; i < data.length; i++) {
    const dataAvg = analyser.getAverageFrequency();

    let value = 1;
    var v = data[i] / 2048;
    var y = (v * 300) / 5000;
    let r = 10;

    var newMap = mapRange(value, 0, 255, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);
    for (let i = 0; i < wires.length; i++) {
      var a = wires[i].position.x;
      var b = wires[i].position.y;

      wires[i].scale.y += newMap * r;
      wires[i].scale.x += newMap * r;

      //   wires[i].scale.x = Math.sin(angle) * r;
      //   wires[i].scale.z = Math.sin(angle) * r;

      //   wires[i].rotation.z = Math.sin(angle);
      //   wires[i].rotation.y += Math.sin(angle);
      //   wires[i].rotation.x += y;

      r -= 0.1;
      wires[i].position.z = 2 * Math.sin(angle);
      wires[i].position.x = Math.sin(y) * r;
      //   wires[i].position.x = Math.sin(y * angle) * r;

      angle += Math.sin(newMap) * 0.1;

      // angle += angleV;
      angleV += otherMap;

      //   wires[i].rotation.z = Math.sin(newMap + Math.sqrt(a * a + b * b));

      if (dataAvg > 6) {
        wires[i].material.map = texture2;
      }
    }
  }

  renderer.render(scene, camera);
}
