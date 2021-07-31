const express = require('express');
const app = express();
const http = require('http');
const { allowedNodeEnvironmentFlags } = require('process');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Player = require('./player');
const Room = require('./room');

var players = [];
var rooms = [];

// Temp set up test room
var room = new Room();
room.setRoomCode('bag');
rooms.push(room);

// allows HTML file to access files in the public folder
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function findRoomByCode(code) {
    for (var i = rooms.length - 1; i >= 0; i--) {
        if(rooms[i].code == code) {
            return rooms[i];
        }
    }

    return null;
}

io.on('connection', (socket) => {

    var p = new Player(socket);

    if (players.length == 0) {
        p.setHost(true);
    }

    players.push(p);

    console.log('user connected (' + players.length + ')');

    socket.on('disconnect', () => {
        console.log('user disconnected');

        // remove user from players array
        for (let i = 0; i < players.length; i++) {
            if (players[i].socket == socket) {
                players.splice(i, 1);
            }
        }

        // remove user from players array?
            // if game has not yet begun, can just remove and let them rejoin and try again
            // else leave theUser obj in players array
                // timeout after some period? boot user from game
        // store for a given user a session (which has a cookie)
            // store in theUser
        // when user disconnects, update 'conn status' in theUser obj
        // when a user connects, check if they have a matching cookie
            // if yes -> set their appropriate info from old theUser obj (e.g., name)
    });

    socket.on('nameSubmit', (name) => {
        validName = room.checkName(name);

        socket.emit('nameRes', { 'taken': !validName });

        if (validName) {
            p.name = name;
            room.addPlayer(p);

            // Check if game is ready to start
            // Req: 3 or more players, every user has valid name
            if (players.length >= 3) {
                let isReady = true;

                players.forEach(us => {
                    if (!us.hasOwnProperty('name')) {
                        isReady = false;
                    }
                })

                players[0].socket.emit('gameStartRes', { 'isReady': isReady });
            }
        }

        console.log(p.name);
    });

    socket.on('gameStart', () => {
        console.log('game start')
        // Start game
        // allow host to decide on what roles to use
            // session remembers last chosen
            // have default setting to just decide randomly
        // assign roles to everyone randomly
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
