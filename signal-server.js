const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const players = new Map();     // gameID -> Map<playerID, WebSocket>
const spectators = new Map();  // gameID -> Set<WebSocket>

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // Register player or spectator
      if (data.type === "register") {
        const { gameID, playerID, role } = data;
        ws.gameID = gameID;
        ws.playerID = playerID;
        ws.role = role || "player";

        if (ws.role === "spectator") {
          if (!spectators.has(gameID)) spectators.set(gameID, new Set());
          spectators.get(gameID).add(ws);
          console.log(`Spectator connected to game ${gameID}`);
        } else {
          if (!players.has(gameID)) players.set(gameID, new Map());
          players.get(gameID).set(playerID, ws);
          console.log(`Player ${playerID} registered to game ${gameID}`);
        }
      }

      // Player sending signal to spectators (offer or candidate)
      if (data.type === "playerSignal") {
        const { signal, fromPlayerID, gameID } = data;
        const specSet = spectators.get(gameID);
        if (!specSet) return;

        specSet.forEach(spectatorWS => {
          if (spectatorWS.readyState === WebSocket.OPEN) {
            spectatorWS.send(JSON.stringify({
              type: "signal",
              signal,
              fromPlayerID
            }));
          }
        });
      }

      // Spectator responding to a player (answer or candidate)
      if (data.type === "signal") {
        const { toGameID, toPlayerID, signal } = data;
        const playerWS = players.get(toGameID)?.get(toPlayerID);
        if (playerWS && playerWS.readyState === WebSocket.OPEN) {
          playerWS.send(JSON.stringify({
            type: "signal",
            signal
          }));
        }
      }

    } catch (err) {
      console.error("Invalid message format:", err);
    }
  });

  ws.on("close", () => {
    const { gameID, playerID, role } = ws;

    if (role === "spectator") {
      const set = spectators.get(gameID);
      if (set) set.delete(ws);
    } else if (role === "player") {
      const map = players.get(gameID);
      if (map) map.delete(playerID);
    }

    console.log(`${role ?? "Client"} disconnected from game ${gameID}`);
  });
});

console.log(" Signal server is running on ws://localhost:8080");
