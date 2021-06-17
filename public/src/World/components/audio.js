import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { createCamera } from "./camera.js";
import { audio } from "../../main_new.js";

let listenButton = document.getElementById("startButton");
let audioStream;
let analyser, dataFreq;

// listenButton.addEventListener("click", () => {
//   audio.addEventListener("loadeddata", setStream);
// });

function setStream() {
  console.log("audio passed through");
  const listener = new THREE.AudioListener();
  const camera = createCamera();

  camera.add(listener);

  audioStream = new THREE.PositionalAudio(listener);
  audioStream.setMediaElementSource(audio);
  audioStream.setVolume(1);

  return audioStream;
}

export { setStream };
