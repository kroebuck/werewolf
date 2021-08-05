const Game = require('./game');

const ROOM_CODE_LENGTH = 4;
const ROOM_MINIMUM_PLAYERS = 2; // Vanilla game is 3

class Room {
    constructor() {
        this.players = [];
        this.playerCount = 0;
		this.completeFunctions = [];
		this.game = null;
    }

	static generateCode() {
		let roomCode = '';

		for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
			let letter = String.fromCharCode(65 + Math.random() * 26);
			roomCode += letter;
		}

		return roomCode;
	}

    setRoomCode(code) {
        this.code = code;
    }

	setGame(game) {
		this.game = game;
	}

    addPlayer(player) {
		player.setRoom(this);
        this.players.push(player);
        this.playerCount++;
    }

	removePlayer(player) {
		player.setRoom(null);
		let index = this.players.indexOf(player);
		this.players.splice(index, 1);
		this.playerCount--;

		if(this.players.length < 1) {
			this.shutdownRoom();
		}
	}

	shutdownRoom() {
		this.players.forEach(p => {
			p.setRoom(null);
		});

		this.completeFunctions.forEach(cb => {
			cb();		
		});
	}

	// When Room is instantiated, a deleteRoom() method is passed in from engine.js
	onComplete(cbFunc) {
		if(cbFunc && typeof(cbFunc) === 'function') {
			this.completeFunctions.push(cbFunc);
		}
	}

	getHost() {
		for (let i = 0; i < this.playerCount; i++) {
			if (this.players[i].host) {
				return this.players[i];
			}
		}

		return null;
	}

	getPlayerNamesArray() {
		let playerNames = [];
		this.players.forEach(p => {
			playerNames.push(p.name);
		})

		return playerNames;
	}

    checkName(name) {
        var validName = true;

        this.players.forEach(p => {
            if (p.name == name) {
                validName = false;
				return false;
            }
        });

        return validName;
    }

	checkIsGameReady() {
		if (this.playerCount >= ROOM_MINIMUM_PLAYERS) {
			return true;
		}

		return false;
	}
}

module.exports = Room;