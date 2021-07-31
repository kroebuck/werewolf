const express = require('express');
const app = express();
const http = require('http');
const { allowedNodeEnvironmentFlags } = require('process');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var users = [];

// allows HTML file to access files in the public folder
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    var theUser = {
        'socket': socket,
        'host': false
    };

    if (users.length == 0) {
        theUser.host = true;
    }

    users.push(theUser);

    console.log('user connected (' + users.length + ')');

    socket.on('disconnect', () => {
        console.log('user disconnected');

        // remove user from users array
        for (let i = 0; i < users.length; i++) {
            if (users[i].socket == socket) {
                users.splice(i, 1);
            }
        }

        // remove user from users array?
            // if game has not yet begun, can just remove and let them rejoin and try again
            // else leave theUser obj in users array
                // timeout after some period? boot user from game
        // store for a given user a session (which has a cookie)
            // store in theUser
        // when user disconnects, update 'conn status' in theUser obj
        // when a user connects, check if they have a matching cookie
            // if yes -> set their appropriate info from old theUser obj (e.g., name)
    });

    socket.on('nameSubmit', (name) => {
        var nameTaken = false;

        users.forEach(us => {
            if (us.name == name) {
                nameTaken = true;
            }
        });

        socket.emit('nameRes', { 'taken': nameTaken });

        if (!nameTaken) {
            theUser.name = name;

            // Check if game is ready to start
            // Req: 3 or more players, every user has valid name
            if (users.length >= 3) {
                let isReady = true;

                users.forEach(us => {
                    if (!us.hasOwnProperty('name')) {
                        isReady = false;
                    }
                })

                socket.emit('gameStartRes', { 'isReady': isReady });
            }
        }

        console.log(theUser.name);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
