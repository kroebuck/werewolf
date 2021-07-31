document.addEventListener('DOMContentLoaded', function () {
    var socket = io();

    document.getElementById('submit_name').onclick = () => {
        var name = document.getElementById('char_name').value.trim();
        document.getElementById('char_name').value = name;
        if (name != '') {
            socket.emit('nameSubmit', name);
        } else {
            console.log('invalid name');
        }
        
    };

    socket.on('nameRes', (res) => {
        if (res.taken) {
            console.log('Name taken');
        } else {
            document.getElementById('user_create_div').style = "display: none;";
        }
    });

    socket.on('gameStartRes', (res) => {
        if (res.isReady) {
            document.getElementById('start_game').disabled = false;
        }
    });

    document.getElementById('start_game').onclick = () => {
        socket.emit('gameStart', true)
    }
});