// importing these scripts from the web keeps us from having to include them locally
// but also necessitates us using a local server
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { GPUComputationRenderer } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/misc/GPUComputationRenderer.js";

let scene, camera, renderer, clock;

let mic, context, source, sourceOutput;

let analyser;
let data;
let mouse;

let texture, dataTexture;
let dataFreq, fft;

let mesh;
let geometry, material;
const amount = parseInt(window.location.search.substr(1)) || 10;
const count = Math.pow(amount, 3);
const dummy = new THREE.Object3D();

// const startButton = document.getElementById("startButton");
// startButton.addEventListener("click", init);
init();

function init() {
  // const overlay = document.getElementById("overlay");
  // overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xf00fff);

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-5, 10, 10);

  // lights

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xf800ff, 0.9);
  directionalLight.position.set(0, 5, 5);
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

    fft = 256;
    analyser = new THREE.AudioAnalyser(mic, fft);
    dataFreq = analyser.getFrequencyData();

    const format = renderer.capabilities.isWebGL2
      ? THREE.RedFormat
      : THREE.LuminanceAlphaFormat;

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("objects/images/3GWCDMA.png");

    dataTexture = new THREE.DataTexture(dataFreq, fft / 20, 1, format);

    geometry = new THREE.BufferGeometry();
    // create a simple square shape. We duplicate the top left and bottom right
    // vertices because each vertex needs to appear once per triangle.
    const vertices = new Float32Array([
      -1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      1.0,
      1.0,

      1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
    ]);

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 4));

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10, 0, 10),
      new THREE.Vector3(-5, 5, 5),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5, -5, 5),
      new THREE.Vector3(10, 0, 10),
    ]);

    const points = curve.getPoints(50);
    // geometry = new THREE.BufferGeometry().setFromPoints(points);
    // geometry = new THREE.SphereGeometry(0.1, 10, 30);

    let dataMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    mesh = new THREE.InstancedMesh(geometry, dataMaterial, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    for (let i = 0; i < 100; i++) {
      //   dataTube = new THREE.Mesh(geometry, material);
      // scene.add(dataTube);
      //   dataTube.position.set(i, 0, 0);
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

function render() {
  analyser.getFrequencyData();
  const dataAvg = analyser.getAverageFrequency();
  data = analyser.getFrequencyData();
  mesh.material.emissiveMap.needsUpdate = true;

  for (let i = 0; i < data.length; i++) {
    let value = 1;
    var v = data[i] / 10;
    var yy = (v * 300) / 10;

    var newMap = mapRange(value, 0, 255, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);

    if (mesh) {
      const time = Date.now() * 0.001;

      // mesh.rotation.y += Math.sin(v);
      mesh.rotation.y = Math.sin(time / 2);
      mesh.rotation.z = Math.cos(time / 4);

      // angle += Math.sin(newMap) * time * 0.001;

      let i = 0;
      const offset = (amount - 1) / 2;

      for (let x = 0; x < amount; x++) {
        for (let y = 0; y < amount; y++) {
          for (let z = 0; z < amount; z++) {
            dummy.position.set(offset - x * y, offset - y, offset - z);
            dummy.rotation.set(
              otherMap * 10,
              Math.sin(yy * time) * 20,
              Math.sin(yy) * 100
            );

            // dummy.scale.y += Math.sin(yy * angle);

            dummy.updateMatrix();

            mesh.setMatrixAt(i++, dummy.matrix);
          }
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
}
