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
                roles[key].amountForGame = 0;
                roleDiv.getElementsByClassName('role-amount')[0].innerHTML = `${roles[key].amountForGame}`;
                roleDiv.getElementsByClassName('role-desc')[0].innerHTML = roles[key].description;
                roleDiv.style.display = null;
                rolesDiv.appendChild(roleDiv);

                // Display role selection buttons to host:
                let roleSelectionButtons = generateRoleSelectionButtons(key);
                let roleSelectionDiv = roleDiv.getElementsByClassName('role-selection')[0];
                roleSelectionButtons.forEach(btn => {
                    roleSelectionDiv.appendChild(btn);
                });
            }
        }
    });

    socket.on('roomPlayersStatus', (res) => {
        playerNamesInRoom = res.playerNames;
        game.playerNames = playerNamesInRoom
        displayPlayers(res.playerNames);
        document.getElementById("required_role_amount").innerHTML = "Roles required: " + game.getRequiredRoleAmount();

        // send host's current role selections to others in room
        if (player.isHost) {
            emitRoleSelections();
        }
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

    // host has made a change to the starting role selection, update values accordingly
    socket.on('startingRolesUpdate', (selections) => {
        updateStartingRoleSelections(selections);
    })

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

        displayRolesInGame(msg.rolesInGame);

        // set up role order
        var roleOrderDiv = document.getElementById("role_order");
        var uniqueRoles = new Set();
        for (var key in Object.keys(msg.rolesInGame)) {
            if (msg.rolesInGame.hasOwnProperty(key)) {  // only include roles present in current game
                let role = msg.rolesInGame[key].name;
                if (!uniqueRoles.has(role)) {   // ignore duplicate roles
                    roleOrderDiv.innerHTML += "<br>" + role;
                    uniqueRoles.add(role);
                }
            }
        }

        player.role = msg.role;

        let playerRoleDiv = document.getElementById("player_role_div");
        playerRoleDiv.style.display = null;
        playerRoleDiv.innerHTML = "Starting Role: " + msg.role.name;

        document.getElementById('role_amount_div').style.display = "none";

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
            actionsContainerDiv.innerHTML += `<br>${msg.playerInfo.data.message}<br>`;
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
            // game.displayActionResult(msg.playerInfo.data);

            let nothingBtn = game.generateDoNothingButton();
            nothingBtn.innerHTML = msg.playerInfo.actions[0].actionName;
            nothingBtn.onclick = () => {
                nothingBtn.disabled = true;
                nothingBtn.style.display = "none";
                let result = msg.playerInfo.data;
                game.displayActionResult({ 'action': result.action, 'result': result });
                socket.emit('actionChoice');
            };
        }
    });

    socket.on('actionResult', (res) => {
        game.displayActionResult(res);
    });

    socket.on('nightEnded', () => {
        document.getElementById("kill_container").innerHTML = "Night has ended. Choose who to kill, if anyone:";

        // display role order
        var roleOrderDiv = document.getElementById("role_order");
        roleOrderDiv.style.display = null;
        // for (var key in roles) {
        //     // only host has amountForGame
        //     if (roles.hasOwnProperty(key) && roles[key].amountForGame > 0) {
        //         roleOrderDiv.innerHTML += "<br>" + roles[key].name;
        //     }
        // }
        roleOrderDiv.innerHTML += "<br>";

        game.displayPlayerToKillOptions();
    });

    socket.on('gameResults', (msg) => {
        // 'gameResults', { "playersToBeKilled": String[], "winner": String, "finalRoles": String[] }
        console.log("Winner(s): " + msg.winners);
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

        console.log(name == '');

        if (name != '' && roomCode != '') {
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
        game.setChosenRoles(roles);

        if (game.checkIsGameReady()) {
            document.getElementById("game_start_div").style.display = "none";
            document.getElementById('start_game_button').disabled = true;
            
            socket.emit('gameStart', { 'roles': game.chosenRoles});
        } else {
            console.log("Start conditions not met.");
        }

        // Preset role choices
        // let chosenRoles = ["robber", "werewolf", "robber", "robber", "werewolf"];
        // let chosenRoles = ["seer", "seer", "seer", "seer", "seer"];
        // let chosenRoles = ["werewolf", "werewolf", "villager", "villager", "villager"];
        // let chosenRoles = ["werewolf", "werewolf", "werewolf", "werewolf", "werewolf"];

        // document.getElementById("game_start_div").style.display = "none";
        // document.getElementById('start_game_button').disabled = true;
        
        // socket.emit('gameStart', { 'roles': chosenRoles});
    }

    function displayWaitingRoom() {
        document.getElementById('room_code_div').innerHTML = "Room code: " + player.roomCode;
        document.getElementById('player_name_div').innerHTML = "Name: " + player.name;
        document.getElementById('user_create_div').style.display = 'none';
        document.getElementById('room_wait_div').style.display = null;
        document.getElementById('role_amount_div').style.display = null;
        document.getElementById('roles_div').style.display = null;
    }

    function displayPlayers(playerNames) {
        document.getElementById('room_players_container').style.display = null;
        let roomPlayersDiv = document.getElementById('room_players_list');
        roomPlayersDiv.innerHTML = "";
        roomPlayersDiv.innerHTML = playerNames.join("<br>");
    }

    function displayRolesInGame(rolesInGame) {
        var rolesDiv = document.getElementById('roles_div');
        rolesDiv.innerHTML = "<b>Roles in game</b>";

        // Get counts of roles
        var map = {}
        rolesInGame.forEach(role => {
            let key = role.name;
            if (map.hasOwnProperty(key)) {
                map[key] += 1;
            } else {
                map[key] = 1;
            }
        });

        // Display role counts
        Object.keys(map).forEach(key => { 
            var count = map[key];
            rolesDiv.innerHTML += "<br>" + count + " " + key;
        })
    }

    // The input parameter 'role' is the 'outermost' key for the role in 'roles.json'. To avoid confusion, the value for this key is:
        // "id": ,
        // "name",
        // etc.
    function generateRoleSelectionButtons(role) {
        let addBtn = document.createElement("button");
        addBtn.id = `${role}_add_button`;
        addBtn.innerText = "+";

        let roleAmountDiv = document.getElementById('current_role_amount');
        roleAmountDiv.innerHTML = `Roles selected: 0`;

        // Increase role count by 1
        addBtn.onclick = () => {
            roles[role].amountForGame++;
            let roleDiv = document.getElementById(`role_${role}`);
            roleDiv.getElementsByClassName("role-amount")[0].innerHTML = roles[role].amountForGame;
            roleAmountDiv.innerHTML = `Roles selected: ${getRoleSelectionCount()}`;
            emitRoleSelections();
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
                roleAmountDiv.innerHTML = `Roles selected: ${getRoleSelectionCount()}`;
                emitRoleSelections()
            } else {
                console.log("There are already 0 of that role");
            }
        }

        return [addBtn, rmvBtn];
    }

    function emitRoleSelections() {
        var selections = {};

        for (var key in roles) {
            if (roles.hasOwnProperty(key)) {
                let role = roles[key];
                selections[role.id] = role.amountForGame;
            }
        }

        socket.emit('startingRoleSelection', selections);
    }

    function updateStartingRoleSelections(selections) {
        var count = 0;
        for (var key in selections) {
            // Update amount of each role selected
            let roleDiv = document.getElementById(`role_${key}`);
            roleDiv.getElementsByClassName("role-amount")[0].innerHTML = selections[key];

            // Update total current role amount
            count += selections[key];
        }
        document.getElementById("current_role_amount").innerHTML = "Roles selected: " + count;
    }

    function getRoleSelectionCount() {
        var count = 0;
        for (var key in roles) {
            if (roles.hasOwnProperty(key)) {
                count += roles[key].amountForGame;
            }
        }
        return count;
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