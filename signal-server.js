const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const games = new Map();        // Map<gameID, Map<playerID, ws>>
const spectators = new Map();   // Map<gameID, Set<ws>>

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "register") {
      const { gameID, playerID, role } = data;

      ws.gameID = gameID;

      if (role === "spectator") {
        ws.isSpectator = true;

        if (!spectators.has(gameID)) spectators.set(gameID, new Set());
        spectators.get(gameID).add(ws);

        console.log(`Spectator registered to ${gameID}`);

        // Notify all players to send an offer to the new spectator
        const gamePlayers = games.get(gameID);
        if (gamePlayers) {
          gamePlayers.forEach((playerWS, pid) => {
            playerWS.send(JSON.stringify({
              type: "newSpectator"
              // You could include an ID if you want to uniquely identify the spectator
            }));
          });
        }
      } else {
        // Register player
        ws.playerID = playerID;

        if (!games.has(gameID)) games.set(gameID, new Map());
        games.get(gameID).set(playerID, ws);

        console.log(`Player ${playerID} registered to ${gameID}`);
      }
    }

    // WebRTC Signal Forwarding
    if (data.type === "signal") {
      const { toGameID, toPlayerID, signal } = data;

      const playerWS = games.get(toGameID)?.get(toPlayerID);
      if (playerWS) {
        playerWS.send(JSON.stringify({
          type: "signal",
          signal,
          fromPlayerID: ws.playerID || null
        }));

        // Save last spectator so player can respond with answer later
        playerWS.lastSpectatorWS = ws;
      }
    }

    // Answer sent back from player to spectator
    if (data.type === "playerSignal") {
      if (ws.lastSpectatorWS) {
        ws.lastSpectatorWS.send(JSON.stringify({
          type: "signal",
          signal: data.signal,
          fromPlayerID: ws.playerID
        }));
      }
    }
  });

  ws.on("close", () => {
    if (ws.isSpectator && ws.gameID) {
      spectators.get(ws.gameID)?.delete(ws);
      console.log(`Spectator disconnected from ${ws.gameID}`);
    }

    if (ws.gameID && ws.playerID) {
      games.get(ws.gameID)?.delete(ws.playerID);
      console.log(`Player ${ws.playerID} disconnected from ${ws.gameID}`);
    }
  });
});

console.log("Signal server running on ws://localhost:8080");
