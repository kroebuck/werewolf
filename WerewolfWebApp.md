# Werewolf web app

## Languages/libraries/frameworks/etc. used

- **Javascript**

  - **Node.js** - A back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser. It is used for server-side programming, and primarily deployed for non-blocking, event-driven servers, such as traditional web sites and back-end API services
    - **Express** - A back end web application framework for Node.js. Express can be used to create JSON APIs, Server-side rendered web applications, or Microservices.
  - **Socket.IO** - A library that enables real-time, bidirectional and event-based communication between the browser and the server. It consists of: 
    - A Node.js server
    - A Javascript client library for the browser (which can be also run from Node.js).

- **HTML**

- **CSS**

  



## Project Overview

### Setting up the webpage

First, let us set up a simple HTML webpage by making use of Express. Create an `index.js` file:

```javascript
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
```

What does this do? Express initializes `app` to be a function handler that can be supplied to an HTTP server (which we do on line 4). Then, define a route handler `/` that gets called when we hit the home website. Finally, we make the HTTP server listen on port 3000. If met with "Error: Cannot find module 'express'", enter

```console
npm install express
```

in the Terminal while in the project directory to install Express.

Right now, all that the webpage will display is "Hello world." We'll want much more displayed, so we will create a `index.html` file and refactor the route handler to

```javascript
app.get('/', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});
```

### Integrating Socket.IO

Once the module is installed and the dependency added to `package.json`, we will update `index.js`:

```javascript
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('user connected');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
```

