// Server side

const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Engine = require('./engine');
const Game = require('./game');

const sessionMiddleware = session({
    secret: "What is the capital of Assyria?",
    resave: false,
    saveUninitialized: false
});

var engine = new Engine();

app.use(express.static('public'));
app.use(sessionMiddleware);

app.get('/', (req, res) => {
    if (req.session && req.session.playerId) {
        // reconnect player
        console.log(req.session.playerId);
    } else {
        // new session
        req.session.playerId = uuidv4();
    }
    res.sendFile(__dirname + '/index.html');
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
    engine.newSocket(socket);
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
