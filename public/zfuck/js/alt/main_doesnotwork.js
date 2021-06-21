// import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/PointerLockControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";

//using pointer control example from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

let peerConnection;
let audioStream, audioSource, audioEl, listener;

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
};

//configuring audio for listener
let audio = document.getElementById("audio");
let listenButton = document.getElementById("startButton");

let socket = io();

socket.on("connect", () => {
  console.log("listener connected");
});

///////////////////////////////END OF WEBRTC

let scene, camera, renderer, clock, controls;

const objects = [];
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

////animation constants
let analyser, data, mouse;
let dataGeo, dataMaterial;
let dat1, datm1;

let datas = [];
let datas1 = [];
let dataTube, dataTube1;
let geometryT, materialT, tube, tube1;
let position, velocity1, acceleration;

let texture, dataTexture, tex1, datatex1;
let wires1 = [];
let dataFreq;
let fft;
let loaded = false;

audio.addEventListener("loadeddata", () => {
  console.log("hello audio is loaded");
  loaded = true;
});

listenButton.addEventListener("click", () => {
  console.log("fetching audio from radio page");
  // audio.play();
  // audio.muted = false;

  if (!loaded) {
    alert("Radio artist has not started streaming");
  }

  init();

  controls.lock();
});

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();
  const container = document.getElementById("container");

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x00000);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(2, 3, 10);

  controls = new PointerLockControls(camera, document.body);
  window.addEventListener("click", () => {
    controls.lock();
  });

  blocker.addEventListener("click", () => {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  //lights
  const ambientLight = new THREE.AmbientLight(0xff0024, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(0, 10, 5);
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

  //floor
  const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.5,
    transparent: true,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(500, 500, 0x888888, 0x888888);
  // scene.add(grid);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  //walls
  let wGeo = new THREE.PlaneGeometry(500, 300, 100, 100);
  wGeo.rotateY(Math.PI / 2);

  let smallGeo = new THREE.PlaneGeometry(200, 300);

  //adding some vertex variation to walls
  let position = wGeo.attributes.position;

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 1 - 8;
    vertex.y += Math.random() * 5;
    vertex.z += Math.random() * 10;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  wGeo = wGeo.toNonIndexed();

  position = wGeo.attributes.position;
  const colorsFloor = [];

  for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.01, 0.75, Math.random() * 0.15);
    colorsFloor.push(color.r, color.g, color.b);
  }

  wGeo.setAttribute("color", new THREE.Float32BufferAttribute(colorsFloor, 3));

  let wMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  let wMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x680005,
    // color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  const wall = new THREE.Mesh(wGeo, wMaterial);
  const wall2 = new THREE.Mesh(wGeo, wMaterial);
  wall2.position.set(20, 0, 0);

  scene.add(wall);
  scene.add(wall2);

  //first door
  const dGeo = new THREE.BoxGeometry(8, 20, 1);
  dGeo.rotateY(Math.PI / 2);
  const dMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  const door = new THREE.Mesh(dGeo, dMat);
  door.position.set(-7.5, 5, 15);
  scene.add(door);

  const door2 = new THREE.Mesh(dGeo, dMat);
  door2.position.set(-7.5, 5, -40);
  scene.add(door2);

  //left wall
  const wall3 = new THREE.Mesh(smallGeo, wMaterial2);
  wall3.position.set(-108, 0, 110);
  scene.add(wall3);

  //right wall
  const wall4 = new THREE.Mesh(smallGeo, wMaterial2);
  wall4.position.set(-108, 0, 0);
  scene.add(wall4);

  //further right wall
  const wall7 = new THREE.Mesh(smallGeo, wMaterial2);
  wall7.position.set(-108, 0, 200);
  scene.add(wall7);

  //ceiling
  const wall5 = new THREE.Mesh(smallGeo, wMaterial2);
  wall5.position.set(-106, 160, 0);
  wall5.rotation.set(Math.PI / 2, 0, 0);
  scene.add(wall5);

  //back wall
  const wall6 = new THREE.Mesh(smallGeo, wMaterial2);
  wall6.position.set(-175, 0, 0);
  wall6.rotation.set(0, Math.PI / 2, 0);
  scene.add(wall6);

  /////FIRST ANIMATION CODE (SKINNY LEAK)
  listener = new THREE.AudioListener();
  camera.add(listener);

  audio.addEventListener("loadeddata", () => {
    console.log("ready for data analysis");
    audioStream = new THREE.PositionalAudio(listener);
    audioStream.setMediaElementSource(audio);
    audioStream.setVolume(1);
    scene.add(audioStream);

    fft = 128;
    analyser = new THREE.AudioAnalyser(audioStream, fft);
    dataFreq = analyser.getFrequencyData();
    // console.log(dataFreq);

    const format = renderer.capabilities.isWebGL2
      ? THREE.RedIntegerFormat
      : THREE.RedFormat;

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load("../images/textures/Mpp4800.png");

    dataTexture = new THREE.DataTexture(dataFreq, fft / 100, 1, format);

    dataGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 32);
    dataGeo.translate(-60, 10, 60);
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

    dat1 = new THREE.SphereGeometry(0.5, 20, 32);
    dat1.translate(0, 0, -50);
    datm1 = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.7,
      transparent: true,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    for (let i = 0; i < 500; i++) {
      dataTube1 = new THREE.Mesh(dat1, datm1);
      const s = i / 2;
      scene.add(dataTube1);
      dataTube1.position.set(Math.random(s), Math.random(s), Math.sin(s));

      datas1.push(dataTube1);
    }

    //cable salad
    tex1 = textureLoader.load("../images/textures/russian.png");
    datatex1 = new THREE.DataTexture(dataFreq, fft / 10, 1, format);

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
    geometryT.translate(50, -10, 20);

    materialT = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
      map: tex1,
      emissive: 0xffffff,
      emissiveMap: datatex1,
    });

    for (let i = 0; i < 2; i++) {
      const s = (i / 2) * Math.PI;
      tube = new THREE.Mesh(geometryT, materialT);
      tube.position.set(s, 0, 0);
      scene.add(tube);
    }

    animate();
  });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
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
let angle = 0;
let angleV = 0;
let angleA = 0;

