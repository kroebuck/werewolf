const Player = require('./player');
const Room = require('./room');

class Engine {
    constructor() {
        this.players = [];
        this.rooms = [];

        // Temp
        this.createNewRoom();
    }

    findRoomByCode(code) {
        for (var i = this.rooms.length - 1; i >= 0; i--) {
            if(this.rooms[i].code == code) {
                return this.rooms[i];
            }
        }

        return null;
    }

    createNewRoom() {
        var room = new Room();
        room.setRoomCode('bag');
        this.rooms.push(room);

        return room;
    }

    newSocket(socket) {
        var p = new Player(socket);

        if (this.players.length == 0) {
            p.setHost(true);
        }

        this.players.push(p);

        console.log('user connected (' + this.players.length + ')');

        socket.on('disconnect', () => {
            console.log('user disconnected');

            // remove user from players array
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].socket == socket) {
                    this.players.splice(i, 1);
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
            var validName = this.rooms[0].checkName(name);

            socket.emit('nameRes', { 'taken': !validName });

            if (validName) {
                p.name = name;
                this.rooms[0].addPlayer(p);

                // Check if game is ready to start
                // Req: 3 or more players, every user has valid name
                if (this.players.length >= 3) {
                    let isReady = true;

                    this.players.forEach(us => {
                        if (!us.hasOwnProperty('name')) {
                            isReady = false;
                        }
                    })

                    this.players[0].socket.emit('gameStartRes', { 'isReady': isReady });
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
    }
}

module.exports = Engine;