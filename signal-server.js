const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const games = new Map();

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "register") {
      const { gameID, playerID } = data;

      if (!games.has(gameID)) games.set(gameID, new Map());
      games.get(gameID).set(playerID, ws);

      ws.gameID = gameID;
      ws.playerID = playerID;

      console.log(`Player ${playerID} registered to ${gameID}`);
    }

    if (data.type === "signal") {
      const { toGameID, toPlayerID, signal } = data;
      const playerWS = games.get(toGameID)?.get(toPlayerID);
      if (playerWS) {
        playerWS.send(JSON.stringify({
          type: "signal",
          signal,
          fromPlayerID: ws.playerID
        }));

        playerWS.lastSpectatorWS = ws;
      }
    }

    if (data.type === "playerSignal") {
      if (ws.lastSpectatorWS) {
        ws.lastSpectatorWS.send(JSON.stringify({
          type: "signal",
          signal: data.signal
        }));
      }
    }
  });

  ws.on("close", () => {
    if (ws.gameID && ws.playerID) {
      games.get(ws.gameID)?.delete(ws.playerID);
      console.log(`Player ${ws.playerID} disconnected from ${ws.gameID}`);
    }
  });
});

console.log("Signal server is running on ws://localhost:8080");
