var player = {
    'name': null,
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
                roleDiv.getElementsByClassName('role-info')[0].innerHTML = 'Count+Actions';
                roleDiv.getElementsByClassName('role-desc')[0].innerHTML = roles[key].description;
                roleDiv.style.display = null;
                rolesDiv.appendChild(roleDiv);
            }
        }
    });

    socket.on('roomPlayersStatus', (res) => {
        playerNamesInRoom = res.playerNames;
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

            displayWaitingRoom();
        }
    });

    socket.on('gameStartStatus', (res) => {
        console.log(res.isReady);
        if (res.isReady == true) {
            document.getElementById('start_game_button').disabled = false;
        } else {
            document.getElementById('start_game_button').disabled = true;
        }
    });

    socket.on('gameUpdate', (msg) => {
        console.log('Role acquired');
        player.role = msg.role;
        let actionsContainerDiv = document.getElementById('actions_container');
        actionsContainerDiv.style.display = null;
        actionsContainerDiv.innerHTML = "<b>" + msg.role.name + " Actions</b>";
    });

    socket.on('chooseActions', (res) => {
        displayPlayers(res.playerNames);

        let actionsContainerDiv = document.getElementById('actions_container');

        player.actions = res.availableActions;
        console.log(player.actions == true);

        if (res.availableActions) {
            res.availableActions.forEach(a => {
                actionsContainerDiv.innerHTML += '<br>';
                let actionBtn = document.createElement("button");
                actionBtn.id = "action_" + a.action;
                actionBtn.innerText = a.action; // add nice action names to json file so we can put them here
                actionsContainerDiv.appendChild(actionBtn);
            });
    
            // Do not do below inside previous loop because functions won't bind to each button properly
            res.availableActions.forEach(a => {
                document.getElementById('action_' + a.action).onclick = () => {game[a.action]()};
            });
        } else {
            actionsContainerDiv.innerHTML += '<br>';
            let actionBtn = document.createElement("button");
            actionBtn.id = "action_none_button";
            actionBtn.innerText = "Continue sleeping";
            actionsContainerDiv.appendChild(actionBtn);
            actionBtn.onclick = () => {
                game.none();
            }
        }

        /* users emit to server: e.g.,
        socket.emit('playerActionChoice')
            {
				"action": "viewPlayerRole",
                "selection": "<playerName>"
			}
        */
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

    // Need to rework this
    // Allow host to select which roles will be in the game
        // add increment/decrement buttons next to each role
        // Do not allow start game until playerCount+3 roles have been chosen (this is a vanilla game rule, can adjust later on).
    document.getElementById('start_game_button').onclick = () => {
        // let chosenRoles = ["robber", "robber", "robber", "robber", "robber"];
        let chosenRoles = ["villager", "villager", "villager", "villager", "villager"];
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

});