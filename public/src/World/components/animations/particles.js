import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { setStream } from "../audio.js";
import { createRenderer } from "../../systems/renderer.js";

let audioStream;
let pMat, dataTexture;
let fft, analyser, dataAvg, data;
let particles = [];
let d, avg, total;
let position, velocity, acceleration;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createParticle() {
  const renderer = createRenderer();
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/images/textures/Mpp4800.png");

  audioStream = setStream();

  fft = 256;
  analyser = new THREE.AudioAnalyser(audioStream, fft);
  const dataFreq = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(dataFreq, fft / 150, 1, format);

  const pGeo = new THREE.SphereGeometry(0.5, 20, 32);
  pGeo.translate(0, 0, -20);
  pMat = new THREE.MeshLambertMaterial({
    opacity: 0.7,
    transparent: true,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 500; i++) {
    const particle = new THREE.Mesh(pGeo, pMat);
    const s = i / 2;
    particle.position.set(Math.random(s), Math.random(s), Math.sin(s));
    // particle.add(audioStream);
    particles.push(particle);
  }

  particles.tick = () => {
    pMat.emissiveMap.needsUpdate = true;

    analyser.getFrequencyData();
    dataAvg = analyser.getAverageFrequency();
    data = analyser.getFrequencyData();

    for (let i = 0; i < data.length; i++) {
      let value = 1;
      var v = data[i] / 512;
      var y = (v * 300) / 5000;

      var newMap = mapRange(value, 0, 255, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );

      position = new THREE.Vector3(window.innerWidth / 100, 0, 0);

      velocity = new THREE.Vector3(otherMap, Math.sin(v), Math.cos(v));
      acceleration = new THREE.Vector3(Math.sin(v), Math.sin(otherMap), v);
      //switch to Math.sin(otherMap) for bigger cluster in the beginning

      avg = new THREE.Vector3();
      total = 0;

      for (let particle of particles) {
        d = velocity.distanceTo(particle.position);

        if (d > 10 && d < 100) {
          avg.add(particle.position);
          total++;

          velocity.multiplyScalar(-1);
          acceleration.multiplyScalar(-1);
        }

        particle.position.add(velocity);
        velocity.add(acceleration);
      }
      if (total > 0) {
        avg.divide(total);
        velocity = avg;
      }
    }
  };

  return particles;
}

export { createParticle };
