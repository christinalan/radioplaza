function setupSocket() {
  let peerConnection;
  const config = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  };

  //configuring audio for listener
  const audio = document.getElementById("audio");

  let socket = io();

  socket.on("connect", () => {
    console.log("listener connected");
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
    socket.emit("audience is connected");
  });

  socket.on("broadcaster", () => {
    let message = "Stina says hello!";
    socket.emit("listener", message);
  });

  window.onunload = window.onbeforeunload = () => {
    socket.close();
    peerConnection.close();
  };

  return audio;
}

export { setupSocket };
