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
}

module.exports = Game;