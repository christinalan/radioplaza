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

let star, tube1;
let stars;
let screens = [];

let texture, texture2, texture3, texture4, texture5;
let textures = [];
let geometryT, materialT, dataTexture;

// let raycaster, mouse;

// const startButton = document.getElementById("startButton");
// startButton.addEventListener("click", init);
init();

function init() {
  // const overlay = document.getElementById("overlay");
  // overlay.remove();

  const container = document.getElementById("container");

  scene = new THREE.Scene();

  clock = new THREE.Clock();

  //

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(100, 30, 15);

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
    data = analyser.getFrequencyData();

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("objects/images/russian.png");
    texture2 = textureLoader.load("objects/images/texture.jpeg");
    texture3 = textureLoader.load("objects/images/Contestiathmb.png");
    texture4 = textureLoader.load("objects/images/3GWCDMA.png");
    texture5 = textureLoader.load("objects/images/Mpp4800.png");

    textures.push(texture, texture2, texture3, texture4, texture5);
    console.log(textures);
    const format = renderer.capabilities.isWebGL2
      ? THREE.LuminanceAlphaFormat
      : THREE.RedFormat;

    dataTexture = new THREE.DataTexture(data, fft / 20, 1, format);

    const octRadius = 2;

    geometryT = new THREE.OctahedronGeometry(octRadius);

    function makeInstance(geometryT, sTexture, x, y, z) {
      materialT = new THREE.MeshLambertMaterial({
        color: 0x6a6a6a,
        opacity: 0.8,
        transparent: true,
        map: sTexture,
        emissive: 0xffffff,
        emissiveMap: dataTexture,
      });

      for (let i = 0; i < 20; i++) {
        wires[i] = new THREE.Mesh(geometryT, materialT);
        wires[i].position.set(x + 30, y - 10, z + 10);
        scene.add(wires[i]);
      }

      star = new THREE.Mesh(geometryT, materialT);

      scene.add(star);
      star.position.x = x;
      star.position.y = y;
      star.position.z = z;

      return star;
      return wires;
    }

    stars = [
      makeInstance(geometryT, texture, 0, 0, 0),
      makeInstance(
        geometryT,
        texture2,
        -Math.random() * 10,
        Math.random() * 30,
        Math.random() * 20
      ),
      makeInstance(
        geometryT,
        texture3,
        Math.random() * 20,
        -Math.random() * 10,
        Math.random() * 10
      ),
      makeInstance(
        geometryT,
        texture4,
        -Math.random() * 30,
        Math.random() * 20,
        Math.random() * -30
      ),
      makeInstance(
        geometryT,
        texture5,
        Math.random() * 10,
        Math.random() * 30,
        -Math.random() * 20
      ),
    ];

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
  controls.maxDistance = 300;

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

function render() {
  analyser.getFrequencyData();
  data = analyser.getFrequencyData();
  const dataAvg = analyser.getAverageFrequency();

  const displacement = new THREE.Vector3(0, speed, 0);
  const target = new THREE.Vector3();
  const velocity = new THREE.Vector3();

  speed += angleA;

  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  const raycaster = new THREE.Raycaster();

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  for (let i = 0; i < intersects.length; i++) {
    var randomColor = Math.floor(Math.random() * 16777215).toString(12);
    const intersect = intersects[0];

    const screenGeo = new THREE.SphereGeometry(3, 20, 10);
    const screenMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
      map: textures[3],
    });

    const screen = new THREE.Mesh(screenGeo, screenMaterial);
    screen.position
      .copy(intersect.point)
      .add(intersect.face.normal)
      .divideScalar(Math.sin(dataAvg));

    scene.add(screen);
    screens.push(screen);

    //displacement
    displacement.copy(velocity).multiplyScalar(delta);
    //target
    target.copy(intersect.point).add(displacement);
  }

  /////////////ANALYZER STARTS HERE

  for (let i = 0; i < data.length; i++) {
    let value = 1;
    var v = data[i] / 2048;
    var y = (v * 300) / 5000;

    var newMap = mapRange(value, 0, 255, 0, v);
    var otherMap = mapRange(value, 0, 1024, window.innerHeight / 5000, dataAvg);

    stars.forEach((star) => {
      star.material.emissiveMap.needsUpdate = true;
      star.scale.y = (Math.sin(angle) * dataAvg) / 15;
      star.scale.z = (Math.sin(angle) * dataAvg) / 30;

      star.rotation.z = Math.sin(y);

      star.position.z = Math.sin(angle) * 0.01;

      angle += Math.sin(newMap) * y;

      angle += angleV;
      angleV += otherMap;
    });
    // for (let i = 0; i < stars.length; i++) {
    //   wires[i].scale.y += newMap;
    //   wires[i].rotation.y = angle * 0.0001;
    //   //   stars[i].rotation.y += y;
    //   //   stars[i].position.z = 2 * Math.sin(angle);
    //   wires[i].position.y = 3 * Math.sin(angle);
    //   // wires[i].rotation.z = Math.sin(newMap + Math.sqrt(a * a + b * b));
    // }

    for (let i = 0; i < screens.length; i++) {
      screens[i].scale.y += newMap * 5;
      screens[i].position.z = 3 * Math.sin(angle);
      angle += Math.sin(newMap) * y;

      angle += angleV;
      angleV += otherMap;
    }
  }

  renderer.render(scene, camera);
}
