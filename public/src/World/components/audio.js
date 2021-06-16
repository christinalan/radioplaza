import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { createCamera } from "./camera.js";
import { audio } from "../../main_new.js";

let audioEl = document.getElementById("audio");
let audioStream;

const listener = new THREE.AudioListener();
const camera = createCamera();

camera.add(listener);

// audio.addEventListener("loadeddata", setStream);

function setStream() {
  console.log("audio passed through");
  audioStream = new THREE.PositionalAudio(listener);
  audioStream.setMediaElementSource(audio);
  audioStream.setVolume(1);

  return audioStream;
}

export { setStream };
