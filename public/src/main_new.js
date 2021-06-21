import { World } from "./World/World.js";

let peerConnection;
let loaded = false;
let startPressed = false;

const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
};

//configuring audio for listener
let audio = document.getElementById("audio");

let source = document.getElementById("location");
let freq = document.getElementById("frequency");
let equip = document.getElementById("equip");

let radioInfo = document.getElementById("radio-info");

let socket = io();

socket.on("connect", () => {
  console.log("listener connected");

  socket.on("msgObj", (data) => {
    let msgEl = document.createElement("p");
    let msgEl1 = document.createElement("p");
    let msgEl2 = document.createElement("p");

    console.log(data);
    let sourcemsg = data.source;
    msgEl.innerHTML = sourcemsg;

    let freqmsg = data.freq;
    msgEl1.innerHTML = freqmsg;

    let equipmsg = data.equip;
    msgEl2.innerHTML = equipmsg;

    source.appendChild(msgEl);
    freq.appendChild(msgEl1);
    equip.appendChild(msgEl2);
  });
});

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = (event) => {
    // console.log(event.streams);

    audio.srcObject = event.streams[0];

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(createElements);

    function createElements() {
      audio.play();
      audio.muted = false;
    }

    return audio;
  };
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch((e) => console.log(e));
});

socket.on("connect", () => {
  console.log("audience is connected");
});

socket.on("broadcaster", () => {
  let message = "Stina says hello!";
  socket.emit("listener", message);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};

let listenButton = document.getElementById("startButton");

function main() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  const world = new World(container);

  world.start();
}

audio.addEventListener("loadeddata", () => {
  loaded = true;
  console.log("hello audio is loaded");
});

listenButton.addEventListener("click", () => {
  console.log("fetching audio from radio page");
  startPressed = true;

  socket.emit("msg", startPressed);

  radioInfo.style.display = "block";

  // main();

  // if (audio) {
  //   main();
  // }

  if (!loaded) {
    alert("Radio artist has not started streaming");
  }

  if (loaded) {
    main();
  }
});

export { audio };
