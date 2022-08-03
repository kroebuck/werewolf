// Client side

// var player = {
//     'name':
//     'roomCode':
//     'role':
//     'actions':
//          'action':
//          'data':
//              'message':
// }

// Get this info from game.js? Probably shouldn't be hard coded in multiple spots...S
const MIDDLE_ROLE_COUNT = 3; // Vanilla game is 3
const MIN_PLAYER_COUNT = 2;

class Game {
    constructor(socket) {
        this.socket = socket;
        this.playerNames = [];
        this.chosenRoles = [];
    }

    //
    // Game Setup
    //
    
    setChosenRoles(roles) {
        // get total amountForGame count
        let totalAmountForGame = 0;
        for (var key in roles) {
            if (roles.hasOwnProperty(key)) {
                for (let i = 0; i < roles[key].amountForGame; i++) {
                    this.chosenRoles.push(roles[key].id);
                }
                totalAmountForGame += roles[key].amountForGame;
            }
        }

        // check if game start conditions are met
        if (totalAmountForGame == this.playerNames.length + MIDDLE_ROLE_COUNT) {
            console.log("Chosen roles set: " + this.chosenRoles);
            document.getElementById('start_game_button').disabled = false;
        } else {
            this.chosenRoles = [];
            console.log(`Number of chosen roles (${totalAmountForGame}) must equal required amount (${this.playerNames.length + MIDDLE_ROLE_COUNT})`);
        }
    }

    checkIsGameReady() {
        let isGameReady = true;

        if (this.chosenRoles.length == 0) {
            isGameReady = false;
            ("Roles not set.");
        }

        if (this.playerNames.length < MIN_PLAYER_COUNT) {
            isGameReady = false;
            console.log(`Not enough players in lobby. Minimum required is ${MIN_PLAYER_COUNT}.`);
        }

        return isGameReady;
    }

    getRequiredRoleAmount() {
        return Math.max(MIN_PLAYER_COUNT, this.playerNames.length) + MIDDLE_ROLE_COUNT;
    }

    //
    // Actions
    //

    // werewolf
    revealAllOfRole() {
        document.getElementById('actions_container').innerHTML = player.actions.actionName;
    }

    // seer
    viewPlayerRole() {
        let actionObj = this.getActionObj("viewPlayerRole");
        
        document.getElementById('actions_container').innerHTML = actionObj.actionName;

        var chooseDiv = this.generateChooseOtherPlayersDiv();

        let reqCount = 1;

        if (actionObj.count) {
            reqCount = actionObj.count;
        }

        let submitBtn = this.generateSubmitButton();

        submitBtn.onclick = () => {
            let selections = this.getPlayerSelections();

            if (selections.length == reqCount) {
                console.log("Player selection(s) made!");
                this.disableChildren(chooseDiv);
                submitBtn.disabled = true;
                actionObj.selection = selections;
                this.socket.emit('actionChoice', { "action": actionObj });
            } else {
                console.log(`You must select ${reqCount} player(s).`);
            }
        }
    }

    // seer, werewolf
    getRandomMiddleRoles() {
        let actionObj = this.getActionObj("getRandomMiddleRoles");

        document.getElementById('actions_container').innerHTML = actionObj.actionName;

        this.socket.emit('actionChoice', { "action": actionObj });
    }

    // robber, troublemaker
    swap() {
        let actionObj = this.getActionObj("swap");

        document.getElementById('actions_container').innerHTML = actionObj.actionName;

        if (actionObj.target == "middle") {
            document.getElementById('actions_container').innerHTML = `<b>${actionObj.actionName}</b>`;
            this.socket.emit('actionChoice', { "action": actionObj });
            return;
        }

        let chooseDiv = this.generateChooseOtherPlayersDiv();
        let submitBtn = this.generateSubmitButton();

        // Swap roles
        submitBtn.onclick = () => {
            let selections = this.getPlayerSelections();

            let reqCount = 2;

            if (actionObj.target == "self") {
                reqCount = 1;
            }

            if (selections.length == reqCount) {
                console.log("Player selection(s) made!");
                this.disableChildren(chooseDiv);        
                submitBtn.disabled = true;
                actionObj.selection = selections;
                this.socket.emit('actionChoice', { "action": actionObj });
            } else {
                console.log(`You must select ${reqCount} players to swap.`);
            }
        }
    }

    // villager, robber, troublemaker
    doNothing() {
        let actionObj = this.getActionObj("doNothing");

        // add <br> after this line on HTML, there is no gap b/w this line and the kill voting stuff
        document.getElementById('actions_container').innerHTML = "<b>" + actionObj.actionName + "...</b>";

        this.socket.emit('actionChoice', { "action": actionObj });
    }

    //
    // Helper Functions
    //

