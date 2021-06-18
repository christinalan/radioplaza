import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";

let audioStream;
let wMat, dataTexture;
let fft, analyser, dataAvg, data;
let wire;
let wires = [];
let d, avg, total;
let position, velocity, acceleration;

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
  const dataFreq = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(dataFreq, fft / 2, 1, format);

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
  const wGeo = new THREE.TubeGeometry(path, 20, 1, 10, false);
  wGeo.translate(60, 10, 30);
  wMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.3,
    transparent: true,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 10; i++) {
    const s = (i / 2) * Math.PI;
    wire = new THREE.Mesh(wGeo, wMat);
    wire.position.set(0, s, 0);

    // wire = new THREE.Mesh(wGeo, wMat);
    // tube1.position.set(s, 0, s);

    wire.rotation.set(Math.PI, 0, 0);
    // tube1.rotation.set(0, 0, Math.PI);

    // scene.add(tube);
    // scene.add(tube1);

    wires.push(wire);
    // wires.push(tube1);
  }

  return wires;
}

export { createWire };
