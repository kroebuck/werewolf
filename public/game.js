// var player = {
//     'name': null,
//     'roomCode': null,
//     'role': null,
//     'actions': null
// }

class Game {
    constructor(socket) {
        this.socket = socket;

    }

    revealAllOfRole() {
        // no info needed
    }

    // seer
    viewPlayerRole() {
        document.getElementById('actions_container').innerHTML = "View Player Role:<br>";

        this.generateChooseOtherPlayersDiv();

        let action = this.getActionObj("viewPlayerRole");

        console.log(action);

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
                this.socket.emit('actionChoice', { "action": action });
            } else {
                console.log(`You must select ${reqCount} player(s).`);
            }
        }
    }

    // seer
    getRandomMiddleRoles() {
        document.getElementById('actions_container').innerHTML = "View Middle Roles:<br>";

        let action = this.getActionObj("getRandomMiddleRoles");

        this.socket.emit('actionChoice', { "action": action });
    }

    // robber, troublemaker
    swap() {
        document.getElementById('actions_container').innerHTML = "Swap Roles:<br>";

        this.generateChooseOtherPlayersDiv();

        let action = this.getActionObj("swap");

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
                this.socket.emit('actionChoice', { "action": action });
            } else {
                console.log(`You must select ${reqCount} players to swap.`);
            }
        }
    }

    doNothing() {
        document.getElementById('actions_container').innerHTML = "Do nothing:<br>";

        let action = this.getActionObj("doNothing");

        this.socket.emit('actionChoice', { "action": action });
    }

    displayActionResult(actionResult) {
        let actionsContainerDiv = document.getElementById("actions_container");

        if(actionResult.nameRolePairs) {
            let map = actionResult.nameRolePairs;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    console.log(key + ": " + map[key]);
                }
            }
        }
        
        if (actionResult.middleRoles) {
            actionResult.middleRoles.forEach(role => {
                console.log(role.name);
            })
        }
        
        if (actionResult.members) {
            console.log("The others are:");

            actionResult.members.forEach(name => {
                console.log(name);
            })
        }
    }

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
        nothingBtn.innerText = "Do Nothing";

        let actionsContainer = document.getElementById("actions_container");
        actionsContainer.appendChild(nothingBtn);

        return nothingBtn;
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