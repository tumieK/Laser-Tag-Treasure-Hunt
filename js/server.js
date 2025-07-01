const express = require('express');
const path = require('path');
const dbcontroller = require('./dbcontroller');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.post('/api/players', (req, res) => {
    const player = req.body;
    try{
        dbcontroller.addPlayer(player);
        res.json({message: 'Player ${player.playerID} added successfully.'});
    }
    catch(e)
    {
        console.error(err);
        res.status(500).json({error: 'Failed to add player.'});
    }
});

app,listen(PORT, () => {
    console.log('server running at http://localhost:${PORT}');

});