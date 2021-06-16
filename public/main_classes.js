import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/PointerLockControls.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";

let peerConnection;
let audioStream, listener;

let loaded = false;

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

audio.addEventListener("loadeddata", () => {
  console.log("hello audio is loaded");
  loaded = true;
});

listenButton.addEventListener("click", () => {
  console.log("fetching audio from radio page");

  if (!loaded) {
    alert("Radio artist has not started streaming");
  }

  init();
  animate();
  controls.lock();
});

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

let wall;

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

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  //classes
  wall = new Wall(200, 300);
  wall.display();

  let geo = new THREE.PlaneGeometry(200, 300);
  let mat = new THREE.MeshBasicMaterial({
    color: 0x680005,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  let mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  //   console.log(wall);

  listener = new THREE.AudioListener();
  camera.add(listener);

  audio.addEventListener("loadeddata", () => {
    console.log("ready for data analysis");
    audioStream = new THREE.PositionalAudio(listener);
    audioStream.setMediaElementSource(audio);
    audioStream.setVolume(1);
    scene.add(audioStream);
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

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  const time = performance.now();
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

class Wall {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    // this.x = x;
    // this.y = y;
    // this.z = z;
    this.scene = new THREE.Scene();
  }

  display() {
    let geo = new THREE.PlaneGeometry(this.w, this.h);
    let mat = new THREE.MeshBasicMaterial({
      color: 0x680005,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    let mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    // mesh.position.set(this.x, this.y, this.z);
  }
}
