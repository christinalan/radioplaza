import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { createScene } from "../scene.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";

let audioStream;
let tMat, dataTexture;
let fft, analyser, dataAvg, data;
let tubes = [];
let d, avg, total;
let velocity, acceleration;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createTube() {
  const renderer = createRenderer();
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/images/textures/3GWCDMA.png");

  audioStream = setStream();

  fft = 256;
  analyser = new THREE.AudioAnalyser(audioStream, fft);
  const dataFreq = analyser.getFrequencyData();
  console.log(dataFreq);

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(dataFreq, fft / 2, 1, format);

  const tGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 32);
  tGeo.translate(-60, 10, 60);
  tMat = new THREE.MeshLambertMaterial({
    opacity: 0.5,
    transparent: true,
    map: texture,
    // emissive: 0xffffff,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 50; i++) {
    const tube = new THREE.Mesh(tGeo, tMat);
    const s = i / 4;
    tube.position.set(s - 5, s + 1, s + 5);
    // tube.add(audioStream);
    tubes.push(tube);
  }

  tubes.tick = () => {
    tMat.emissiveMap.needsUpdate = true;
    analyser.getFrequencyData();
    dataAvg = analyser.getAverageFrequency();
    data = analyser.getFrequencyData();
    // console.log(data);
    for (let i = 0; i < data.length; i++) {
      let value = 1;
      let v = data[i] / 128;
      let y = (v * 300) / 1000;
      var newMap = mapRange(value, 0, 255, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );
      velocity = new THREE.Vector3(Math.sin(v), Math.sin(otherMap), v);
      acceleration = new THREE.Vector3(
        Math.sqrt(newMap * y + otherMap * y),
        Math.cos(Math.sin(otherMap)),
        Math.sin(v)
      );

      for (let tube of tubes) {
        d = velocity.distanceTo(tube.position);
        avg = new THREE.Vector3();
        total = 0;
        if (d > 0 && d < 50) {
          avg.add(tube.position);
          total++;

          velocity.multiplyScalar(-1);
          acceleration.multiplyScalar(-1);
        }
        tube.position.add(velocity);
        tube.scale.add(velocity);
        velocity.add(acceleration);
      }
    }
  };

  //end of tick
  return tubes;
}

export { createTube };
