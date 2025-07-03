async function start() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const lobby = urlParams.get('lobby');
        const player = urlParams.get('player');
        const username = urlParams.get('username');
        const role = urlParams.get('role') ?? (player ? "Player" : "Spectator");

        document.getElementById("lobby").textContent = lobby ?? "Unknown";
        document.getElementById("playerInfo").textContent = username ?? role;

        if (role.toLowerCase() !== "spectator") return;
        //{document.getElementById("startButton").style.display = "inline-block"; }

        const res = await fetch(`/lobby/start?lobby=${lobby}`);
        const json = await res.json();
        if (json.error) throw json.error;

       // window.location.href = `/ingame_player.html?lobby=${lobby}&player=${player}&username=${username}`;
      window.location.href = `/spectator.html?lobby=${lobby}&player=${player}&username=${username}`;
      } catch (err) {
        alert("Error: " + err);
      }
    }
    async function reset() {
      const urlParams = new URLSearchParams(window.location.search);
      const lobby = urlParams.get('lobby');
      const res = await fetch(`/lobby/reset?lobby=${lobby}`);
      const json = await res.json();
      if (json.error) throw json.error;
    }

    async function pollForGameStart() {
      const urlParams = new URLSearchParams(window.location.search);
      const lobby = urlParams.get('lobby');
      const player = urlParams.get('player');
      const username = urlParams.get('username');

      try {
        const res = await fetch(`/lobby/start?lobby=${lobby}`);
        const json = await res.json();
        if (json?.lobby?.status === 'playing') {
          window.location.href = `/ingame_player.html?lobby=${lobby}&player=${player}&username=${username}`;
        } else {
          setTimeout(pollForGameStart, 1500);
        }
      } catch (err) {
        setTimeout(pollForGameStart, 3000);
      }
    }

    window.start = start;

    window.onload = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const lobby = urlParams.get('lobby');
      const player = urlParams.get('player');
      const username = urlParams.get('username');
      const role = urlParams.get('role') ?? (player ? "Player" : "Spectator");

      document.getElementById("lobby").textContent = lobby ?? "Unknown";
      document.getElementById("playerInfo").textContent = username ?? role;

      if (role.toLowerCase() === "spectator") {
        document.getElementById("startButton").style.display = "inline-block";
      } else {
        pollForGameStart();
      }
    };