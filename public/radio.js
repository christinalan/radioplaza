const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // {
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ],
};

let audioElement = document.getElementById("webrtc");
let audioSelect = document.querySelector("select#audioSource");
let sendButton = document.getElementById("send");

let streamSource = document.getElementById("location");
let freqSource = document.getElementById("frequency");
let equipSource = document.getElementById("equipment");

let socket = io();

socket.on("connect", () => {
  console.log("radio artist connected");
});

socket.on("msg", (data) => {
  alert("User has pressed start, send Stream again");
});

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("listener", (id) => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = audioElement.srcObject;
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", (id) => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

audioSelect.onchange = getStream;

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  const audioSource = audioSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    (option) => option.text === stream.getAudioTracks()[0].label
  );
  audioElement.srcObject = stream;
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}

//getting devices
function getConnectedDevices(type, callback) {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const filtered = devices.filter((device) => device.kind === type);
    callback(filtered);
  });
}

getConnectedDevices("audioinput", (microphones) =>
  console.log("mics found", microphones)
);

window.addEventListener("load", () => {
  getStream().then(getDevices).then(gotDevices);
});

sendButton.addEventListener("click", async () => {
  console.log("sending audio stream");
  getStream();

  let source = streamSource.value;
  let freq = freqSource.value;
  let equip = equipSource.value;

  console.log(source, freq, equip);

  let msg = {
    source: source,
    freq: freq,
    equip: equip,
  };
  socket.emit("msg", msg);
});
