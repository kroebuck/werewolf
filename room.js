class Room {
	constructor() {
		this.players = [];
		this.playerCount = 0;
	}

	setRoomCode(code) {
		this.roomCode = code;
	}

	addPlayer(player) {
		this.players.push(player);
		this.playerCount++;
	}

	checkName(name) {
        this.players.forEach(p => {
            if (p.name == name) {
                return false;
            }
        });

        return true;
	}
}

module.exports = Room;