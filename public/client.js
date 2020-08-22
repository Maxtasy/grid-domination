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
const gameInfoText = document.querySelector(".game-info-text");
const createErrorText = document.querySelector(".create-error-text");

let clientId = null;
let gameId = null;
let game;
let clientColor = null;
let gridBuilt = false;

const socket = io();

socket.on("client-id", id => {
    clientId = id;
});

socket.on("create-game", id => {
    gameId = id;
    joinCodeOutput.textContent = gameId;
});

socket.on("join-game", game => {
    gameId = game.gameId;
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
                claimCell(e.target)
            });
            cellsContainer.appendChild(cell);
        }
        gridBuilt = true;
    }
});

socket.on("join-error", text => {
    errorText.textContent = text;
});

socket.on("create-error", text => {
    createErrorText.textContent = text;
    createGameButton.style.cursor = "not-allowed";
});

socket.on("game-update", game => {
    for (let cellIndex in game.cells) {
        if (game.cells[cellIndex]) {
            document.querySelector(`[data-id='${cellIndex}']`).dataset.owner = game.cells[cellIndex];
        }
    }
    gameInfoText.textContent = game.timer;
});

socket.on("game-over", game => {
    let winner;
    let most = 0;
    Object.keys(game.clients).forEach(player => {
        const playerColor = game.clients[player].color;
        const ownedCells = document.querySelectorAll(`[data-owner='${playerColor}']`).length;

        if (ownedCells > most) {
            winner = playerColor;
            most = ownedCells;
        }
    });
    gameInfoText.textContent = `${winner} won the round.`;
});

function claimCell(cell) {
    const cellId = cell.dataset.id;

    cell.dataset.owner = clientColor;

    const data = {
        gameId: gameId,
        clientId: clientId,
        cellId: cellId
    };
    socket.emit("claim-cell", data)
}

createGameButton.addEventListener("click", () => {
    const cellCount = cellCountSlider.value;
    const playerCount = playerCountSlider.value;
    const data = {
        clientId: clientId,
        cellCount: cellCount,
        playerCount: playerCount
    };
    socket.emit("create-game", data);
});

joinGameButton.addEventListener("click", () => {
    const joinCode = joinCodeInput.value;
    if (!gameId && !joinCode) return;
    
    let id;
    if (joinCode) id = joinCode;
    else id = gameId;

    const data = {
        clientId: clientId,
        gameId: id
    };
    socket.emit("join-game", data);
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