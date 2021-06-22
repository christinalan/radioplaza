import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";
import { scene } from "../../World.js";
import { camera } from "../../World.js";

let audioStream;
let wGeo, wMat, wMat1, dataTexture;
let fft, analyser, dataAvg, data;
let wire;
let wires = [];
let wires1 = [];

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createWire() {
  const renderer = createRenderer();
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/images/textures/russian.png");

  audioStream = setStream();

  fft = 128;
  analyser = new THREE.AudioAnalyser(audioStream, fft);
  data = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RGBFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(data, fft / 100, 1, format);

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
  wGeo = new THREE.TubeGeometry(path, 20, 1, 10, false);
  wGeo.translate(90, -20, 20);
  wMat = new THREE.MeshLambertMaterial({
    // color: 0xffffff,
    // opacity: 0.8,
    // transparent: true,
    map: texture,
    // emissive: 0xffffff,
    emissiveMap: dataTexture,
  });
  wMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let i = 0; i < 1; i++) {
    const s = (i / 2) * Math.PI;
    wire = new THREE.Mesh(wGeo, wMat);
    wire.position.set(0, s, s);
    wire.rotation.set(Math.PI, 0, 0);

    // wires.push(wire);
  }

  wires.tick = () => {
    wMat.emissiveMap.needsUpdate = true;

    analyser.getFrequencyData();
    dataAvg = analyser.getAverageFrequency();
    data = analyser.getFrequencyData();

    for (let i = 0; i < data.length; i += 3000) {
      let angle = 0;
      let angleV = 0;

      let value = 1;
      var v = data[i] / 512;
      var y = (v * 300) / 5000;

      var newMap = mapRange(value, 0, 100, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );
      let barHeight = data[i];

      for (wire of wires) {
        wire.position.set(
          barHeight - data.length,
          barHeight / 2 - data.length,
          0
        );
        wire.scale.set(
          (barHeight / 2 - data.length) / 5,
          Math.sin(otherMap),
          barHeight / 2 - data.length
        );

        wire.scale.y += Math.sin(y);
        angle += Math.sin(newMap) * angleV;
        angleV += otherMap;
      }

      wires1[i] = new THREE.Mesh(wGeo, wMat);
      wires1[i].position.set(barHeight - data.length * y, 0, 0);

      wires1[i].scale.set(
        (barHeight / 2 - data.length) / 5,
        ((barHeight - data.length) / 5) * angle,
        (barHeight / 2 - data.length) / 5
      );

      // wires1[i].scale.set(Math.sin(v), Math.sin(otherMap), v);
      wires1[i].rotation.set(barHeight / 2, barHeight / angle, 0);

      wires1[i].scale.y += v;
      angle += Math.sin(newMap);
      // angle += angleV;
      // angleV += otherMap;

      // const remobject = scene.getObjectByProperty(
      //   "2C4E9E90-9395-4001-8B1F-705973F71EDD"
      // );

      if (camera.position.x > 70 && camera.position.x < 110) {
        scene.add(wires1[i]);

        wires.push(wires1[i]);
      } else {
        wires1[i].geometry.dispose();
        wires1[i].material.dispose();
        scene.remove(wires1[i]);
      }

      while (wires1.length > 25) {
        wires1.splice(0, 1);
      }

      for (let i = wires1.length - 1; i >= 0; i--) {
        wires1.splice(i, 1);
      }
    }
  };

  return wires;
}

export { createWire };
