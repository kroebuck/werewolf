// Server side

class Player {
    constructor(socket) {
        this.socket = socket;
        this.host = false;
        this.room = null;
    }

    setName(name) {
        this.name = name;
    }

    setHost(isHost) {
        this.host = isHost;
    }

    setRoom(room) {
        this.room = room;
    }

    setRole(role) {
        // To track role changes throughout the game, keep an array of each new role?
        // Keep an array of changes in game.js?
            // each element is some object with player(s) involved and change in role (and what action caused it)
		if (!this.role) {
			this.startingRole = role;
		}

        this.role = role;
    }

	setActionChoice(actionChoice) {
		this.actionChoice = actionChoice;
	}
}

module.exports = Player;
