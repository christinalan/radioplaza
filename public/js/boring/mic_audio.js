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

let posAudio;

// let raycaster, mouse;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

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

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0xff0000, 2, 20);

  // boiler plate - now we add lights to the scene
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0); // this will be overhead
  scene.add(hemiLight);

  // const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  // scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffff00, 0.9);
  directionalLight.position.set(5, 0, 5);
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

  // helping us percieve the 3D layout of the space we're creating
  const grid = new THREE.GridHelper(50, 50, 0x888888, 0x888888);
  scene.add(grid);

  // floor

  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.receiveShadow = true;
  // scene.add(floor);

  //reg balls

  ballGeometry = new THREE.TetrahedronGeometry(5, 0);
  ballGeometry.translate(0, 0, 0);
  ballMaterial = new THREE.MeshLambertMaterial({
    color: 0x00ffdf,
    opacity: 0.6,
    transparent: true,
  });
  const ballMaterial2 = new THREE.MeshLambertMaterial({ color: 0xe30048 });

  // audio

  const audioLoader = new THREE.AudioLoader();

  const listener = new THREE.AudioListener();
  camera.add(listener);

  //loading positional audio
  // audioLoader.load("sounds/wind/wind3.mp3", function (buffer) {
  //   for (let i = 0; i < 10; i++) {
  //     const s = (i / 5) * Math.PI * 4;
  //     const ball = new THREE.Mesh(ballGeometry, ballMaterial2);
  //     scene.add(ball);

  //     ball.position.set(s - 10, 0, 0);

  //     posAudio = new THREE.PositionalAudio(listener);
  //     posAudio.setBuffer(buffer);

  //     posAudio.setDistanceModel("exponential");
  //     posAudio.setRefDistance(100);
  //     posAudio.setDirectionalCone(90, 200, 0);
  //     posAudio.rotation.set(0, Math.PI / 2, Math.PI / 2);

  //     const helper = new PositionalAudioHelper(posAudio, 1);
  //     posAudio.add(helper);

  //     ball.add(posAudio);
  //     windwires.push(ball);
  //   }
  // });

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

    for (let i = 0; i < 15; i++) {
      const s = (i / 2) * Math.PI;
      ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(i, i, i);
      scene.add(ball);
      wires.push(ball);
    }

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
  controls.maxDistance = 500;

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
    const intersect = intersects[3];
    // intersects[i].object.material.color.setHex(0x00ff26);

    // intersects[i].object.rotation.x = 2 * Math.sin(i);

    // const intBall = intersects[i].object;
    // const audio = intBall.children[0];
    // audio.play();

    // audio.rotation.y += 5;
    //displacement
    // displacement.copy(velocity).multiplyScalar(delta);
    // //target
    // target.copy(intersect.point).add(displacement);

    // ball.position.copy(target);

    // const newBall = new THREE.Mesh(ballGeometry, ballMaterial);
    // newBall.position
    //   .copy(intersect.object)
    //   .add(intersect.faceIndex)
    //   .divideScalar(Math.sin(dataAvg));

    // scene.add(newBall);
    // newBall.scale.set(0, dataAvg / 100, 0);
    // wires.push(newBall);
  }

  for (let i = 0; i < data.length; i++) {
    let value = 1;
    var v = data[i] / 512;
    var y = (v * 300) / 5000;

    // ball.rotation.y += y;

    var newMap = mapRange(value, 0, 255, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);
    for (let i = 0; i < wires.length; i++) {
      wires[i].scale.y += newMap;
      // wires[i].scale.x += newMap;

      var a = wires[i].position.x;
      // var b = wires[i].position.y;

      wires[i].rotation.z = angle * 0.0001;
      wires[i].rotation.x += Math.sin(y) * 0.1;

      wires[i].position.z = 5 * Math.sin(angle);
      wires[i].position.y = 5 * Math.sin(angleV);

      // angle += Math.sin(newMap * 0.1);
      // angleV += otherMap;
    }

    // for (let i = 0; i < windwires.length; i++) {
    //   windwires[i].scale.y += newMap;

    //   windwires[i].rotation.y += Math.sin(ball.rotation.y) * 0.01;
    //   // windwires[i].rotation.y += Math.sin(newMap) * 10;
    // }
  }

  renderer.render(scene, camera);
}
