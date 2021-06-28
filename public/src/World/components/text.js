import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
// import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { scene } from "../World.js";
import { raycaster } from "./controls.js";

let textGeo, textMat;
let ptext;
let texts = [];
let objects = [];

function addText() {
  const loader = new THREE.FontLoader();

  loader.load("/text/Tangerine_Bold.json", function (font) {
    textGeo = new THREE.TextGeometry("here", {
      font: font,
      size: 1,
      height: 1,
      curveSegments: 6,
      bevelEnabled: false,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2,
    });
    textMat = new THREE.MeshLambertMaterial({
      color: 0x6a008a,
      opacity: 0.7,
      transparent: true,
    });

    ptext = new THREE.Mesh(textGeo, textMat);
    ptext.position.set(-8, 10, -15);

    texts.push(ptext);

    return texts;
  });
}

export { addText };
