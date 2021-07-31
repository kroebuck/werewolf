const Game = require('./game');

const ROOM_CODE_LENGTH = 4;
const ROOM_MINIMUM_PLAYERS = 3;

class Room {
    constructor() {
        this.players = [];
        this.playerCount = 0;
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

    addPlayer(player) {
		player.setRoom = this;
        this.players.push(player);
        this.playerCount++;
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