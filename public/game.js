// var playerNames;

// var player = {
//     'name': null,
//     'roomCode': null
// }

class Game {
    constructor() {

    }

    revealAllOfRole() {
        // no info needed
    }

    // generate checkboxes for all other players in room
    viewPlayerRole() {
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

        document.body.appendChild(playerChooseContainer);
    }

    getRandomMiddleRoles() {
        // no info needed
    }

    swap() {
        // decide whether or not to do this action
            // if yes
                // if robber
                    //choose one other player
                // if troublemaker
                    // choose two other players
    }
}