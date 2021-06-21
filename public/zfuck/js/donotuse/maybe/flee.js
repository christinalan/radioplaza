import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, clock;

let mic, context, source, sourceOutput;

let analyser;
let data;
let mouse;

let dataGeo, dataMaterial;

let datas = [];
let datas2 = [];

let dataTube;
let dataTube2;
let position, velocity, acceleration;
let velocity2;

let texture, dataTexture;
let dataFreq;
let fft;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfffff0);

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-5, 10, 50);

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
      : THREE.LuminanceFormat;

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("objects/images/3GWCDMA.png");

    dataTexture = new THREE.DataTexture(dataFreq, fft / 100, 1, format);

    dataGeo = new THREE.CylinderGeometry(0.4, 0.4, 70, 32);
    dataMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.7,
      transparent: true,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    for (let i = 0; i < 100; i++) {
      dataTube = new THREE.Mesh(dataGeo, dataMaterial);
      const s = i / 2;
      scene.add(dataTube);
      dataTube.position.set(0, s, Math.sin(s));

      datas.push(dataTube);
    }

    for (let i = 0; i < 100; i++) {
      dataTube2 = new THREE.Mesh(dataGeo, dataMaterial);
      const s = i / 2;
      scene.add(dataTube2);
      dataTube2.position.set(0, s, Math.sin(s));

      datas2.push(dataTube2);
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
  controls.maxDistance = 800;

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

    position = new THREE.Vector3(window.innerWidth / 100, 0, 0);

    velocity = new THREE.Vector3(y, Math.sin(newMap), 0);
    velocity2 = new THREE.Vector3(-y, -Math.sin(newMap), 0);
    acceleration = new THREE.Vector3(0, 0, Math.sin(v));
    let acceleration2 = new THREE.Vector3(0, 0, -Math.sin(v));
    //switch to Math.sin(otherMap) for bigger cluster in the beginning

    for (let dataTube of datas) {
      d = velocity.distanceTo(dataTube.position);
      let dbetween = dataTube.position.distanceTo(dataTube2.position);
      let dv = velocity.distanceTo(velocity2);

      if (dbetween > 10 && dbetween < 40) {
        velocity.multiplyScalar(-1);
        acceleration.multiplyScalar(-1);
      }
      if (dv >= 0 && dv < 10) {
        velocity = velocity2;
      }

      dataTube.position.add(velocity);
      velocity.add(acceleration);
      //   dataTube.scale.add(velocity2);
      //   dataTube.rotation.x += Math.sin(newMap);
    }

    for (let dataTube2 of datas2) {
      d = velocity.distanceTo(dataTube2.position);
      let dbetween = dataTube.position.distanceTo(dataTube2.position);
      let dv = velocity.distanceTo(velocity2);

      if (dbetween > 10 && dbetween < 50) {
        velocity2.multiplyScalar(-1);
        acceleration2.multiplyScalar(-1);
      }
      if (dv > 0 && dv < 10) {
        velocity2 = velocity * 0.5;
      }

      dataTube2.position.add(velocity2);

      //   dataTube2.scale.add(velocity);

      //   velocity2.add(acceleration2);
      //   dataTube.rotation.x += Math.sin(newMap);
    }
  }

  renderer.render(scene, camera);
}
