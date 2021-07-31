var player = {
    'name': null,
    'roomCode': null
}

document.addEventListener('DOMContentLoaded', function () {
    //
    // Socket
    //

    var socket = io();

    socket.on('roles', (roles) => {
        console.log(roles);
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

    socket.on('roomJoinStatus', (res) => {
        if (!res.isValidRoom) {
            console.log("no room corresponding to that code");
        } else if (!res.isValidName) {
            console.log("name is taken by someone in specified room");
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
            console.log('something went wrong. room not created. try again.');
        } else {
            // room created. join room (as host).
            player.name = document.getElementById('char_name').value;
            player.roomCode = res.roomCode;

            displayWaitingRoom();
        }
    });

    socket.on('gameStartRes', (res) => {
        if (res.isReady) {
            document.getElementById('start_game').disabled = false;
        }
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
            console.log('you must enter a name and room code')
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
    document.getElementById('start_game').onclick = () => {
        socket.emit('gameStart', true);
    }

    function displayWaitingRoom() {
        document.getElementById('room_code_div').innerHTML = "Room code: " + player.roomCode;
        document.getElementById('player_name_div').innerHTML = "Name: " + player.name;
        document.getElementById('user_create_div').style.display = 'none';
        document.getElementById('room_wait_div').style.display = null;
        document.getElementById('roles_div').style.display = null;
    }

});