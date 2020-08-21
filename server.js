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
            const gameId = guid();

            games[gameId] = {
                id: gameId,
                cellCount: cellCount
            };

            const payLoad = {
                method: "create",
                game: games[gameId]
            };

            clients[clientId].connection.send(JSON.stringify(payLoad));
        } else if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;

            console.log(`Client ${clientId} wants to join game ${gameId}`);
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


// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}