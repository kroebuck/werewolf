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
        let room = new Room();
        let code = Room.generateCode();
        let generateAttempts = 0;
        
        while (this.findRoomByCode(code)) {
            code = Room.generateCode();
            generateAttempts++;

            if (generateAttempts > 10) {
                return null;
            }
        }
        
        room.setRoomCode(code);
        this.rooms.push(room);

        return room;
    }

    newSocket(socket) {
        var p = new Player(socket);

        // should be done when player is in room
        if (this.players.length == 0) {
            p.setHost(true);
        }

        this.players.push(p);

        console.log('user connected (' + this.players.length + ')');

        // move this to players.js?
        socket.on('disconnect', () => {
            // remove user from players array
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].socket == socket) {
                    this.players.splice(i, 1);
                }
            }

            console.log('user disconnected (' + this.players.length + ')');

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

        // removed nameSubmit request from client-side -> update to whatever new request is (join room, create room)
        socket.on('roomJoin', (msg) => {
            var isValidRoom = false;
            var isValidName = false;

            var room = this.findRoomByCode(msg.roomCode);

            if (room) {
                isValidRoom = true;
                isValidName = room.checkName(msg.name);

                if (isValidName) {
                    p.name = msg.name;
                    room.addPlayer(p);
                    console.log(p.name + " joined room " + room.code);

                    if (room.checkIsGameReady()) {
                        room.players.forEach(us => {
                            if (us.host) {
                                us.socket.emit('gameStartRes', { 'isReady': true });
                            }
                        });
                    }
                }
            }

            socket.emit('roomJoinStatus', { 'isValidName': isValidName, 'isValidRoom': isValidRoom });
        });

        socket.on('roomCreate', (name) => {
            let isValidRoom = false;
            let room = this.createNewRoom();

            if (room) {
                isValidRoom = true;
                p.name = name;
                p.host = true;
                room.addPlayer(p);
                socket.emit('roomCreateStatus', { 'wasRoomCreated': isValidRoom, 'roomCode': room.code });
            } else {
                socket.emit('roomCreateStatus', { 'wasRoomCreated': isValidRoom });
            }           
        })

        socket.on('gameStart', () => {
            if (p.room != null && p.host) {
                // Start game
            // allow host to decide on what roles to use
                // session remembers last chosen
                // have default setting to just decide randomly
            // assign roles to everyone randomly
            }
            
        });
    }
}

module.exports = Engine;