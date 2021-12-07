// Client side

// var player = {
//     'name':
//     'roomCode':
//     'role':
//     'actions':
//          'action':
//          'data':
// }

class Game {
    constructor(socket) {
        this.socket = socket;

    }

    revealAllOfRole() {
        document.getElementById('actions_container').innerHTML = player.actions.actionName;
    }

    // seer
    viewPlayerRole() {
        let actionObj = this.getActionObj("viewPlayerRole");
        
        document.getElementById('actions_container').innerHTML = actionObj.actionName;

        this.generateChooseOtherPlayersDiv();

        let reqCount = 1;

        if (action.count) {
            reqCount = action.count;
        }

        let submitBtn = this.generateSubmitButton();

        submitBtn.onclick = () => {
            let selections = this.getPlayerSelections();

            if (selections.length == reqCount) {
                console.log("Player selection(s) made!");
                submitBtn.disabled = true;
                action.selection = selections;
                this.socket.emit('actionChoice', { "action": actionObj });
            } else {
                console.log(`You must select ${reqCount} player(s).`);
            }
        }
    }

    // seer
    getRandomMiddleRoles() {
        let actionObj = this.getActionObj("getRandomMiddleRoles");

        document.getElementById('actions_container').innerHTML = actionObj.actionName;

        this.socket.emit('actionChoice', { "action": actionObj });
    }

    // robber, troublemaker
    swap() {
        let actionObj = this.getActionObj("swap");

        document.getElementById('actions_container').innerHTML = actionObj.actionName;

        this.generateChooseOtherPlayersDiv();

        let submitBtn = this.generateSubmitButton();

        // Swap roles
        submitBtn.onclick = () => {
            let selections = this.getPlayerSelections();

            let reqCount = 2;

            if (action.target == "self") {
                reqCount = 1;
            }

            if (selections.length == reqCount) {
                console.log("Player selection(s) made!");
                submitBtn.disabled = true;
                action.selection = selections;
                this.socket.emit('actionChoice', { "action": actionObj });
            } else {
                console.log(`You must select ${reqCount} players to swap.`);
            }
        }
    }

    doNothing() {
        let actionObj = this.getActionObj("doNothing");

        // add <br> after this line on HTML, there is no gap b/w this line and the kill voting stuff
        document.getElementById('actions_container').innerHTML = "<b>" + actionObj.actionName + "...</b>";

        this.socket.emit('actionChoice', { "action": actionObj });
    }

    displayActionResult(actionResult) {
        let actionsContainerDiv = document.getElementById("actions_container");

        if (actionResult.members) {
            if (actionResult.count < 2) { // currently unused, not sending client info saying we tried this
                actionsContainerDiv.innerHTML += `<br>You are the only ${actionResult.role} awake.`;
            } else {
                actionsContainerDiv.innerHTML += `<br>Other players with role ${actionResult.role}:<br>`;

                actionResult.members.forEach(name => {
                    if (name != player.name) {
                        actionsContainerDiv.innerHTML += `${name}<br>`;
                    }
                });
            }
        }

        if(actionResult.nameRolePairs) {
            let map = actionResult.nameRolePairs;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    console.log(key + ": " + map[key]);
                }
            }
        }
        
        if (actionResult.middleRoles) {
            actionsContainerDiv.innerHTML += '<br> <b>View Middle Roles</b><br>';
            actionResult.middleRoles.forEach(roleName => {
                actionsContainerDiv.innerHTML += `${roleName}<br>`;
            })
        }
    }

    displayPlayerToKillOptions() {
        let actionsContainerDiv = document.getElementById("actions_container");
        actionsContainerDiv.style.display = null;
        actionsContainerDiv.innerHTML += "<br>";

        this.generateChooseOtherPlayersDiv();

        let submitBtn = this.generateSubmitButton();
        submitBtn.innerText = "Vote to kill";

        submitBtn.onclick = () => {
            let selection = this.getPlayerSelections();
            if (selection.length == 1) {
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
        gameResultsDiv.innerHTML += "<b>Players Killed:</b>";

        if (gameResults.playersToBeKilled) {
            if (gameResults.playersToBeKilled.length == 0) {
                gameResultsDiv.innerHTML += "<br>";
                gameResultsDiv.innerText += "None"
            }
            gameResults.playersToBeKilled.forEach(p => {
                gameResultsDiv.innerText += `<br>${p.name}: ${p.role.name}`;
            })
        }

        if (gameResults.winner) {
            gameResultsDiv.innerHTML += "<br/>";
            gameResultsDiv.innerHTML += `<b>Winning team:</b> ${gameResults.winner}`;
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
                var label= document.createElement("label");
                var description = document.createTextNode(name);
                var checkbox = document.createElement("input");

                checkbox.type = "checkbox";
                checkbox.id = "checkbox_" + name;
                checkbox.value = name;

                label.appendChild(checkbox);
                label.appendChild(description);

                playerChooseContainer.appendChild(label);
            }
        });

        document.getElementById("actions_container").appendChild(playerChooseContainer);
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

    // input the string 'player.actions.action'
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
}