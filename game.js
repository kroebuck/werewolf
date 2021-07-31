const roles = require('./data/roles.json');

class Game {
    constructor() {
        this.availRoles = [];
    }

    static getAllRoles() {
        return roles;
    }

    setRoles(roleChoices) {
        roleChoices.forEach(rc => {
            this.availRoles.push(roles[rc]);
        });
        console.log(this.availRoles);
    }

    setPlayers(players) {
        this.players = players;
    }

    startGame() {
        // Ensure we have enough players to have all roles filled plus 3 remaining
        // Then assign roles randomly
        if(this.players && this.players.length == this.availRoles.length - 3) {
            this.players.forEach(p => {
                // Select random role from available roles
                let roleIndex = Math.floor(Math.random() * this.availRoles.length);
                let role = this.availRoles[roleIndex];
                p.setRole(role);
                // Send the player role info
                p.socket.emit('gameUpdate', { 'role': role });
                // Remove assigned role from available roles
                this.availRoles.splice(roleIndex, 1);
            });
        }
    }
}

module.exports = Game;