    displayActionResult(actionResult) {
        var actionsDiv = document.getElementById("actions_container");
        actionsDiv.disabled = true;
        actionsDiv.style.display = 'none';

        let resultsDiv = document.getElementById("action_results");
        resultsDiv.style.display = null;
        resultsDiv.innerHTML = "Action: " + actionResult.action + "<br>Result: ";

        let result = actionResult.result;

        if (result.members) {
            if (result.count < 2) { // currently unused, not sending client info saying we tried this
                resultsDiv.innerHTML += `<br>You are the only ${result.role} awake.`;
            } else {
                resultsDiv.innerHTML += `<br>Other players with role ${result.role}:<br>`;

                result.members.forEach(name => {
                    if (name != player.name) {
                        resultsDiv.innerHTML += `${name}<br>`;
                    }
                });
            }
        }

        if(result.nameRolePairs) {
            let map = result.nameRolePairs;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    resultsDiv.innerHTML += "<br>" + key + ": " + map[key];
                }
            }
        }
        
        if (result.middleRoles) {
            result.middleRoles.forEach(roleName => {
                resultsDiv.innerHTML += `${roleName}<br>`;
            })
        }

        // TODO: Improve implementation so indices are not hardcoded
        if (result.swaps) {
            if (result.swaps.length == 1) {
                // swapped with self
                resultsDiv.innerHTML += `Swapped roles with ${result.swaps[0]}<br>`;
            } else {
                // swapped others
                resultsDiv.innerHTML += `Swapped roles of ${result.swaps[0]} and ${result.swaps[1]}<br>`;
            }
        }

        if (result.newRole) {
            resultsDiv.innerHTML += `Role acquired: ${result.newRole.name}<br>`;
        }

        if (result.message) {
            resultsDiv.innerHTML += result.message;
        }
    }

    displayPlayerToKillOptions() {
        let killDiv = document.getElementById("kill_container");
        killDiv.style.display = null;

        var chooseDiv = this.generateChooseOtherPlayersDiv();
        let submitBtn = this.generateSubmitButton();
        submitBtn.innerText = "Vote to kill";

        killDiv.append(chooseDiv);
        killDiv.append(submitBtn);

        submitBtn.onclick = () => {
            let selection = this.getPlayerSelections();
            if (selection.length == 1) {
                this.disableChildren(chooseDiv);
                submitBtn.disabled = true;
                console.log(`${selection[0]} chosen to kill.`);
                this.socket.emit('killVote', { "playerName": selection[0] });
            } else {
                console.log("Choose only one player.");
            }
        }

    }

    // 'gameResults', { "playersToBeKilled": playersToBeKilled, "winner": winner }
    displayGameResults(gameResults) {
        let gameResultsDiv = document.getElementById("game_results_container");
        gameResultsDiv.style.display = null;
        gameResultsDiv.innerHTML = "Players Killed:";

        if (gameResults.playersToBeKilled) {
            if (gameResults.playersToBeKilled.length == 0) {
                gameResultsDiv.innerHTML += "<br>";
                gameResultsDiv.innerHTML += "None"
            } else {
                gameResults.playersToBeKilled.forEach(p => {
                    gameResultsDiv.innerHTML += "<br>";
                    gameResultsDiv.innerHTML += `${p.name} (${p.role})`;
                });
            }
        }

        if (gameResults.winner) {
            gameResultsDiv.innerHTML += "<br><br>";
            gameResultsDiv.innerHTML += `<b>Winning team:</b> ${gameResults.winner}`;
        }

        if (gameResults.finalRoles) {
            gameResultsDiv.innerHTML += "<br><br>";
            gameResultsDiv.innerHTML += "<b>Final roles:</b>";
            gameResults.finalRoles.forEach(el => {
                gameResultsDiv.innerHTML += "<br>";
                gameResultsDiv.innerHTML += `${el.name}: ${el.role.name}`;
            })
        }
    }

    // unused?
    generateActionNameDiv(action) {
        let actionDiv = document.createElement("div");
        actionDiv.innerHTML = action;
        document.body.appendChild(actionDiv);
    }

    generateChooseOtherPlayersDiv() {
        let playerChooseContainer = document.createElement("div");

        playerNamesInRoom.forEach(name => {
            if (name != player.name) {
                var label = document.createElement("label");
                var description = document.createTextNode(name);
                var checkbox = document.createElement("input");

                checkbox.type = "checkbox";
                checkbox.id = "checkbox_" + name;
                checkbox.value = name;

                label.appendChild(checkbox);
                label.appendChild(description);

                playerChooseContainer.appendChild(label);
                playerChooseContainer.innerHTML += "<br>";
            }
        });

        document.getElementById("actions_container").appendChild(playerChooseContainer);

        return playerChooseContainer;
    }

    getPlayerSelections() {
        let selections = [];

        playerNamesInRoom.forEach(name => {
            if (name != player.name) {
                let id = "checkbox_" + name;
                if (document.getElementById(id).checked) {
                    selections.push(name);
                }
            }
        });

        return selections;
    }

    generateSubmitButton() {
        let submitBtn = document.createElement("button");
        submitBtn.id = "action_submit_button";
        submitBtn.innerText = "Submit";

        let actionsContainer = document.getElementById("actions_container");
        actionsContainer.appendChild(submitBtn);

        return submitBtn;
    }

    generateDoNothingButton() {
        let nothingBtn = document.createElement("button");
        nothingBtn.id = "action_nothing_button";
        nothingBtn.innerText = "Continue sleeping";

        let actionsContainer = document.getElementById("actions_container");
        actionsContainer.appendChild(nothingBtn);

        return nothingBtn;
    }

    // input the string <player.actions.action>
    getActionObj(action) {
        if (player.role.actions) {
            for (let i = 0; i < player.role.actions.length; i++) {
                if (player.role.actions[i].action == action) {
                    return player.role.actions[i];
                }
            }
        }

        return null;
    }

    disableChildren(container) {
        var childNodes = container.getElementsByTagName('*');
        for (var node of childNodes) {
            node.removeAttribute('id');
            node.disabled = true;
        }
    }
}