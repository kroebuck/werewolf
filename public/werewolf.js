// Client side

var player = {
    'name': null,
    'isHost': false,
    'roomCode': null,
    'role': null,
    'actions': null
}

var playerNamesInRoom;

var game;
var roles;

document.addEventListener('DOMContentLoaded', function () {
    //
    // Socket
    //

    var socket = io();

    game = new Game(socket);

    socket.on('roles', (r) => {
        roles = r;
        let rolesDiv = document.getElementById('roles_div');
        rolesDiv.innerHTML = '';
        
        for (var key in roles) {
            if (roles.hasOwnProperty(key)) {
                let roleDiv = document.getElementById('role_template').cloneNode(true);
                roleDiv.id = "role_" + key;
                roleDiv.getElementsByClassName('role-name')[0].innerHTML = '<b>' + roles[key].name +'<b>';
                //roleDiv.getElementsByClassName('role-info')[0].innerHTML = 'Count+Actions';
                roles[key].amountForGame = 0;
                roleDiv.getElementsByClassName('role-amount')[0].innerHTML = `${roles[key].amountForGame}`;

                // only host should see these buttons
                let roleSelectionButtons = generateRoleSelectionButtons(key);
                let roleSelectionDiv = roleDiv.getElementsByClassName('role-selection')[0];
                roleSelectionButtons.forEach(btn => {
                    roleSelectionDiv.appendChild(btn);
                });

                roleDiv.getElementsByClassName('role-desc')[0].innerHTML = roles[key].description;
                roleDiv.style.display = null;
                rolesDiv.appendChild(roleDiv);
            }
        }
    });

    socket.on('roomPlayersStatus', (res) => {
        playerNamesInRoom = res.playerNames;
        game.playerNames = playerNamesInRoom
        displayPlayers(res.playerNames);
    });

    socket.on('roomJoinStatus', (res) => {
        if (!res.isValidRoom) {
            console.log("No room corresponding to that code.");
        } else if (!res.isValidName) {
            console.log("Name is taken by someone in specified room. Try another name.");
        }

        if (res.isValidRoom && res.isValidName) {
            console.log("Room joined.");
            player.name = document.getElementById('char_name').value;
            player.roomCode = document.getElementById('room_code').value;

            displayWaitingRoom();
        }
    });

    socket.on('roomCreateStatus', (res) => {
        if (!res.wasRoomCreated) {
            console.log('Something went wrong, room not created. Try again.');
        } else {
            // room created. join room (as host).
            document.getElementById('game_start_div').style.display = null;
            player.name = document.getElementById('char_name').value;
            player.roomCode = res.roomCode;
            player.isHost = true;
            displayRoleSelectionOptions();

            displayWaitingRoom();
        }
    });

    socket.on('gameStartStatus', (res) => {
        if (res.isReady == true) {
            document.getElementById('start_game_button').disabled = false;
        } else {
            document.getElementById('start_game_button').disabled = true;
        }
    });

    // this event occurs before 'chooseActions'.
    // We could just preprocess any actions that require it and then send one single role/action event down.
    socket.on('gameUpdate', (msg) => {
        playerNamesInRoom = msg.playerNames;
        displayPlayers(msg.playerNames);

        player.role = msg.role;
        console.log('Role acquired: ' + msg.role.name);

        let playerRoleDiv = document.getElementById("player_role_div");
        playerRoleDiv.style.display = null;
        playerRoleDiv.innerHTML = "Role: " + msg.role.name;

        document.getElementById('roles_div').style.display = "none";

        let actionsContainerDiv = document.getElementById('actions_container');
        actionsContainerDiv.style.display = null;
        actionsContainerDiv.innerHTML = "<b>" + msg.role.name + " Actions</b>";
    });

    // Preprocess actions and then combine this with 'gameUpdate' event?
    socket.on('chooseActions', (msg) => {
        let actionsContainerDiv = document.getElementById('actions_container');
        actionsContainerDiv.style.display = null;

        // if a message from 'roles.json' is attached, display it
        if (msg.playerInfo.data.message) {
            actionsContainerDiv.innerHTML += `<br>${msg.playerInfo.data.message}`;
        }

        // Display actions to player. Initial if statement checks if action is preprocess or not. If it is, it will have a 'data' key.
        if (Object.keys(msg.playerInfo.data).length === 0) {
            player.actions = msg.playerInfo.actions;

            if (player.actions) {
                player.actions.forEach(a => {
                    actionsContainerDiv.innerHTML += '<br>';
                    let actionBtn = document.createElement("button");
                    actionBtn.id = "action_" + a.action;
                    actionBtn.innerText = a.actionName;
                    actionsContainerDiv.appendChild(actionBtn);
                });
            
                // Do not do below inside previous loop because functions won't bind to each button properly
                player.actions.forEach(a => {
                    document.getElementById('action_' + a.action).onclick = () => {game[a.action]()};
                });
            }
        } else {
            // data from pre-processed actions
            game.displayActionResult(msg.playerInfo.data);

            let nothingBtn = game.generateDoNothingButton();
            nothingBtn.onclick = () => {
                nothingBtn.disabled = true;
                nothingBtn.style.display = "none";
                socket.emit('actionChoice');
            };
        }
    });

    socket.on('actionResult', (res) => {
        game.displayActionResult(res);
    });

    socket.on('nightEnded', () => {
        document.getElementById("kill_container").innerHTML = "Night has ended. Choose who to kill, if anyone:";
        game.displayPlayerToKillOptions();
    });

    socket.on('gameResults', (msg) => {
        // 'gameResults', { "playersToBeKilled": playersToBeKilled, "winner": winner }
        console.log(msg.winner + " wins");
        game.displayGameResults(msg);
    });

    //
    // Bindings
    //

    document.getElementById('join_room').onclick = () => {
        var name = document.getElementById('char_name').value.trim();
        document.getElementById('char_name').value = name;

        var roomCode = document.getElementById('room_code').value.trim();
        document.getElementById('room_code').value = roomCode;

        if (name != '' || roomCode != '') {
            socket.emit('roomJoin', { 'name': name, 'roomCode': roomCode });
        } else {
            console.log('You must enter a name and room code.')
        }
    };

    document.getElementById('create_room').onclick = () => {
        var name = document.getElementById('char_name').value.trim();
        document.getElementById('char_name').value = name;
        if (name != '') {
            socket.emit('roomCreate', {'name': name});
        } else {
            console.log('You must enter a name.');
        }
    };

    document.getElementById('start_game_button').onclick = () => {
        //game.setChosenRoles(roles);

        if (game.checkIsGameReady()) {
            document.getElementById("game_start_div").style.display = "none";
            document.getElementById('start_game_button').disabled = true;

            console.log(game.chosenRoles);
            
            socket.emit('gameStart', { 'roles': game.chosenRoles});
        } else {
            console.log("Start conditions not met.");
        }

        // let chosenRoles = ["robber", "werewolf", "robber", "robber", "werewolf"];
        // let chosenRoles = ["seer", "seer", "seer", "seer", "seer"];
        let chosenRoles = ["werewolf", "werewolf", "villager", "villager", "villager"];
        // let chosenRoles = ["werewolf", "werewolf", "werewolf", "werewolf", "werewolf"];

        document.getElementById("game_start_div").style.display = "none";
        document.getElementById('start_game_button').disabled = true;
        
        socket.emit('gameStart', { 'roles': chosenRoles});
    }

    function displayWaitingRoom() {
        document.getElementById('room_code_div').innerHTML = "Room code: " + player.roomCode;
        document.getElementById('player_name_div').innerHTML = "Name: " + player.name;
        document.getElementById('user_create_div').style.display = 'none';
        document.getElementById('room_wait_div').style.display = null;
        document.getElementById('roles_div').style.display = null;
    }

    function displayPlayers(playerNames) {
        document.getElementById('room_players_container').style.display = null;
        let roomPlayersDiv = document.getElementById('room_players_list');
        roomPlayersDiv.innerHTML = "";
        roomPlayersDiv.innerHTML = playerNames.join("<br>");
    }

    // The input parameter 'role' is the 'outermost' key for the role in 'roles.json'. To avoid confusion, the value for this key is:
        // "id": ,
        // "name",
        // etc.
    function generateRoleSelectionButtons(role) {
        let addBtn = document.createElement("button");
        addBtn.id = `${role}_add_button`;
        addBtn.innerText = "+";

        // Increase role count by 1
        addBtn.onclick = () => {
            roles[role].amountForGame++;
            let roleDiv = document.getElementById(`role_${role}`);
            roleDiv.getElementsByClassName("role-amount")[0].innerHTML = roles[role].amountForGame;
        }

        let rmvBtn = document.createElement("button");
        rmvBtn.id = `${role}_rmv_button`;
        rmvBtn.innerText = "-";

        // Descrease role count by 1
        rmvBtn.onclick = () => {
            if (roles[role].amountForGame > 0) {
                roles[role].amountForGame--;
                let roleDiv = document.getElementById(`role_${role}`);
                roleDiv.getElementsByClassName("role-amount")[0].innerHTML = roles[role].amountForGame;
            } else {
                console.log("There are already 0 of that role");
            }
        }

        return [addBtn, rmvBtn];
    }

    function displayRoleSelectionOptions() {
        for (var key in roles) {
            if (roles.hasOwnProperty(key)) {
                let roleDiv = document.getElementById(`role_${key}`);
                roleDiv.getElementsByClassName("role-selection")[0].style.display = null;
            }
        }
    }
});