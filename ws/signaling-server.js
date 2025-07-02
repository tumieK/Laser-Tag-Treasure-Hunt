const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080});

const games = new Map();

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "register"){
            const {gameID, playerID} = data;

            if(!games.has(gameID)) games.set(gameID, new Map());
            games.get(gameID).set(playerID, ws);

            ws.gameID = gameID;
            ws.playerID = playerID;

        }

        if(data.type === "signal"){
            const { togameID, toPlayeriD, signal} = data;
            const playerWS = games.get(toGameID)?.get(toPlayerID);
            if (playerWS) {
                playerWS.send(JSON.stringify({
                    type: "signal",
                    signal
                }));
                playerWS.lastSpectatorWS = ws;
            }
        }

        if(data.type === "playerSignal"){
            if (ws.lastSpectatorWS){
                ws.lastSpectatorWS.send(JSON.stringify({
                    type: "signal",
                    signal: data.signal
                }));
            }
        }
    });

    ws.on("close", () => {
        games.get(ws.gameID)?.delete(ws.playerID);
    });
});