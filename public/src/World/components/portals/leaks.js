// importing these scripts from the web keeps us from having to include them locally
// but also necessitates us using a local server
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, clock;

let mic, context, source, sourceOutput;

let analyser;
let data;
let mouse;

let dataGeo, dataMaterial, dataMaterial2;

let datas = [];
let dataTube;
let position, velocity, acceleration;

let texture, dataTexture;
let dataFreq;
let fft;

// const startButton = document.getElementById("startButton");
// startButton.addEventListener("click", init);

init();

function init() {
  // const overlay = document.getElementById("overlay");
  // overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();
  //   scene.background = new THREE.Color(0xf82480);

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-5, 10, 100);

  // lights

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xf800ff, 0.9);
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

  // audio

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

    fft = 128;
    analyser = new THREE.AudioAnalyser(mic, fft);
    dataFreq = analyser.getFrequencyData();

    const format = renderer.capabilities.isWebGL2
      ? THREE.RedFormat
      : THREE.LuminanceAlphaFormat;

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("objects/images/Mpp4800.png");

    dataTexture = new THREE.DataTexture(dataFreq, fft / 100, 1, format);

    dataGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 32);
    dataMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    for (let i = 0; i < 50; i++) {
      dataTube = new THREE.Mesh(dataGeo, dataMaterial);
      const s = i / 4;
      scene.add(dataTube);
      dataTube.position.set(s - 5, s + 1, s + 5);

      datas.push(dataTube);
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

let d;
let newData;

function render() {
  analyser.getFrequencyData();
  const dataAvg = analyser.getAverageFrequency();
  data = analyser.getFrequencyData();

  dataTube.material.emissiveMap.needsUpdate = true;
  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  for (let i = 0; i < data.length; i++) {
    let value = 1;
    var v = data[i] / 512;
    var y = (v * 300) / 5000;

    var newMap = mapRange(value, 0, 255, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);

    position = new THREE.Vector3(
      window.innerWidth / 20,
      window.innerHeight / 10,
      0
    );
    velocity = new THREE.Vector3(Math.sin(v), Math.sin(otherMap), v);
    acceleration = new THREE.Vector3(
      Math.sqrt(newMap * y + otherMap * y),
      Math.cos(Math.sin(otherMap)),
      Math.sin(v)
    );

    let avg = new THREE.Vector3();
    let total = 0;

    for (let dataTube of datas) {
      d = velocity.distanceTo(dataTube.position);

      if (d > 0 && d < 50) {
        avg.add(dataTube.position);
        total++;

        velocity.multiplyScalar(-1);
        acceleration.multiplyScalar(-1);
      }

      dataTube.position.add(velocity);
      dataTube.scale.add(velocity);
      velocity.add(acceleration);

      dataTube.rotation.x += Math.sin(v) * 0.001;
    }
    if (total > 0) {
      avg.divide(total);
      velocity = avg;
    }
  }

  renderer.render(scene, camera);
}
