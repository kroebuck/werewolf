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

    generateQueue() {
        console.log(this.players);

        this.queue = [...this.players].sort((a, b) => a.role.turn - b.role.turn);

        console.log(this.queue);
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

        this.generateQueue();
    }

    startNight() {
        // for p in queue {
        //     res = action()
        //     p.socket.emit(res)
        // }
    }

    viewOthers(role) {

    }

    // werewolf, minion
    getOtherWerewolves() {
        let werewolves = [];

        this.players.forEach(p => {
            if (p.role.id == "werewolf");
            werewolves.push(p.name);
        })

        if (werewolves.length == 1 && p.role.id != minion) {
            this.viewMiddleRoles(1);
        } else {
            p.socket.emit('gameUpdate', {'werewolves': werewolves});
        }        
    }

    // mason
    getOtherMasons(player) {
        let otherMason = null;

        this.players.forEach(p => {
            if (p.role.id == "mason" && p != player);
            otherMason = p.name;
        })

        p.socket.emit('gameUpdate', {'otherMason': otherMason});    
    }

    // seer
    viewPlayerRole(player) {
        p.socket.emit('gameUpdate', {'role': player.role.name});
    }

    // seer
    viewMiddleRoles(count) {
        let roles = [];

        // create deep copy
        let availRolesCopy = JSON.parse(JSON.stringify(this.availRoles));

        // choose roles at random
        for (let i = 0; i < count; i++) {
            let roleIndex = Math.floor(Math.random() * availRolesCopy.length);
            let role = availRolesCopy[roleIndex];
            roles.push(role);
            availRolesCopy.splice(roleIndex, 1);
        }

        p.socket.emit('gameUpdate', { 'middleRoles': roles });
    }

    // troublemaker, robber
    swap(p1, p2) {
        temp = p1.role;
        p1.role = p2.role;
        p2.role = temp;

        if (p === p1 || p === p2) {
            p.socket.emit('gameUpdate', { 'role': p.role });
        }
    }



}

module.exports = Game;