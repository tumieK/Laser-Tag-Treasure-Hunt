const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const games = new Map(); // Map<gameID, Map<playerID, ws>>
const spectators = new Map(); // Map<gameID, Set<ws>>

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "register") {
      const { gameID, playerID, role } = data;

      if (role === "spectator") {
        if (!spectators.has(gameID)) spectators.set(gameID, new Set());
        spectators.get(gameID).add(ws);

        ws.isSpectator = true;
        ws.gameID = gameID;

        console.log(`Spectator registered to ${gameID}`);
      } else {
        if (!games.has(gameID)) games.set(gameID, new Map());
        games.get(gameID).set(playerID, ws);

        ws.playerID = playerID;
        ws.gameID = gameID;

        console.log(`Player ${playerID} registered to ${gameID}`);

        // Notify all spectators to request feed
        const gameSpectators = spectators.get(gameID);
        if (gameSpectators) {
          gameSpectators.forEach(spectatorWS => {
            spectatorWS.send(JSON.stringify({
              type: "signal",
              signal: { requestOffer: true },
              fromPlayerID: playerID
            }));
          });
        }
      }
    }

    if (data.type === "signal") {
      const { toGameID, toPlayerID, signal } = data;
      const playerWS = games.get(toGameID)?.get(toPlayerID);
      if (playerWS) {
        playerWS.send(JSON.stringify({
          type: "signal",
          signal,
          fromPlayerID: ws.playerID || null
        }));
        playerWS.lastSpectatorWS = ws;
      }
    }

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
    }

    if (ws.gameID && ws.playerID) {
      games.get(ws.gameID)?.delete(ws.playerID);
      console.log(`Player ${ws.playerID} disconnected from ${ws.gameID}`);
    }
  });
});

console.log("Signal server running on ws://localhost:8080");
