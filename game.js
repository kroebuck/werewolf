const roles = require('./data/roles.json');
const preprocess = ["werewolf"]; // if a role's action(s) does not require player input, put role id here

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
    }

    setPlayers(players) {
        this.players = players;
    }

    lookUpPlayerByName(name) {
        for (let i = 0; i < this.players.length; i++) {
            if (name == this.players[i].name) {
                return this.players[i];
            }
        }

        return null;
    }

    generateQueue() {
        this.queue = [...this.players].sort((a, b) => a.role.order - b.role.order);
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
                // Send the player role info and who else is in the game
                let playerNames = this.players[0].room.getPlayerNamesArray();
                p.socket.emit('gameUpdate', { 'role': role, 'playerNames': playerNames});
                // Remove assigned role from available roles
                this.availRoles.splice(roleIndex, 1);
            });
        }

        this.actionChoiceResponses = 0; // used in engine.js to know when to call continueNight()

        this.generateQueue();
        this.startNight();
    }

    startNight() {
        this.queue.forEach(p => {
           let playerInfo = this.preprocessActions(p, p.role.actions);

           p.socket.emit('chooseActions', { 'playerInfo': playerInfo });
            // p.socket.emit('chooseActions', { 'availableActions': p.role.actions });

        });
    }

    preprocessActions(p, actions) {
        let playerInfo = {
            'actions': [],
            'data': {}
        };

        actions.forEach(a => {
            if(Array.isArray(a)) {
                let acts = this.preprocessActions(a);
                playerInfo.actions.push(acts.actions);
                playerInfo.data = { ...playerInfo.data, ...acts.data };
            } else {
                if (preprocess.includes(p.role.id)) {
                    playerInfo.data = this.doAction(p, a);
                } else {
                    playerInfo.actions.push(a);
                }
            }
        });

        return playerInfo;
    }

    //process actions in queue order, update client side game info (all they'll see is role order for all roles present in game)
    continueNight() {
        this.queue.forEach(p => {
            if (p.actionChoice) {
                let result = this.doAction(p, p.actionChoice);

                if (result != null) {
                    p.socket.emit('actionResult', result);
                }
            }
        });

        this.queue.forEach(p => {
            console.log(p.name + ": " + p.role.name);
            p.socket.emit('nightEnded');
        });
    }

    // After continueNight():
    // players vote on who to kill (if anyone)
        // reveal role of person killed
    // display winning team

    doAction(player, action) {
        let r = eval('this.' + action.action + '(player, action)');

        if (action.condition) {
            if (eval(action.condition.test)) {
                this.doAction(player, action.condition.outcome);
            }
        }

        return r;
    }

    // werewolf, mason, minion
    revealAllOfRole(player, action) {
        let members = [];

        let roleToReveal = player.role.id;

        // action.role not implemented yet
        // minion would be a role that needs this
        if(action.role) {
            roleToReveal = action.role;
        }

        this.players.forEach(p => {
            if (p.role.id == roleToReveal) {
                members.push(p.name);
            }
        });

        return { "members": members, "count": members.length };
    }

    // seer, robber
    viewPlayerRole(player, action) {
        let nameRolePairs = {};

        this.players.forEach(p => {
            if (action.selection.includes(p.name)) {
                nameRolePairs[p.name] = p.role.name;
            }
        });

        return { "nameRolePairs": nameRolePairs };
    }

    // seer, werewolf (condition)
    // simply add role.name instead?
    getRandomMiddleRoles(player, action) {
        let middleRoles = [];

        // create deep copy
        let availRolesCopy = JSON.parse(JSON.stringify(this.availRoles));

        // choose roles at random
        for (let i = 0; i < action.count; i++) {
            let roleIndex = Math.floor(Math.random() * availRolesCopy.length);
            middleRoles.push(availRolesCopy[roleIndex]);
            availRolesCopy.splice(roleIndex, 1);
        }

        return { "middleRoles": middleRoles };
    }

    // troublemaker, robber
    swap(player, action) {
        var p1 = null;
        var p2 = null;

        if (action.target == "self") {
            p1 = player;
            p2 = this.lookUpPlayerByName(action.selection[0]);
            // Since we want to show robber their new role, get p2's role and THEN swap roles.
            var newRole = this.viewPlayerRole(p1, action);
        } else if (action.target == "other") {
            p1 = this.lookUpPlayerByName(action.selection[0]);
            p2 = this.lookUpPlayerByName(action.selection[1]);
        }

        let temp = p1.role;
        p1.role = p2.role;
        p2.role = temp;

        if (action.target == "self") {
            return newRole;
        } else if (action.target == "other") {
            return null;
        }
    }

    doNothing(player, action) {
        return null;
    }

}

module.exports = Game;