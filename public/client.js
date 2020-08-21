const createGameButton = document.querySelector("#create-game");
const joinGameButton = document.querySelector("#join-game");
const joinCodeInput = document.querySelector("#join-code");
const cellCountText = document.querySelector("#cell-count-text");
const cellCountSlider = document.querySelector("#cell-count");
const joinCodeOutput = document.querySelector("#join-code-output");

let clientId = null;
let ws = new WebSocket("ws://localhost:3000");
ws.onmessage = message => {
    const response = JSON.parse(message.data);
    if (response.method === "connect") {
        clientId = response.clientId;
    } else if (response.method === "create") {
        console.log(`Game created! ID: ${response.game.id}`);
        joinCodeOutput.textContent = response.game.id;
    }
};

createGameButton.addEventListener("click", () => {
    const cellCount = cellCountSlider.value;
    const payLoad = {
        method: "create",
        clientId: clientId,
        cellCount: cellCount
    };
    ws.send(JSON.stringify(payLoad));
});

joinGameButton.addEventListener("click", () => {
    const gameId = joinCodeInput.value;
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