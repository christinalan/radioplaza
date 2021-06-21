import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";
import { camera } from "../../World.js";
import { scene } from "../../World.js";

let audioStream;
let geometryT, materialT, dataTexture;
let fft, analyser, data, dataFreq, dataAvg;
let star, stars;
let screens = [];
let textures = [];
let texture, texture2, texture3, texture4, texture5;
let angle = 0;
let angleV = 0;
let angleA = 0;

let speed, clock, mouse;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function createStar() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2();
  const renderer = createRenderer();
  const textureLoader = new THREE.TextureLoader();

  texture = textureLoader.load("/images/textures/russian.png");
  texture2 = textureLoader.load("/images/textures/texture.jpeg");
  texture3 = textureLoader.load("/images/textures/Contestiathmb.png");
  texture4 = textureLoader.load("/images/textures/3GWCDMA.png");
  texture5 = textureLoader.load("/images/textures/Mpp4800.png");
  textures.push(texture, texture2, texture3, texture4, texture5);

  audioStream = setStream();

  fft = 128;
  analyser = new THREE.AudioAnalyser(audioStream, fft);
  dataFreq = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(dataFreq, fft / 10, 1, format);

  const octRadius = 2;

  geometryT = new THREE.OctahedronGeometry(octRadius);
  geometryT.translate(-100, 10, -200);

  function makeInstance(geometryT, sTexture, x, y, z) {
    materialT = new THREE.MeshLambertMaterial({
      color: 0x6a6a6a,
      opacity: 0.8,
      transparent: true,
      map: sTexture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    star = new THREE.Mesh(geometryT, materialT);

    scene.add(star);

    star.position.x = x;
    star.position.y = y;
    star.position.z = z;

    return star;
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

  window.addEventListener("click", onMouseDown, false);

  stars.tick = () => {
    analyser.getFrequencyData();
    data = analyser.getFrequencyData();
    dataAvg = analyser.getAverageFrequency();

    const displacement = new THREE.Vector3(0, speed, 0);
    const target = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    speed += angleA;

    const delta = clock.getDelta();

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[0];

      const screenGeo = new THREE.SphereGeometry(3, 20, 10);
      screenGeo.translate(-200, 30, -210);
      const screenMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        opacity: 0.3,
        transparent: true,
        map: textures[0],
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

      while (screens.length > 40) {
        screens.splice(0, 1);
      }
    }

    /////////////ANALYZER STARTS HERE

    for (let i = 0; i < data.length; i++) {
      let value = 1;
      var v = data[i] / 2048;
      var y = (v * 300) / 5000;

      var newMap = mapRange(value, 0, 255, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );

      stars.forEach((star) => {
        materialT.emissiveMap.needsUpdate = true;
        star.scale.y = (Math.sin(angle) * dataAvg) / 15;
        star.scale.z = (Math.sin(angle) * dataAvg) / 30;

        star.rotation.z = Math.sin(y);

        star.position.z = Math.sin(angle) * 0.01;

        angle += Math.sin(newMap) * y;

        angle += angleV;
        angleV += otherMap;
      });

      for (let i = 0; i < screens.length; i++) {
        screens[i].scale.y += newMap * 5;
        screens[i].position.z = 3 * Math.sin(angle);
        angle += Math.sin(newMap) * y;

        angle += angleV;
        angleV += otherMap;
        // stars.push(screens[i]);
      }
    }
  };
  return stars;
}

export { createStar };
