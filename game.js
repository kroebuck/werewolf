// Server side

const roles = require('./data/roles.json');
const preprocess = ["werewolf"]; // If a role's action(s) does not require player input, put role id here
const MIDDLE_ROLE_COUNT = 3; // Vanilla game is 3

class Game {
    constructor() {
        this.rolesInGame = [];      // All of the roles selected to be a part of the game
        this.rolesAvailable = [];   // Roles in the game that have yet to be assigned to a player
    }

    static getAllRoles() {
        return roles;
    }

    setRoles(roleChoices) {
        roleChoices.forEach(rc => {
            this.rolesAvailable.push(roles[rc]);
            this.rolesInGame .push(roles[rc]);
        });
    }

    setPlayers(players) {
        this.players = players;
    }

    setKillVote(playerName) {
            let p = this.lookUpPlayerByName(playerName);
            p.killVotes++;
            this.killVoteCount++;
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

    determinePlayersToBeKilled() {
        let playersToBeKilled = [];
        let currentMaxVotes = 0;

        // add players with most votes to array
        this.players.forEach(p => {
            if (p.killVotes > currentMaxVotes) {
                currentMaxVotes = p.killVotes;
                playersToBeKilled = [p];
            } else if (p.killVotes == currentMaxVotes) {
                playersToBeKilled.push(p);
            }
        });

        this.players.forEach(p => {
            console.log(p.name + ": " + p.killVotes);
        });

        // if everyone has 1 vote, no one gets killed
        if (currentMaxVotes == 1) {
            return [];
        } else {
            console.log(playersToBeKilled);
            return playersToBeKilled;
        }        
    }

    startGame() {
        // Ensure we have enough players to have all roles filled plus the designated amount MIDDLE_ROLE_COUNT remaining
        // Then assign roles randomly
        if(this.players && this.players.length == this.rolesAvailable.length - MIDDLE_ROLE_COUNT) {
            this.players.forEach(p => {
                // Select random role from available roles
                let roleIndex = Math.floor(Math.random() * this.rolesAvailable.length);
                let role = this.rolesAvailable[roleIndex];
                p.setRole(role);
                // Send the player role info and who else is in the game
                let playerNames = this.players[0].room.getPlayerNamesArray();
                p.socket.emit('gameUpdate', { 'role': role, 'playerNames': playerNames, 'rolesInGame': this.rolesInGame }); // could emit player names to all after the forEach function finishes
                // Remove assigned role from available roles
                this.rolesAvailable.splice(roleIndex, 1);
            });
        }

        // Used in engine.js to know when to call continueNight(). When a player sends the server their action choice, this value increases by 1.
        // When actionChoiceResponses equals the game's player count, we are ready to call continueNight().
        this.actionChoiceResponses = 0;

        this.killVoteCount = 0;

        this.generateQueue();
        this.startNight();
    }

    startNight() {
        this.queue.forEach(p => {
            // Would make sense to do preprocessing AFTER emitting chooseActions event so we make use of the time when player's are choosing what to do
            let playerInfo = this.preprocessActions(p, p.role.actions);

            p.socket.emit('chooseActions', { 'playerInfo': playerInfo });
        });
    }

    preprocessActions(p, actions) {
        let playerInfo = {
            'actions': [],
            'data': {}
        };

        actions.forEach(a => {
            if(Array.isArray(a)) {
                let acts = this.preprocessActions(p, a);
                playerInfo.actions.push(acts.actions);
                playerInfo.data = { ...playerInfo.data, ...acts.data };
            } else {
                playerInfo.actions.push(a);
                if (preprocess.includes(p.role.id)) {
                    playerInfo.data = this.doAction(p, a);
                }
            }
        });

        return playerInfo;
    }

    // Process actions in queue order, update client side game info
    // (all they'll see is role order for all roles present in game)
    continueNight() {
        this.queue.forEach(p => {
            if (p.actionChoice) {
                let result = this.doAction(p, p.actionChoice);

                if (result != null) {
                    p.socket.emit('actionResult', { 'action': p.actionChoice.actionName, 'result': result });
                }
            }
        });

        this.queue.forEach(p => {
            p.socket.emit('nightEnded');
        });
    }

    // could also store playersToBeKilled as class property in determinePlayersToBeKilled() method
    // instead of sending to engine.js and then sending back here
    determineWinner(playersToBeKilled) {
        console.log('winner being determined...');
        var winner = '';

        //let playersToBeKilled = this.determinePlayersToBeKilled();

        let werewolfIsPresent = false;

        // Check if any players are a werewolf
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].role.id == "werewolf") {
                werewolfIsPresent = true;
                break;
            }
        }

        console.log('werewolf present? ' + werewolfIsPresent);

        // villager win
            // no werewolves & no one killed
            // if at least 1 werewolf dies (regardless of any villagers also dying)
        // werewolf win
            // at least 1 werewolf present and no werewolves die

        if (!werewolfIsPresent && playersToBeKilled.length == 0) {
            winner = 'village';
        } else {
            let werewolfWasKilled = false;

            // Check if a werewolf died
            for (let i = 0; i < playersToBeKilled.length; i++) {
                if (playersToBeKilled[i].role.id == "werewolf") {
                    werewolfWasKilled = true;
                    break;
                }
            }

            console.log('werewolf killed? ' + werewolfWasKilled);

            if (werewolfWasKilled) {
                winner = 'village';
            } else {
                winner = 'werewolf';
            }
        }

        return winner;
    }

    // The parameter "action" should be one of the elements of the array associated with the "actions" attribute. Explicitly:
    // "role": {
    //      "actions": [{ 'action 1' }, { 'action 2' }, ...]
    // }
    doAction(player, action) {
        let r = eval('this.' + action.action + '(player, action)');

        if (action.condition) {
            if (eval(action.condition.test)) {
                r = this.doAction(player, action.condition.outcome);
                r.action = action.condition.outcome.actionName;
            }
        }

        if (action.message) {
            r.message = action.message;
        }

        return r;
    }

    // werewolf, mason, minion
    revealAllOfRole(player, action) {
        let members = [];

        let roleToReveal = player.role;

        // action.role not implemented yet by anything in roles.json
        // minion would be a role that needs this
        if(action.role) {
            roleToReveal = action.role;
        }

        this.players.forEach(p => {
            if (p.role.id == roleToReveal.id) {
                members.push(p.name);
            }
        });

        return { "members": members, "count": members.length, "role": roleToReveal.name };
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
        let availRolesCopy = JSON.parse(JSON.stringify(this.rolesAvailable));

        // choose roles at random
        for (let i = 0; i < action.count; i++) {
            let roleIndex = Math.floor(Math.random() * availRolesCopy.length);
            //middleRoles.push(availRolesCopy[roleIndex]);
            middleRoles.push(availRolesCopy[roleIndex].name);
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