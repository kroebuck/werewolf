document.addEventListener('DOMContentLoaded', function () {
    var socket = io();

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

    socket.on('roomJoinStatus', (res) => {
        if (!res.isValidRoom) {
            console.log("no room corresponding to that code");
        } else if (!res.isValidName) {
            console.log("name is taken by someone in specified room");
        }

        if (res.isValidRoom && res.isValidName) {
            console.log("Room joined.");
        }
    });

    document.getElementById('create_room').onclick = () => {
        var name = document.getElementById('char_name').value.trim();
        document.getElementById('char_name').value = name;
        if (name != '') {
            socket.emit('roomCreate', {'name': name});
        } else {
            console.log('You must enter a name.');
        }
    };

    socket.on('roomCreateStatus', (res) => {
        if (!res.wasRoomCreated) {
            console.log('something went wrong. room not created. try again.');
        } else {
            // room created. join room (as host).
            document.getElementById('room_code_div').style.visibility = "visible";
            document.getElementById('room_code_div').innerHTML = "Room code: " + res.roomCode;
        }
    })

    // Need to rework this
    document.getElementById('start_game').onclick = () => {
        socket.emit('gameStart', true);
    }

    socket.on('gameStartRes', (res) => {
        if (res.isReady) {
            document.getElementById('start_game').disabled = false;
        }
    });
});