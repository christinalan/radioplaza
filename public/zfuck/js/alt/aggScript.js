let scripts = [
  "js/dataC.js",
  "js/dust.js",
  "js/hair.js",
  "js/janus.js",
  "js/leak.js",
  "js/miconly.js",
  "js/oldscript.js",
  "js/particles.js",
  "js/stars.js",
  "js/torus.js",
  "js/vector.js",
  "js/wifi.js",
  "js/chaos.js",
  "js/knot.js",
  "js/skinnyleak.js",
];

let randomPick;
let lastPick = 0;

let changeScript;
let newSource;
let script;

let overlay;

let container = document.getElementById("container");

function clearContainer() {
  while (container.firstChild) container.removeChild(container.firstChild);
}

function refreshContainer() {
  const newCont = document.createElement("div");

  clearContainer();
  container.appendChild(newCont);
}

window.addEventListener("load", () => {
  const startButton = document.getElementById("startButton");
  startButton.addEventListener("click", start);

  function start() {
    overlay = document.getElementById("overlay");
    overlay.remove();

    randomPick = Math.floor(Math.random() * scripts.length);
    newSource = scripts[randomPick];

    script = document.createElement("script");
    script.type = "module";
    script.src = newSource;
    document.head.appendChild(script);

    changeScript = window.setInterval(myScript, 5000);

    function myScript() {
      let newRandom = Math.floor(Math.random() * scripts.length);

      if (newRandom != randomPick) {
        randomPick = newRandom;
      } else {
        randomPick = Math.floor(Math.random() * scripts.length);
      }
      let source = scripts[newRandom];
      console.log(source);

      script = document.createElement("script");
      script.type = "module";
      script.src = source;
      document.head.appendChild(script);
      clearContainer();
    }
    refreshContainer();
  }
});
