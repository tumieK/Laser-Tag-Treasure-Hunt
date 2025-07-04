    let playerID = "default";    
    let hitPlayerID = "none";
    let firstScan = true;
    let healthPollerStarted = false;

    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById('popup');
    const pewSound = document.getElementById('pew-sound');
    const boomSound = document.getElementById('boom-sound');
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    let regionSize, regionX, regionY;
    let lastDetectionTime = 0;

    const params = new URLSearchParams(window.location.search);
    const myId = params.get('player');
    const username = params.get('username');
    const lobbyId = params.get('lobby');

    document.getElementById('username').textContent = username ?? 'Player';

    pewSound.volume = 1.0;
    boomSound.volume = 1.0;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            frameRate: { ideal: 120, max: 120 },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        video.srcObject = stream;
        window.localVideoStream = stream;
        video.addEventListener('loadedmetadata', updateOverlay);
        window.addEventListener('resize', updateOverlay);
        requestAnimationFrame(tick);
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }

    function updateOverlay() {
      const vw = video.clientWidth;
      const vh = video.clientHeight;
      regionSize = vw / 2;
      overlay.style.width = `${regionSize}px`;
      overlay.style.height = `${regionSize}px`;
      overlay.style.left = `${(vw - regionSize) / 2}px`;
      overlay.style.top = `${(vh - regionSize) / 2}px`;

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      const scaleX = videoW / vw;
      const scaleY = videoH / vh;
      regionX = (vw - regionSize) / 2 * scaleX;
      regionY = (vh - regionSize) / 2 * scaleY;
      tempCanvas.width = regionSize * scaleX;
      tempCanvas.height = regionSize * scaleY;
    }

    function showPopup(text) {
      popup.textContent = text;
      popup.style.opacity = '1';
      clearTimeout(popup.hideTimeout);
      popup.hideTimeout = setTimeout(() => {
        popup.style.opacity = '0';
      }, 1200);
    }

    async function getHealth(pid) {
      try {
        const response = await fetch(`/api/getplayerhealth?playerID=${pid}`);
        return await response.json();
      } catch {
        return null;
      }
    }

    async function getPoints(pid) {
      try {
        const response = await fetch(`/api/getplayerpoints?playerID=${pid}`);
        return await response.json();
      } catch {
        return null;
      }
    }

    async function getPoints(playerID) {
        try {              
          const response = await fetch(`/api/getplayerpoints?playerID=${playerID}`, {
            method: 'GET', //  or 'GET' depending on your API
            headers: {
              'Content-Type': 'application/json',
            },
            //body: JSON.stringify({ qrCode: qrData }), // Send QR code data
          });
          const result = await response.json();
          return result;
          //console.log('API get points Response:', result);
          // Optionally update UI based on response (e.g., score, health)
        } catch (error) {
          //console.error('API get points call failed:', error);
          return null;
        }        
    }
    // Wrap your calling code in an async function
    async function updatePlayerPoints() {
        if (playerID != "default") {
            const score = document.getElementById('score');    
            let temp = await getPoints(playerID);
            playerPoints = Number(temp.Player.points);
            //console.log("Temp", temp.Player.points);
            score.innerText = "Score:: " + temp.Player.points;
        }
    }

    async function getHealth(playerID) {
      try {              
        const response = await fetch(`/api/getplayerinfo?playerID=${playerID}`, {
          method: 'GET', //  or 'GET' depending on your API
          headers: {
            'Content-Type': 'application/json',
          },
          //body: JSON.stringify({ qrCode: qrData }), // Send QR code data
        });
        const result = await response.json();
        return result;
        //console.log('API get health Response:', result);
        // Optionally update UI based on response (e.g., score, health)
      } catch (error) {
        //console.error('API get health call failed:', error);
        return null;
      }        
    }
    // Wrap your calling code in an async function
    async function updatePlayerHealth() {
        if (playerID != "default") {
            const health = document.getElementById('health');    
            let temp = await getHealth(playerID);
            //console.log("Temp", temp.Player.health);
            if (temp.Player.health == "0") {
              window.location.href = "spectator.html";
            }
            if (playerHealth > temp.Player.health) {
              if ('vibrate' in navigator) {
                navigator.vibrate([1001]); // Min is 1001 ms
                console.log('Vibration triggered');
              } else {
                console.log('Vibration not supported');
              }                                
            }
            playerHealth = temp.Player.health;
            health.innerText = "Health: " + temp.Player.health;
        }
    }

    function tick() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, regionX, regionY, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code) {
          const scanned = code.data.trim().replace(/^https?:\/\//, '');
          if (firstScan) {
            playerID = scanned;
            firstScan = false;
            document.getElementById('shoot-button').textContent = "Shoot";

            // Start polling health only after QR scan
            setInterval(pollHealth, 5000);
            pollPoints();
          } else {
            lastDetectionTime = performance.now();
            hitPlayerID = scanned;
            showPopup(`Target Locked: ${scanned}`);
          }
        }
      }
      requestAnimationFrame(tick);
    }

    document.getElementById('shoot-button').addEventListener('click', () => {
      const timeSinceDetection = (performance.now() - lastDetectionTime) / 1000;
      if (timeSinceDetection < 0.5 && lastDetectionTime > 0) {
        fetch(`/api/hit?hit=${hitPlayerID}&shooter=${playerID}`)
          .then(res => res.json())
          .then(result => console.log('Hit:', result))
          .catch(console.error);

        showPopup('Hit');
        boomSound.currentTime = 0;
        boomSound.play();
        navigator.vibrate?.([1001]);
      } else {
        pewSound.currentTime = 0;
        pewSound.play();
        showPopup("No target");
      }
    });

    async function pollHealth() {
      if (playerID === "default") return;
      const res = await getHealth(playerID);
      if (res?.Player?.health !== undefined) {
        document.getElementById('health').textContent = `Health: ${res.Player.health}`;
        if (res.Player.health === "0" && !firstScan) {
          window.location.href = `spectator.html?lobby=${lobbyId}`;
        }
      }
    }

    async function pollPoints() {
      const res = await getPoints(playerID);
      if (res?.Player?.points !== undefined) {
        document.getElementById('score').textContent = `Score: ${res.Player.points}`;
      }
      setTimeout(pollPoints, 5000);
    }

    //  Start camera immediately
    startCamera();

    // WebRTC logic for sending stream to spectator
    const ws = new WebSocket("ws://localhost:8080");
    const peerConnections = {};

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "register",
        gameID: lobbyId,
        playerID: myId
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "signal" && data.signal?.requestOffer) {
        const pc = new RTCPeerConnection();
        peerConnections[data.fromSpectatorID || 'default'] = pc;

        const stream = window.localVideoStream;
        const clone = stream.clone();
        clone.getTracks().forEach(track => pc.addTrack(track, clone));

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            ws.send(JSON.stringify({
              type: "playerSignal",
              signal: { candidate: event.candidate }
            }));
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        ws.send(JSON.stringify({
          type: "playerSignal",
          signal: { sdp: pc.localDescription }
        }));
      }

      if (data.type === "signal" && data.signal?.candidate) {
        const pc = peerConnections['default'];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        }
      }

      if (data.type === "signal" && data.signal?.sdp && data.signal.sdp.type === "answer") {
        const pc = peerConnections['default'];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        }
      }
    };
