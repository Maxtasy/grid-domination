const http = require("http");
const express = require("express");
const websocketServer = require("websocket").server;
// const PORT = process.env.PORT || 3000;
const PORT_1 = 3000;
const PORT_2 = 3001;

const app = express();

// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
// });

app.use(express.static(__dirname + "/public"));

app.listen(PORT_2, () => {
    console.log(`Listening on http port ${PORT_2}`);
});

const httpServer = http.createServer();

httpServer.listen(PORT_1, () => {
    console.log(`Listening on port ${PORT_1}`);
});

// Hash map for clients
const clients = {};

// Hash map for games
const games = {};

const wsServer = new websocketServer({
    httpServer: httpServer
});

wsServer.on("request", request => {
    // A client connects to the server
    const connection = request.accept(null, request.origin);

    connection.on("open", () => console.log("Opened a connection."));
    connection.on("close", () => console.log("Closed a connection."));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);
        
        if (result.method === "create") {
            const clientId = result.clientId;
            const cellCount = result.cellCount;
            const playerCount = result.playerCount;
            const gameId = guid();

            const cells = [];
            for (let i = 0; i < cellCount; i++) {
                cells.push(null);
            }

            games[gameId] = {
                id: gameId,
                started: false,
                timer: 30,
                cellCount: cellCount,
                playerCount: playerCount,
                clients: {},
                cells: cells
            };

            const payLoad = {
                method: "create",
                game: games[gameId]
            };

            clients[clientId].connection.send(JSON.stringify(payLoad));
        } else if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            const playerCount = game.playerCount;
            const currentPlayerCount = Object.keys(game.clients).length;

            console.log(`Client ${clientId} wants to join game ${gameId}`);

            if (!game || currentPlayerCount >= playerCount) {
                // Game already full
                const payLoad = {
                    method: "error-message",
                    text: "Game already full."
                };
                clients[clientId].connection.send(JSON.stringify(payLoad));
                return;
            }

            let color;
            if (currentPlayerCount === 0) color = "color0";
            if (currentPlayerCount === 1) color = "color1";
            if (currentPlayerCount === 2) color = "color2";
            if (currentPlayerCount === 3) color = "color3";
            if (currentPlayerCount === 4) color = "color4";

            game.clients[clientId] = {id: clientId, color: color};
        
            const payLoad = {
                method: "join",
                game: game
            };

            if (currentPlayerCount === playerCount - 1) {
                console.log(`Starting game ${gameId}`);
                game.started = true;
                sendGameUpdateToAllClients();
            }

            for (let key in game.clients) {
                clients[key].connection.send(JSON.stringify(payLoad));
            }
        } else if (result.method === "claimCell") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            const cellId = result.cellId;
            const color = game.clients[clientId].color;
        
            game.cells[cellId] = color;
        }
    });

    // Generate a new Client ID and store clients connection in array
    const clientId = guid();
    clients[clientId] = {
        connection: connection,
    };

    const payLoad = {
        method: "connect",
        clientId: clientId
    };

    clients[clientId].connection.send(JSON.stringify(payLoad));
});
let frame = 0;
// Gets called each time a new game starts, which is bad
function sendGameUpdateToAllClients() {
    for (let gameId in games) {
        game = games[gameId];
        if (!game.started) continue;
        const payLoad = {
            method: "update",
            game: game
        };
        for (let clientId in games[gameId].clients) {
            clients[clientId].connection.send(JSON.stringify(payLoad));
        }

        if (frame % 2 === 0) game.timer--;

        if (game.timer <= 0) {
            console.log("time ran out")
        }
    }

    frame++;
    setTimeout(sendGameUpdateToAllClients, 500);
}

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}