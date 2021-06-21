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

let windwires = [];
let wires = [];

let ball;

let ballGeometry, ballMaterial;
let janus, janus1;

// let raycaster, mouse;

// const startButton = document.getElementById("startButton");
// startButton.addEventListener("click", init);
init();

function init() {
  // const overlay = document.getElementById("overlay");
  // overlay.remove();

  const container = document.getElementById("container");

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 5, 25);

  // lights

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x989898, 1, 70);

  // boiler plate - now we add lights to the scene
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0); // this will be overhead
  //   scene.add(hemiLight);

  //   const ambientLight = new THREE.AmbientLight(0xaf3232, 0.4);
  //   scene.add(ambientLight);

  const light = new THREE.PointLight(0x0015b7, 1, 5);
  light.position.set(0, 5, 5);
  scene.add(light);

  const light2 = new THREE.PointLight(0xa40000, 1, 5);
  light2.position.set(0, 5, -5);
  scene.add(light2);

  const directionalLight = new THREE.DirectionalLight(0x4b4639, 0.8);
  directionalLight.position.set(0, 15, 0);
  //   scene.add(directionalLight);

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

  // helping us percieve the 3D layout of the space we're creating
  const grid = new THREE.GridHelper(50, 50, 0x888888, 0x888888);
  scene.add(grid);

  // floor

  const floorGeometry = new THREE.PlaneGeometry(40, 40);
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0x4c5659,
    side: THREE.DoubleSide,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  //   floor.rotation.x = Math.PI * -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  //reg balls

  ballGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5, 50);
  ballGeometry.translate(-5, 0, -2);
  ballMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.8,
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

    for (let i = 0; i < 12; i++) {
      const s = (i / 10) * Math.PI;
      ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(i, 0, 0);
      ball.rotation.set(Math.PI / 2, 0, 0);
      scene.add(ball);
      wires.push(ball);
    }

    const janusLoader = new GLTFLoader();
    janusLoader.load("objects/mask/scene.gltf", function (gltf) {
      janus = gltf.scene;
      janus.position.set(0, -5, 0);
      janus.scale.set(30, 30, 30);
      scene.add(janus);
    });
    const janusLoader1 = new GLTFLoader();
    janusLoader1.load("objects/mask/scene.gltf", function (gltf) {
      janus1 = gltf.scene;
      janus1.position.set(0, -5, -0.5);
      janus1.rotation.set(0, Math.PI, 0);
      janus1.scale.set(30, 30, 30);
      scene.add(janus1);
    });

    const micPos1 = new THREE.PositionalAudio(listener);
    micPos1.setMediaStreamSource(sourceOutput.stream);
    micPos1.setDistanceModel("exponential");
    micPos1.setRefDistance(50);
    micPos1.setDirectionalCone(15, 100, 0);

    const mhelper1 = new PositionalAudioHelper(micPos1, 1);
    micPos1.add(mhelper1);
    // ball.add(micPos1);

    // analyser = context.createAnalyser();
    analyser = new THREE.AudioAnalyser(mic, 256);

    animate();
  }

  // create objects when audio buffer is loaded

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.1;
  controls.maxDistance = 100;

  //

  console.log(scene.children);

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

let angle = 0;
let aAngle = 0;
let angleV = 0;
let angleA = 0;

let speed;

function render() {
  const displacement = new THREE.Vector3(0, speed, 0);
  const target = new THREE.Vector3();
  const velocity = new THREE.Vector3();

  speed += angleA;

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
    intersects[i].object.material.color.setHex(randomColor);

    displacement.copy(velocity).multiplyScalar(delta);
    //target
    target.copy(intersect.point).add(displacement);

    const newBall = new THREE.Mesh(ballGeometry, ballMaterial);
    newBall.position
      .copy(intersect.point)
      .add(displacement)
      .divideScalar(Math.sin(dataAvg));

    scene.add(newBall);
    newBall.rotation.set(Math.PI / 2, 0, 0);
    // newBall.scale.set(0, dataAvg / 100, 0);
    windwires.push(newBall);
  }

  for (let i = 0; i < data.length; i++) {
    let value = 1;
    var v = data[i] / 512;
    var y = (v * 300) / 5000;

    // ball.rotation.y += y;

    var newMap = mapRange(value, 0, 255, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);

    // janus.position.z = (Math.sin(angle) * dataAvg) / 5;
    // janus1.position.z = (Math.sin(angle) * dataAvg) / 5;
    // janus.scale.z = Math.sin(angle) * 10;

    // janus.rotation.y = Math.sin(aAngle);
    // janus1.rotation.y = Math.sin(aAngle) * 2;

    angle += Math.sin(newMap * 0.1);
    aAngle += Math.cos(newMap * 0.1);

    aAngle += angleA;
    angleA += otherMap;

    for (let i = 0; i < wires.length; i++) {
      wires[i].scale.y += newMap;
      // wires[i].scale.x += newMap;

      var a = wires[i].position.x;
      var b = wires[i].position.y;

      wires[i].rotation.z = angle * 0.01;
      //   wires[i].rotation.x += Math.sin(y) * 0.1;

      wires[i].position.z = Math.sin(angle) * dataAvg;
      //   wires[i].position.y = 5 * Math.sin(angleV);

      angle += Math.sin(newMap * 0.1);
      angle += angleV;
      //   angleV += otherMap;
    }

    for (let i = 0; i < windwires.length; i++) {
      windwires[i].scale.y += newMap;

      windwires[i].rotation.z += Math.sin(newMap) * 0.01;
      // windwires[i].rotation.y += Math.sin(newMap) * 10;
    }
  }

  renderer.render(scene, camera);
}
