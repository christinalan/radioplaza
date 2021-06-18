import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";
import { camera, World } from "../../World.js";

let audioStream;
let tMat, dataTexture;
let fft, analyser, dataAvg, data;
let tubes = [];
let d, avg, total;
let position, velocity, acceleration;

// let camera;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createTube() {
  const renderer = createRenderer();
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/images/textures/texture.jpeg");

  audioStream = setStream();

  fft = 128;
  analyser = new THREE.AudioAnalyser(audioStream, fft);
  const dataFreq = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(dataFreq, fft / 2, 1, THREE.RedFormat);

  const tGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 32);
  tGeo.translate(-50, 10, 30);
  tMat = new THREE.MeshLambertMaterial({
    opacity: 0.9,
    transparent: true,
    map: texture,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 50; i++) {
    const tube = new THREE.Mesh(tGeo, tMat);
    const s = i / 4;
    tube.position.set(s - 5, s + 1, s + 5);
    tube.add(audioStream);
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
      let v = data[i] / 512;
      let y = (v * 300) / 5000;
      var newMap = mapRange(value, 0, 255, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );
      position = new THREE.Vector3(
        window.innerWidth / 100,
        window.innerHeight / 100,
        0
      );
      velocity = new THREE.Vector3(Math.sin(v), Math.sin(otherMap), v);
      acceleration = new THREE.Vector3(
        Math.sqrt(newMap * y + otherMap * y),
        Math.cos(Math.sin(otherMap)),
        Math.sin(v)
      );

      avg = new THREE.Vector3();
      total = 0;

      function startAnimation() {
        for (let tube of tubes) {
          let prox = camera.position.distanceTo(tube.position);

          d = velocity.distanceTo(tube.position);

          if (d > 0 && d < 50) {
            avg.add(tube.position);
            total++;

            velocity.multiplyScalar(-1);
            acceleration.multiplyScalar(-1);
          }
          tube.position.add(velocity);
          velocity.add(acceleration);
          tube.scale.add(velocity);

          tube.scale.x += Math.sin(y) * 1;
          tube.rotation.y += Math.sin(y) * 0.001;
        }
        if (total > 0) {
          avg.divide(total);
          velocity = avg;
        }
      }

      if (camera.position.x > -60 || camera.position.x < 0) {
        startAnimation();
      }
    }
  };

  //end of tick
  return tubes;
}

export { createTube };