Next, we need to add

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();
</script>
```

to `index.html` before the `<\body>` tag. As with Express earlier, if met with "Error: Cannot find module 'socket.io'", enter

```console
npm install socket.io
```

in the Terminal while in the project directory to install Socket.io.

### Managing the players and rooms

Players will initially see a page that will allow them to either start a new room or join an existing room (by typing in a valid room code - A randomized sequence of four capitalized letters). The way all of these rooms is handled is through `engine.js`. When `index.js` is executed, an instance of the `engine` class is initialized. Then, we listen on the `connection` event for incoming sockets and call the `newSocket(socket)` method of the `engine` class. This method listens for a slew of events coming in from the client-side including:

- request for room creation
- request to join a room
- player disconnect
- host's request to start the game
- player choice of action during the night
- vote for player to kill

### The player class

A class with a handful of properties and some setters for them. Properties include:

- `socket` (required parameter for constructor)
- `isHost`
- `room`
- `name`
- `role`
- `actionChoice`
- `killVotes` (set in the `game.js` method `setKillVote(playerName)`)

### The room class

The room class has the following properties:

- `players` - An array of player objects corresponding to the people in the room.
- `playerCount` - We could just use the `players.length` property, but accessing a local variable will often be faster.
- `game` - Reference to the game object (see "Setting up and carrying out a game of werewolf" section) being used.
- `completeFunctions` - An array of functions to be called at some later specified time.
  - When `engine.js` creates a new room, it calls `room.onComplete(cbFunc)`, where `cbFunc` indicates some callback function, and uses `engine.deleteRoom()` as the argument. Why do this? When a room is to be deleted, we want to remove the references to it in `engine.rooms` and `player.room`. The method responsible for shutting down the room really should be a method in `room.js`. Indeed, `room.shutdownRoom()` sets all players' room to null and then calls each function in the `completeFunctions` array (one of which splices out the room from the `engine.rooms` array).
- `code` - The password players must submit to enter the room (rename to password?)

There are, of course, methods accompanying many of these properties that add a player, remove a player, check if a player name is already in use, etc.

### Setting up and carrying out a game of werewolf

Information about all of the possible roles comes from the file `roles.json`. On game start, `engine.js` passes `game.js`:

- Roles to be used
- Player objects

and calls the `game.js` method `startGame()`. This method does a few things:

- Checks if the amount of roles is appropriate for the given player count and then randomly assigns a role to each player.
- Emits a `gameUpdate` event to each player with their role and an array of the player names present in the game.
- Calls `generateQueue()`, which organizes the `queue` array, which is comprised of the players of the game, based on the order in which each role should act during the night.
- Finally, it calls `startNight()`. This method emits a `chooseActions` event to each player containing their role action info (and if the action is preprocessable (see section about this below), the data about the action outcome).

From here, the server needs to wait for players to make their action choices and emit an `actionChoice` event back to the server. To allow the players to do this, `werewolf.js` creates a button for each action the player has to choose from. On click, the corresponding method in `game.js` (client-side) is called and, once all the info needed is collected, emits an `actionChoice` event to the server. The event `actionChoice` is listened for in `engine.js` and, once received, sets the player's action choice by calling the setter method for it in `player.js`. Once `engine.js` has received all of the players' action choices, `game.continueNight()` is called.

The method `continueNight()` loops through the queue and calls `doAction(player, actionChoice)`, which handles the calling of any method(s) the role action requires. From these method calls, `doAction` is returned (if applicable) information about the action outcome in JSON-format, which is in turn what `doAction` returns to `continueNight()`. The result of the action is then emitted to the client. Once all players have been given the result of their action, the server emits a `nightEnded` event.

On the client-side, `werewolf.js` listens for `actionResult` and has `game.displayActionResult()` update the HTML. Also, `werewolf.js` listens for `nightEnded` and has `game.displayPlayerToKillOptions()` present the users with a list of the other players from which to vote. Once `engine.js` has received every vote, it has `game.js` tally up the votes and determine which players are to be killed, which is then used to determine the winning team. The winning team is returned to `engine.js`, and is sent to the players as a `gameResults` event. Once received, the client-side JavaScript files display the game results.

### Preprocessing actions

Some actions do not require player input to be processed, and therefore can be *preprocessed*. For example, the werewolf's action is to reveal all other players who are a werewolf. If no other players are a werewolf, then instead view a role card in the middle. There is no element of player choice here. They MUST be shown other werewolves, else they MUST view a random middle role card.

Currently, any preprocessable actions are processed during `game.startNight()` and then the server sends the clients their action info. To make this save time, it would probably be better to do the preprocessing between sending the clients their action choice(s) and when they send the server back their decision.





## Ideas for the webapp
- Add rest of roles to roles.json
	- Will need to implement functionality throughout app as well
- Default role selections button
	- Fill in roles according to player count:
		- 3 players: 2 werewolves, seer, robber, troublemaker, villager
		- 4 players: +1 villager
		- 5 players: +2 villagers

### Timer for voting

The players shouldn't need more than a few minutes (say 5?).

What to do if timer runs out and no vote is cast?

- No one gets killed
- Base killing off votes that WERE cast

### Improved game results
Group players by team at end and nicely display winning team(s) and losing team(s)

Send clients back info about how many votes each player got and who voted for them.

Keep track of the original roles, each action performed, and the end roles so that we can display all of this to the users at the end. It would be cool to see the progression of the roles when discussing reasons for voting after a round. Perhaps forward/back buttons to flip through each action at their own pace.

### Sessions

Instead of simply kicking a player from the room if they disconnect, implement sessions so that the player has some amount of time to rejoin before `engine.js` kicks them out.

### Improve the presentation of the HTML

Use a canvas?

PixiJS?


### ISSUES
- Update required role amount when player joins/leaves room
- VALIDATE USER CHOICES ON BACKEND!
	- Possible for a player to tell server to do an action from another class!
	- or, for example, tell seer action to view EVERYONE's roles



## How to run the program

The usual way to run a Node.js program is to run the `node` globally available command (once you install Node.js) and pass the name of the file you want to execute. More explicitly, for us this will look like:

1) Open Terminal
2) Change directory to folder containing index.js
3) Enter  `npm start`
	- This is a script that runs `node index.js` ``
4) Go to the designated web address
   - If local, go to `localhost:3000`
5) To exit, press `ctrl+c` in Terminal
