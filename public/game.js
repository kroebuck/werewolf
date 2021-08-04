// var player = {
//     'name': null,
//     'roomCode': null,
//     'role': null,
//     'action': null
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

        let reqCount = 1;

        let submitBtn = this.generateSubmitButton();

        submitBtn.onclick = () => {
            let selections = this.getPlayerSelections();

            if (selections.length == reqCount) {
                console.log("Player selection made!");
                // tack on selections to action obj instead?
                let chosenAction = this.player.actions[0];
                chosenAction.selection = selections;
                this.socket.emit('actionChoice', chosenAction);

                this.player.actionSelection = selections;
                this.socket.emit('actionChoice', { "action": "viewPlayerRole", "selection": selections });
            } else {
                console.log("You must select only 1 player.");
            }
        }
    }

    // seer
    getRandomMiddleRoles() {
        console.log("View middle cards.");
        this.socket.emit('actionChoice', { "action": "getRandomMiddleRoles" });
    }

    // robber, troublemaker
    swap() {
        document.getElementById('actions_container').innerHTML = "Swap Roles:<br>";

        this.generateChooseOtherPlayersDiv();

        let submitBtn = this.generateSubmitButton();
        let nothingBtn = this.generateDoNothingButton();

        // Swap roles
        submitBtn.onclick = () => {
            let selections = this.getPlayerSelections();

            let reqCount = 2;

            if (player.actions[0].target == "self") {
                reqCount = 1;
            }

            if (selections.length == reqCount) {
                console.log("Player selections made!");
                submitBtn.disabled = true;
                nothingBtn.disabled = true;
                this.socket.emit('actionChoice', { "action": "swap", "playerSelections": selections });
            } else {
                console.log(`You must select ${reqCount} players to swap.`);
            }
        }

        // Do not swap roles
        nothingBtn.onclick = () => {
            console.log("No swap enacted.");
            submitBtn.disabled = true;
            nothingBtn.disabled = true;
            this.socket.emit('actionChoice', { "action": "none" });
        }
    }

    none() {
        console.log("Do nothing");
        document.getElementById("actions_container").innerHTML = "";
        this.socket.emit('actionChoice', { "action": "none" }); // dont send?
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
}