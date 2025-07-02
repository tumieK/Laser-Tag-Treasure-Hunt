const fs = require('fs');
const path = require('path');
const express = require('express');
const { ppid } = require('process');
const app = express();

app.use(express.static('Public')); // Serve files in /Public

const data_lobbies = path.join(__dirname,'db_lobby.json')

const data_players = path.join(__dirname,'db_player.json')


let lobbies = {}

const invincibilityTimers = {};

function read_data(db) 
{
  const jsonData = fs.readFileSync(db,'utf-8')
  return JSON.parse(jsonData)
}

function write_data(db,data) 
{
  fs.writeFileSync(db,JSON.stringify(data,null,2),'utf-8')
}


//Get all lobbies

// app.get("/api/lobby/getall", (req,res) => 
//   {
//     const LobbyIds = req.query.    
//   });


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


// Delete a specific lobby


app.get("/api/lobby/delete", (req, res) => {
  const { lobbyID } = req.query

    if (!lobbyID) {
    return res.status(400).json({ error: "Missing Lobby (ID)." });
  }

  const lobbies = read_data(data_lobbies);
      const lobby = lobbies[lobbyID];
  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found." });
  }
  
    delete lobbies[lobbyID]

    write_data(data_lobbies, lobbies);

    res.json({
    message: `Lobby ${lobbyID} was deleted`,
    Lobby: { id: lobbyID },
  });

})


// Specific player joins a specific lobby

app.get("/api/lobby/join", (req, res) => {
  const { lobbyID, playerID } = req.query

    if (!lobbyID) {
    return res.status(400).json({ error: "Missing Lobby (ID)." });
  }
      if (!playerID) {
    return res.status(400).json({ error: "Missing Player (ID)." });
  }

  const lobbies = read_data(data_lobbies);
  const players = read_data(data_players);
  
  const lobby = lobbies[lobbyID];
  const player = players[playerID]; 

  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found." });
  }

  if (!player) {
    return res.status(404).json({ error: "Player not found." });
  }

  lobby.players = lobby.players || [];
if (!lobby.players.includes(player.id)) {
  lobby.players.push(player.id);
}

  lobbies[lobbyID] = lobby
  write_data(data_lobbies, lobbies);

    res.json({
    message: `Player ${playerID} was added to Lobby ${lobbyID}`,
    Lobby: { id: lobbyID },
  });

})

// Specific player leaves a specific lobby

app.get("/api/lobby/leave/",(req, res) =>
    {
      const { lobbyID, playerID } = req.query

    if (!lobbyID) {
    return res.status(400).json({ error: "Missing Lobby (ID)." });
  }
      if (!playerID) {
    return res.status(400).json({ error: "Missing Player (ID)." });
  }

  const lobbies = read_data(data_lobbies);
  const players = read_data(data_players);

  const lobby = lobbies[lobbyID];
  const player = players[playerID]; 

    if (!lobby) {
    return res.status(404).json({ error: "Lobby not found." });
  }

  if (!player) {
    return res.status(404).json({ error: "Player not found." });
  }

    lobby.players = lobby.players || [];
    var playerIN = false;
if (lobby.players.includes(player.id)) {
  lobby.players.pop(player.id);
  playerIN = true;
}
  lobbies[lobbyID] = lobby
  write_data(data_lobbies, lobbies);
  if(playerIN){
  res.json({
    message: `Player ${playerID} was removed from Lobby ${lobbyID}`,
    Lobby: { id: lobbyID },
  });
  }else
  {
      res.json({
    message: `Player ${playerID} was never in Lobby ${lobbyID}`,
    Lobby: { id: lobbyID },
  });
  }
});
//Players


// Make specific player invisible

app.get('/api/makeplayerinvincible',(req,res)=>
  {
    const {playerID,healthLossType} =req.query
        if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }
            if(!healthLossType)
    {
      return res.status(400).json({error: "Missing type of health loss."})
    }
    const players = read_data(data_players);

    const playerKey = Object.keys(players).find(key => players[key].id === playerID)
    const player = players[playerKey]

if(!player)
    {
      return res.status(400).json({error: "Player not found."})
    }

let message = "vulnerable";

  if (Number(healthLossType) === 1) {
    // Set invincibility
    player.invincibilitytime = 15;
    player.isinvincible = true;
    message = "invincible";

    // Clear existing timer if it exists
    if (invincibilityTimers[playerID]) {
      clearInterval(invincibilityTimers[playerID]);
    }

    invincibilityTimers[playerID] = setInterval(() => {
      const players = read_data(data_players);
      const playerKey = Object.keys(players).find(key => players[key].id === playerID);
      


      if (!playerKey) {
        clearInterval(invincibilityTimers[playerID]);
        delete invincibilityTimers[playerID];
        return;
      }

      const player = players[playerKey];
      console.log(`Tick: Player ${playerID} has ${player.invincibilitytime} seconds left`);

      if (player.invincibilitytime > 0) {
        player.invincibilitytime -= 1;
        write_data(data_players, players);
      } else {
        player.isinvincible = false;
        write_data(data_players, players);
        clearInterval(invincibilityTimers[playerID]);
        delete invincibilityTimers[playerID];
        console.log(`Player ${playerID} is no longer invincible.`);
      }
    }, 1000);
  } else {
    player.invincibilitytime = 0;
    player.isinvincible = false;

    if (invincibilityTimers[playerID]) {
      clearInterval(invincibilityTimers[playerID]);
      delete invincibilityTimers[playerID];
    }
  }

  players[playerKey] = player;
  write_data(data_players, players);
    res.json({
        message: `Player ${player.id} is ${message}`,
        Player: { id: playerID, invincibletime: player.invincibilitytime,isinvincible:player.isinvincible },
      }); 
  })

