const ws = new WebSocket("ws://localhost:3000");
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

const remoteVideo = document.getElementById("remoteVideo");

pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};


pc.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
  }
};

ws.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.type === "offer") {
   
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: "answer", answer: answer }));
  } else if (data.type === "answer") {
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.type === "ice-candidate") {
    try {
      await pc.addIceCandidate(data.candidate);
    } catch (e) {
      console.error("Error adding ICE candidate:", e);
    }
  }
};

async function startBroadcast() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: "offer", offer: offer }));
}