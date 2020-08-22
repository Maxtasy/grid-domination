const createGameButton = document.querySelector("#create-game");
const joinGameButton = document.querySelector("#join-game");
const joinCodeInput = document.querySelector("#join-code");
const cellCountText = document.querySelector("#cell-count-text");
const cellCountSlider = document.querySelector("#cell-count");
const playerCountText = document.querySelector("#player-count-text");
const playerCountSlider = document.querySelector("#player-count");
const joinCodeOutput = document.querySelector("#join-code-output");
const gameSetupContainer = document.querySelector(".game-setup");
const playersContainer = document.querySelector(".players");
const cellsContainer = document.querySelector(".cells-container");
const joinCodeRunningGame = document.querySelector("#join-code-running-game");
const errorText = document.querySelector(".error-text");
const timerText = document.querySelector(".timer-text");

let clientId = null;
let clientColor = null;
let gameId = null;
let gridBuilt = false;

let ws = new WebSocket("ws://localhost:3000");

ws.onmessage = message => {
    const response = JSON.parse(message.data);

    if (response.method === "connect") {
        clientId = response.clientId;
    } else if (response.method === "create") {
        gameId = response.game.id;
        joinCodeOutput.textContent = gameId;
    } else if (response.method === "join") {
        game = response.game;
        clientColor = game.clients[clientId].color;
        playersContainer.innerHTML = "";

        for (let key in game.clients) {
            const div = document.createElement("div");
            div.classList.add("player", game.clients[key].color);
            if (key === clientId) div.textContent = "You";
            playersContainer.appendChild(div);
        }

        gameSetupContainer.style.display = "none";
        joinCodeRunningGame.textContent = gameId;

        if (!gridBuilt) {
            for (let i = 0; i < game.cellCount; i++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.id = i;
                cell.addEventListener("click", (e) => {
                    if (game.started) {
                        claimCell(e.target)
                    }
                });
                cellsContainer.appendChild(cell);
            }
            gridBuilt = true;
        }
    } else if (response.method === "update") {
        const game = response.game;
        for (let cellIndex in game.cells) {
            if (game.cells[cellIndex]) {
                document.querySelector(`[data-id='${cellIndex}']`).dataset.owner = game.cells[cellIndex];
            }
        }
        timerText.textContent = game.timer;
    } else if (response.method === "error-message") {
        errorText.textContent = response.text;
    }
};

function claimCell(cell) {
    const cellId = cell.dataset.id;

    cell.dataset.owner = clientColor;

    const payLoad = {
        method: "claimCell",
        gameId: gameId,
        clientId: clientId,
        cellId: cellId
    };
    ws.send(JSON.stringify(payLoad))
}

createGameButton.addEventListener("click", () => {
    const cellCount = cellCountSlider.value;
    const playerCount = playerCountSlider.value;
    const payLoad = {
        method: "create",
        clientId: clientId,
        cellCount: cellCount,
        playerCount: playerCount
    };
    ws.send(JSON.stringify(payLoad));
});

joinGameButton.addEventListener("click", () => {
    if (gameId === null) gameId = joinCodeInput.value;
    const payLoad = {
        method: "join",
        gameId: gameId,
        clientId: clientId
    };
    ws.send(JSON.stringify(payLoad));
});

cellCountSlider.addEventListener("input", (e) => {
    const value = e.target.value;
    cellCountText.textContent = value;
});

playerCountSlider.addEventListener("input", (e) => {
    const value = e.target.value;
    playerCountText.textContent = value;
});

joinCodeInput.value = "";