// Server side

const Player = require('./player');
const Room = require('./room');
const Game = require('./game');

class Engine {
    constructor() {
        this.players = [];
        this.rooms = [];
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

    deleteRoom(room) {
        let index = this.rooms.indexOf(room);
        this.rooms.splice(index, 1);
    }

    newSocket(socket) {
        var p = new Player(socket);

        this.players.push(p);

        console.log('user connected (' + this.players.length + ')');

        socket.emit('roles', Game.getAllRoles());

        // TODO
        // move this to players.js?
        // sessions? remove player from room/server arrays after some period of time?
        socket.on('disconnect', () => {
            // remove user from players array
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].socket == socket) {
                    this.players.splice(i, 1);
                }
            }

            console.log('user disconnected (' + this.players.length + ')');

            // update the room object
            if (p.room) {
                let room = p.room

                if (p.host) {
                    room.shutdownRoom();
                } else {
                    room.removePlayer(p);

                    let host = room.getHost();

                    if (room.checkIsGameReady() == false) {
                        console.log('emit: game not ready');
                        host.socket.emit('gameStartStatus', { "isReady": room.checkIsGameReady() });
                    }
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

                    this.broadcastPlayersArray(room);

                    if (room.checkIsGameReady()) {
                        room.players.forEach(us => {
                            if (us.host) {
                                us.socket.emit('gameStartStatus', { 'isReady': true });
                            }
                        });
                    }
                }
            }

            socket.emit('roomJoinStatus', { 'isValidName': isValidName, 'isValidRoom': isValidRoom });
        });

        socket.on('roomCreate', (msg) => {
            let name = msg.name;
            let isValidRoom = false;
            let room = this.createNewRoom();
            room.onComplete(() => {
                console.log('Room empty');
                // delete room here where ever you put it
                this.deleteRoom(room);
            });

            if (room) {
                isValidRoom = true;
                p.name = name;
                p.host = true;
                room.addPlayer(p);
                socket.emit('roomCreateStatus', { 'wasRoomCreated': isValidRoom, 'roomCode': room.code });

                this.broadcastPlayersArray(room);

                if (room.checkIsGameReady()) {
                    p.socket.emit('gameStartStatus', { 'isReady': true });
                }
            } else {
                socket.emit('roomCreateStatus', { 'wasRoomCreated': isValidRoom });
            }           
        })

        socket.on('gameStart', (obj) => {
            if (p.room != null && p.host) {
                var game = new Game();
                p.room.setGame(game);
                game.setRoles(obj.roles);
                game.setPlayers(p.room.players);
                game.startGame();
            }
        });

        socket.on('actionChoice', (msg) => {
            let game = p.room.game;

            if (game) {
                game.actionChoiceResponses++;

                if (msg) {
                    p.setActionChoice(msg.action);
                }

                if (game.actionChoiceResponses == game.players.length) {
                    game.continueNight();
                }
            } else {
                console.log("something went wrong");
            }
        });

        socket.on('killVote', (msg) => {
            let game = p.room.game;

            game.setKillVote(msg.playerName);

            if (game.killVoteCount == game.players.length) {
                let playersToBeKilled = game.determinePlayersToBeKilled();

                if (playersToBeKilled) {
                    let winner = game.determineWinner();

                    p.room.players.forEach(p => {
                        p.socket.emit('gameResults', { "playersToBeKilled": playersToBeKilled, "winner": winner });
                    });
                }
            }
        });
    }

    broadcastPlayersArray(room) {
        let playerNames = room.getPlayerNamesArray();
        room.players.forEach(p => {
            p.socket.emit('roomPlayersStatus', { 'playerNames': playerNames });
        });
    }
}

module.exports = Engine;