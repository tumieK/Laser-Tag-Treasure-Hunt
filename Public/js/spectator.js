const ws = new WebSocket("ws://localhost:8080");
    const lobbyId = new URLSearchParams(window.location.search).get("lobby");

    const peerConnections = {};
    const playerGrid = document.getElementById("playerGrid");

    ws.onopen = () => {
      console.log("Spectator connected to signal server.");
      // You might notify server here if needed
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "signal" && msg.signal?.sdp && msg.signal.sdp.type === "offer") {
        const fromPlayerID = msg.fromPlayerID;

        const pc = new RTCPeerConnection();
        peerConnections[fromPlayerID] = pc;

        const videoEl = document.createElement("video");
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.id = `video-${fromPlayerID}`;

        const wrapper = document.createElement("div");
        wrapper.className = "player";
        wrapper.appendChild(videoEl);
        playerGrid.appendChild(wrapper);

        pc.ontrack = (event) => {
          videoEl.srcObject = event.streams[0];
          console.log(`Streaming from ${fromPlayerID}`);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            ws.send(JSON.stringify({
              type: "signal",
              toGameID: lobbyId,
              toPlayerID: fromPlayerID,
              signal: { candidate: event.candidate }
            }));
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(msg.signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.send(JSON.stringify({
          type: "signal",
          toGameID: lobbyId,
          toPlayerID: fromPlayerID,
          signal: { sdp: pc.localDescription }
        }));
      }

      if (msg.type === "signal" && msg.signal?.candidate) {
        const pc = peerConnections[msg.fromPlayerID];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.signal.candidate));
        }
      }
    };