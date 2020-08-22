const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Start server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Hash map for clients
const clients = {};
// Hash map for games
const games = {};

let frame = 0;

io.on("connection", socket => {
    const clientId = guid();
    clients[clientId] = {socket: socket, gameCreateSpam: 0};
    clients[clientId].socket.emit("client-id", clientId);

    socket.on("create-game", data => {
        const clientId = data.clientId;

        if (clients[clientId].gameCreateSpam > 10) {
            clients[clientId].socket.emit("create-error", "You created too many games in a short amount if time. Try again later.");
            return;
        }

        const cellCount = data.cellCount;
        const playerCount = data.playerCount;
        const gameId = guid();
        const game = {
            gameId: gameId,
            dropTimer: 360,
            started: false,
            timer: 10,
            cellCount: cellCount,
            playerCount: playerCount,
            currentPlayerCount: 0,
            clients: {},
            cells: {}
        }
    
        games[gameId] = game;

        clients[clientId].gameCreateSpam++;
    
        clients[clientId].socket.emit("create-game", gameId);
    });

    socket.on("join-game", data => {
        const clientId = data.clientId;
        const gameId = data.gameId;
        const game = games[gameId];

        if (game.started) {
            clients[clientId].emit("join-error", "Game is already full.");
            return;
        }

        let color;
        if (game.currentPlayerCount === 0) color = "color0";
        if (game.currentPlayerCount === 1) color = "color1";
        if (game.currentPlayerCount === 2) color = "color2";
        if (game.currentPlayerCount === 3) color = "color3";
        if (game.currentPlayerCount === 4) color = "color4";

        game.clients[clientId] = {id: clientId, color: color}

        game.currentPlayerCount++;
        if (game.currentPlayerCount >= game.playerCount) {
            console.log(`Game ${gameId} started.`)
            game.started = true;
        }

        Object.keys(game.clients).forEach(client => {
            clients[client].socket.emit("join-game", game);
        });
    });

    socket.on("claim-cell", data => {
        const clientId = data.clientId;
        const gameId = data.gameId;
        const cellId = data.cellId;
        const game = games[gameId];

        game.cells[cellId] = game.clients[clientId].color;
    });
});

function updateLoop() {
    // console.log(Object.keys(games).length)
    for (let gameId in games) {
        sendUpdateToClients(gameId)
    }

    setTimeout(updateLoop, 500);
}

function sendUpdateToClients(gameId) {
    if (games[gameId].started) {
        // Send updated game to all clients of the session
        for (let clientId in games[gameId].clients) {
            clients[clientId].socket.emit("game-update", games[gameId]);
        }
        frame++;
        if (frame % 2 === 0) {
            games[gameId].timer--;

            if (games[gameId].timer <= 0) {
                for (let clientId in games[gameId].clients) {
                    clients[clientId].socket.emit("game-over", games[gameId]);
                }
                //Remove from games hash map
                delete games[gameId];
            }
        }
    } else {
        games[gameId].dropTimer--;
        if (games[gameId].dropTimer <= 0) {
            console.log(`Dropping game ${gameId} due to inactivity.`)
            delete games[gameId];
        }
    }
}

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}

updateLoop();