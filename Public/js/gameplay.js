const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

app.use(express.static('Public')); // Serve files in /Public

const data_lobbies = path.join(__dirname,'db_lobby.json')

const data_players = path.join(__dirname,'db_player.json')


let lobbies = {}

function read_data(db) 
{
  const jsonData = fs.readFileSync(db,'utf-8')
  return JSON.parse(jsonData)
}

function write_data(db,data) 
{
  fs.writeFileSync(db,JSON.stringify(data,null,2),'utf-8')
}


// Get all players for a specific lobby

app.get("/api/lobby/getallplayers", (req, res) => {
  const { lobbyID } = req.query;

  if (!lobbyID) {
    return res.status(400).json({ error: "Missing Lobby (ID)." });
  }

  const lobbies = read_data(data_lobbies);
  const players = read_data(data_players);

  const lobby = lobbies[lobbyID];
  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found." });
  }

  const usernames = lobby.players.map(playerId => {
    const player = players[playerId];
    return player ? player.name : `[Unknown: ${playerId}]`;
  });

  res.json({
    message: `Players from lobby ${lobbyID}`,
    Players: { id: lobbyID, Names: usernames },
  });
});


app.get('/api/getplayerhealth', (req,res) =>
  {
    const {playerID} = req.query

    if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }
    const players = read_data(data_players);


    const player = players[playerID]

if(!player)
    {
      return res.status(400).json({error: "Player not found."})
    }

    res.json({
        message: `Player ${player.name} has ${player.health}`,
        Player: { id: playerID, health: player.health },
      });
  });

// Player hits another player

app.get('/api/hit',(req,res)=>
  {
    const {hit, shooter } =req.query;

    if(!hit || !shooter)
    {
      return res.status(400).json({error: "Missing player (ID)s."})
    }


    const players = read_data(data_players);


    const hitPlayer = players[hit]
    const shootPlayer = players[shooter]

    if(!hitPlayer || !shootPlayer)
    {
      return res.status(400).json({error: "One or both players not found"})
    }

      if(hitPlayer.health == 0)
        {
          return res.status(400).json({error: "Player is already dead"})
        }
        else
        {
          hitPlayer.health = Math.max((hitPlayer.health || 5) - 1, 0);
          shootPlayer.points += 10;
        }
  


      players[hit] = hitPlayer;
      players[shooter] = shootPlayer;

      write_data(data_players,players)

      res.json({
        message: `Player ${shooter} hit Player ${hit}`,
        hitPlayer: { id: hit, health: hitPlayer.health },
        shooterPlayer: { id: shooter, points: shootPlayer.points }
      });
  });

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
