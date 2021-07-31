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
        this.role = role;
    }
}

module.exports = Player;
