const express = require('express');
const app = express();

app.use(express.static('Public')); // Serve files in /Public

let lobbies = {};

// Create lobby
app.get("/lobby/create", (req, res) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 6; i++) {
    let idx = Math.floor(Math.random() * alphabet.length);
    id += alphabet[idx];
  }

  let lobby = {
    id,
    winner: "",
    players: {},
    powerUps: [],
    status: 'waiting'
  };

  lobbies[id] = lobby;
  res.json({ lobby });
});

// Join lobby
app.get("/lobby/join", (req, res) => {
  const lobbyId = req.query.lobby;
  const username = req.query.username?.toUpperCase();
  const lobby = lobbies[lobbyId];

  if (!lobby) return res.json({ error: "Lobby doesn't exist." });
  if (!username) return res.json({ error: "Username required." });

  const playerId = Math.random().toString(36).substring(2, 10);

  lobby.players[playerId] = {
    playerId,
    username,
    score: 0,
    health: 100,
    powerUps: []
  };

  res.json({ player: playerId, lobby });
});

// Start lobby
app.get("/lobby/start", (req, res) => {
  const lobbyId = req.query.lobby;
  const lobby = lobbies[lobbyId];

  if (!lobby) return res.json({ error: "Lobby doesn't exist." });

  lobby.status = 'playing';
  res.json({ lobby });
});

// Reset lobby
app.get("/lobby/reset", (req, res) => {
  const lobbyId = req.query.lobby;
  const lobby = lobbies[lobbyId];

  if (!lobby) return res.json({ error: "Lobby doesn't exist." });

  lobby.status = 'waiting';
  lobby.winner = '';
  lobby.powerUps = [];

  for (let pid in lobby.players) {
    lobby.players[pid].score = 0;
    lobby.players[pid].health = 100;
    lobby.players[pid].powerUps = [];
  }

  res.json({ lobby });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});
