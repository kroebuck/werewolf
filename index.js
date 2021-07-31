const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Engine = require('./engine');
const Game = require('./game');

console.log(Game.getAllRoles());
var g = new Game();
g.setRoles(['baby','baby', 'vampire']);

var engine = new Engine();

// allows HTML file to access files in the public folder
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    engine.newSocket(socket);
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
