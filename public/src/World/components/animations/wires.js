import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";
import { scene } from "../../World.js";

let audioStream;
let wGeo, wMat, dataTexture;
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
  const texture = textureLoader.load("/images/textures/Contestiathmb.png");

  audioStream = setStream();

  fft = 32;
  analyser = new THREE.AudioAnalyser(audioStream, fft);
  data = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(data, fft / 2, 1, THREE.LuminanceFormat);

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
  wGeo.translate(50, -20, 10);
  wMat = new THREE.MeshLambertMaterial({
    // color: 0xffffff,
    // opacity: 0.8,
    // transparent: true,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 10; i++) {
    const s = (i / 2) * Math.PI;
    wire = new THREE.Mesh(wGeo, wMat);
    wire.position.set(0, s, s);
    // wire.add(audioStream);

    // wire = new THREE.Mesh(wGeo, wMat);
    // tube1.position.set(s, 0, s);

    wire.rotation.set(Math.PI, 0, 0);
    // tube1.rotation.set(0, 0, Math.PI);

    // wires.push(wire);
  }

  scene.background = new THREE.Color("blue");

  wires.tick = () => {
    wMat.emissiveMap.needsUpdate = true;

    analyser.getFrequencyData();
    dataAvg = analyser.getAverageFrequency();
    data = analyser.getFrequencyData();

    for (let i = 0; i < data.length; i += 1000) {
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

      wires[i] = new THREE.Mesh(wGeo, wMat);
      wires[i].position.set(barHeight - data.length * y, 0, 0);
      //   wires[i].add(audioStream);

      wires[i].scale.set(
        (barHeight / 2 - data.length) / 5,
        ((barHeight - data.length) / 5) * angle,
        (barHeight / 2 - data.length) / 5
      );

      wires[i].rotation.set(barHeight / 2, barHeight / angle, 0);

      angle += Math.sin(newMap);
      angle += angleV;
      angleV += otherMap;

      //   scene.add(wires[i]);

      //   wires.concat(newwires);

      //   while (wires.length > 50) {
      //     wires.splice(0, 1);
      //   }

      //   for (let i = wires.length - 1; i >= 0; i--) {
      //     wires.splice(i, 1);
      //   }
    }
  };

  return wires;
}

export { createWire };
