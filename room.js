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
        var validName = true;

        this.players.forEach(p => {
            if (p.name == name) {
                validName = false;
            }
        });

        return validName;
    }
}

module.exports = Room;