function render() {
  analyser.getFrequencyData();
  const dataAvg = analyser.getAverageFrequency();

  data = analyser.getFrequencyData();
  // console.log(data);

  dataTube.material.emissiveMap.needsUpdate = true;
  dataTube1.material.emissiveMap.needsUpdate = true;
  tube.material.emissiveMap.needsUpdate = true;

  const time = performance.now();

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
    velocity1 = new THREE.Vector3(Math.sin(v), Math.sin(otherMap), v);
    acceleration = new THREE.Vector3(
      Math.sqrt(newMap * y + otherMap * y),
      Math.cos(Math.sin(otherMap)),
      Math.sin(v)
    );

    let velocity2 = new THREE.Vector3(otherMap, Math.sin(v), Math.cos(v));
    let acceleration1 = new THREE.Vector3(Math.sin(v), Math.sin(newMap), v);

    let avg = new THREE.Vector3();
    let total = 0;

    for (let dataTube of datas) {
      d = velocity1.distanceTo(dataTube.position);

      if (d > 0 && d < 50) {
        avg.add(dataTube.position);
        total++;

        velocity1.multiplyScalar(-1);
        acceleration.multiplyScalar(-1);
      }

      dataTube.position.add(velocity1);
      dataTube.scale.add(velocity1);
      velocity1.add(acceleration);
    }

    for (let dataTube1 of datas1) {
      d = velocity.distanceTo(dataTube1.position);

      if (d > 10 && d < 100) {
        avg.add(dataTube1.position);
        total++;

        velocity2.multiplyScalar(-1);
        acceleration1.multiplyScalar(-1);
      }

      dataTube1.position.add(velocity2);
      velocity2.add(acceleration1);
    }

    let barHeight = data[i];

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

    while (wires1.length > 50) {
      wires1.splice(0, 1);
    }

    for (let i = wires1.length - 1; i >= 0; i--) {
      wires1.splice(i, 1);
    }
  }

  if (controls.isLocked == true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects);

    const onObject = intersections.length > 0;
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }
  }
  prevTime = time;
  renderer.render(scene, camera);
}

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = (event) => {
    // console.log(event.streams);
    audio.srcObject = event.streams[0];

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(createElements);

    function createElements() {
      audio.play();
      audio.muted = false;
      console.log(audio);
    }
    // if (audio) {
    //   audio.srcObject = event.streams[0];
    // }
    // audioStream = new MediaStream(event.streams[0]);
    // return audioStream;
  };
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch((e) => console.log(e));
});

socket.on("connect", () => {
  socket.emit("audience is connected");
});

socket.on("broadcaster", () => {
  let message = "stina says hello!";
  socket.emit("listener", message);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};
