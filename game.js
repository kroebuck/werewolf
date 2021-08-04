const roles = require('./data/roles.json');
const preprocess = ["revealAllOfRole"]; // if a role's action(s) does not require player input, put role id here

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
        //console.log(this.availRoles);
    }

    setPlayers(players) {
        this.players = players;
    }

    lookUpPlayerByName(name) {
        for (let i = 0; i < this.players.length; i++) {
            if (name == this.players[i].name) {
                return players[i];
            }
        }

        return null;
    }

    generateQueue() {
        console.log(this.players);

        this.queue = [...this.players].sort((a, b) => a.role.order - b.role.order);

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

        this.actionChoiceResponses = 0; // used in engine.js to know when to call continueNight()

        this.generateQueue();
        this.startNight();
    }

    startNight() {
        let playerNames = this.players[0].room.getPlayerNamesArray();

        this.queue.forEach(p => {
           //let playerInfo = this.preprocessActions(p, p.role.actions);

            p.socket.emit('chooseActions', { 'availableActions': p.role.actions, 'playerNames': playerNames});

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
                    let r = this.doAction(p, a);
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
                this.doAction(p, p.actionChoice);
            }
        })
    }

    // After continueNight():
    // players vote on who to kill (if anyone)
        // reveal role of person killed
    // display winning team

    doAction(player, action, params) {
        let r = null;

        if(params) {
            r = eval(action.action + '(player, action, params)');
        } else {
            r = eval(action.action + '(player, action)');
        }

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
                members.push(p);
            }
        });

        return { 'count': members.length, 'members': members };
    }

    // seer, robber
    viewPlayerRole(player, action, params) {
        let nameRoleMap = new Map();

        this.players.forEach(p => {
            if (action.selection.includes(p.name)) {
                nameRoleMap.set(p.name, p.role.name)
            }
        })

        return nameRoleMap;
        // p.socket.emit('gameUpdate', {'role': player.role.name});
    }

    // seer, werewolf (condition)
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

        return middleRoles;

        // p.socket.emit('gameUpdate', { 'middleRoles': middleRoles });
    }

    // troublemaker, robber
    swap(player, action, params) {
        let p1 = this.lookUpPlayerByName(params.player1Name);
        let p2 = this.lookUpPlayerByName(params.player1Name);
        temp = p1.role;
        p1.role = p2.role;
        p2.role = temp;

        // below should probably not be in this method, so as to keep it general
        // if (player === p1 || player === p2) {
        //     return player.role.id;
        // }

        // p.socket.emit('gameUpdate', { 'role': p.role });
    }

    swapEric(player, action, params) {
        let p1 = null;
        let p2 = null;

        if(action.target == 'self') {
            p1 = player;
            p2 = this.lookUpPlayerByName(params.selection);
        } else if (action.target == 'other' && typeof(params.selection) == 'array') {
            p1 = this.lookUpPlayerByName(params.selection[0]);
            p2 = this.lookUpPlayerByName(params.selection[1]);
        }

        temp = p1.role;
        p1.role = p2.role;
        p2.role = temp;

        // below should probably not be in this method, so as to keep it general
        // if (player === p1 || player === p2) {
        //     return player.role.id;
        // }

        // p.socket.emit('gameUpdate', { 'role': p.role });
    }



}

module.exports = Game;