app.get('/api/changepointsplayer',(req,res)=>
  {
        const {playerID,pointsvalue} = req.query


      if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }

      if(!pointsvalue)
    {
      return res.status(400).json({error: "Missing health value."})
    }

    const players = read_data(data_players);

    const playerKey = Object.keys(players).find(key => players[key].id === playerID)
    const player = players[playerKey]

    if(Number(pointsvalue))
    {
      player.points -=Number(pointsvalue)
    }
    else{
      return res.status(400).json({error: "Invalid points value"})
    }

  players[playerKey] = player;
  write_data(data_players, players);
    res.json({
        message: `Player ${player.id}'s points decreased by ${pointsvalue} points`,
        Player: { id: playerID, points: player.points },
      }); 
  })
app.get('/api/changehealthplayer',(req,res)=>
  {
    const {playerID,healthvalue} = req.query


      if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }

      if(!healthvalue)
    {
      return res.status(400).json({error: "Missing health value."})
    }

    const players = read_data(data_players);

    const playerKey = Object.keys(players).find(key => players[key].id === playerID)
    const player = players[playerKey]

    if(Number(healthvalue))
    {
      player.health +=Number(healthvalue)
    }
    else{
      return res.status(400).json({error: "Invalid health value"})
    }

  players[playerKey] = player;
  write_data(data_players, players);
    res.json({
        message: `Player ${player.id}'s health changed by ${healthvalue}`,
        Player: { id: playerID, health: player.health },
      }); 
  })

  // Change Weapon ID for player

app.get('/api/changeweaponplayer',(req,res)=>
  {
    const {playerID,weaponID} = req.query


      if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }

      if(!weaponID)
    {
      return res.status(400).json({error: "Missing weapon id value."})
    }

    const players = read_data(data_players);

    const playerKey = Object.keys(players).find(key => players[key].id === playerID)
    const player = players[playerKey]

    if(Number(weaponID))
    {
      player.weaponid =Number(weaponID)
    }
    else{
      return res.status(400).json({error: "Invalid weaponid value"})
    }

  players[playerKey] = player;
  write_data(data_players, players);
    res.json({
        message: `Player ${player.id}'s weaponid changed to ${weaponID}`,
        Player: { id: playerID, weaponid: player.weaponid },
      }); 
  })

//

app.get('/api/changeweaponplayer',(req,res)=>
  {
    const {playerID,weaponID} = req.query


      if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }

      if(!weaponID)
    {
      return res.status(400).json({error: "Missing weapon id value."})
    }

    const players = read_data(data_players);

    const playerKey = Object.keys(players).find(key => players[key].id === playerID)
    const player = players[playerKey]

    if(Number(weaponID))
    {
      player.weaponid =Number(weaponID)
    }
    else{
      return res.status(400).json({error: "Invalid weaponid value"})
    }

  players[playerKey] = player;
  write_data(data_players, players);
    res.json({
        message: `Player ${player.id}'s weaponid changed to ${weaponID}`,
        Player: { id: playerID, weaponid: player.weaponid },
      }); 
  })

  // Get information of a specific player


app.get('/api/getplayerinfo', (req,res) =>
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
        message: `Player ${playerID}`,
        Player: { id: playerID, health: player.health, weaponid:player.weaponid,invincibletime: player.invincibilitytime,isinvincible:player.isinvincible },
      });
  });
  app.get('/api/getplayerpoints', (req,res) =>
  {
    const {playerID} = req.query

    if(!playerID)
    {
      return res.status(400).json({error: "Missing player (ID)."})
    }
    const players = read_data(data_players);

    const playerKey = Object.keys(players).find(key => players[key].id === playerID)
    const player = players[playerKey]

if(!player)
    {
      return res.status(400).json({error: "Player not found."})
    }

    res.json({
        message: `Player ${player.name} has ${player.points} points`,
        Player: { id: playerID, points: player.points },
      });
  });

app.get('/api/updateplayer', (req, res) => {
  const { playerID, newPlayerID } = req.query;

  if (!playerID) {
    return res.status(400).json({ error: "Missing player (ID)." });
  }

  if (!newPlayerID) {
    return res.status(400).json({ error: "Missing new player (ID)." });
  }

  const players = read_data(data_players);

  const player = players[playerID];
  if (!player) {
    return res.status(404).json({ error: "Player not found." });
  }

  // Remove the old playerID key
  delete players[playerID];

  // Update the player's ID inside the object
  player.id = newPlayerID;

  // Re-add with new ID as the key
  players[newPlayerID] = player;

  // Save changes
  write_data(data_players, players);

  // Respond
  res.json({
    message: `Player ID updated from ${playerID} to ${newPlayerID}`,
    player: player
  });
});



// Player hits another player

// http://2 => 2
app.get('/api/hit',(req,res)=>
  {
    const {hit, shooter } =req.query; // hit =2 and shooter = 10

    if(!hit || !shooter)
    {
      return res.status(400).json({error: "Missing player (ID)s."})
    }


    const players = read_data(data_players);

    const hitplayerkey = Object.keys(players).find(key => players[key].id === hit)
    const shooterkey = Object.keys(players).find(key => players[key].id === shooter)

    const hitPlayer = players[hitplayerkey]
    const shootPlayer = players[shooterkey]

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
      players[shooterkey] = shootPlayer;

      write_data(data_players,players)

      res.json({
        message: `Player ${shooterkey} hit Player ${hitplayerkey}`,
        hitPlayer: { id: hitplayerkey, health: hitPlayer.health },
        shooterPlayer: { id: shooterkey, points: shootPlayer.points }
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
    lobby.players[pid].health = 5;
    lobby.players[pid].powerUps = [];
  }

  res.json({ lobby });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});
