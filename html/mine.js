var FULL_WIDTH = 30;
var FULL_HEIGHT = 16;

var board = [];
var width = 0;
var height = 0;
var numMines = 0;
var numRemaining = 0;
var gameOver = false;
var gameStarted = false;
var timerId = null;

class Space {

    _id = "";
    isValid = false; // Space's position is within the board?
    isMine = false; // Is the Space a mine?
    isRevealed = false; // Number/blank is visible?
    isFlagged = false; // Marked as having a mine?
    row = -1; // Board position
    col = -1; // Board position

    constructor(_idNum) {
        this._id = "space-" + _idNum;
    }

    setIsValid(isValid) {
        this.isValid = isValid;
    }

    setIsMine(isMine) {
        this.isMine = isMine;
    }

    setIsRevealed(isRevealed) {
        this.isRevealed = isRevealed;
    }

    setIsFlagged(isFlagged) {
        this.isFlagged = isFlagged;
    }

    setRow(row) {
        this.row = row;
    }

    setCol(col) {
        this.col = col;
    }

    getId() {
        return this._id;
    }

    getIsValid() {
        return this.isValid;
    }

    getIsMine() {
        return this.isMine;
    }

    getIsRevealed() {
        return this.isRevealed;
    }

    getIsFlagged() {
        return this.isFlagged;
    }

    getRow() {
        return this.row;
    }

    getCol() {
        return this.col;
    }

    getElement() {
        return document.getElementById(this._id);
    }

    toHtml() {
        return "<td class='space " + (this.isValid ? "valid-space" : "invalid-space") + "' id='" + this._id + "'></td>";
    }
}

function startGame() {

    gameOver = false;
    gameStarted = false;

    // Determine difficulty
    var difficultyDropDown = document.getElementById("difficulty-dropdown");
    if (!difficultyDropDown.innerHTML.includes("(")) {
        alert("Please choose a difficulty");
        return;
    }

    // Get number of mines from difficulty dropdown
    numMines = difficultyDropDown.innerHTML.match(/([0-9]+) mines/)[1];
    numRemaining = numMines;
    document.getElementById("flagged-div-text").innerHTML = padZeros(numRemaining, 2);

    // Set 2-D array of spaces, inlcuding marking each space as valid or invalid
    var size = difficultyDropDown.innerHTML.split("(")[1].split(")")[0].toLowerCase().replace(" ", "");
    width = Number(size.split("x")[0]);
    height = Number(size.split("x")[1]);
    board = [];
    for (var row = 0; row < FULL_HEIGHT; row++) {
        board.push([]);
        for (var col = 0; col < FULL_WIDTH; col++) {
            var isValid = col >= (FULL_WIDTH - width)/2 && col <= FULL_WIDTH - 0.5 - (FULL_WIDTH - width)/2 && row >= (FULL_HEIGHT - height)/2 && row <= FULL_HEIGHT - 0.5 - (FULL_HEIGHT - height)/2;
            var space = new Space(row*FULL_WIDTH + col);
            space.setIsValid(isValid);
            space.setIsMine(false);
            space.setIsRevealed(false);
            space.setIsFlagged(false);
            space.setRow(row);
            space.setCol(col);
            board[board.length - 1].push(space);
        }
    }

    // Convert board to HTML
    var boardHtml = "";
    for (var row = 0; row < FULL_HEIGHT; row++) {
        boardHtml += "<tr>";
        for (var col = 0; col < FULL_WIDTH; col++) {
            boardHtml += board[row][col].toHtml();
        }
        boardHtml += "</tr>";
    }
    var gameGrid = document.getElementById("game-grid");
    gameGrid.innerHTML = boardHtml;
    $(".space").click(checkSpace);
    $(".space").bind("contextmenu", flagMine);

    // Reset timer
    if (timerId) {
        clearInterval(timerId);
    }
    document.getElementById("time-div-text").innerHTML = "000";

    // Remove win/loss message
    document.getElementById("game-status-div-text").innerHTML = "";
}

function firstClick(space) {

    gameStarted = true;

    // The first space clicked must have 0 mines adjacent to it; mark the first space and its adjacent spaces as non-mines
    var safeSpaces = getAdjacentSpaces(space.getRow(), space.getCol()).concat([space]);
    var safeIds = [];
    safeSpaces.forEach(function(item) {
        safeIds.push(item.getId());
    });

    // Keep randomly selecting board spaces and making each one a mine if allowed, until the correct number of mines has been set
    var minesSet = 0;
    var attemptedMines = Array.from(Array(FULL_WIDTH*FULL_HEIGHT).keys());
    while (minesSet < numMines)
    {
        var attemptedMinesIndex = Math.floor(Math.random()*attemptedMines.length);
        var randomSpaceIndex = attemptedMines[attemptedMinesIndex];
        attemptedMines.splice(attemptedMinesIndex, 1);
        var randomSpace = getSpace(randomSpaceIndex);
        if (randomSpace.getIsValid() && !safeIds.includes(randomSpace.getId())) {
            randomSpace.setIsMine(true);
            minesSet++;
        }
    }
    startTimer();
}

function checkSpace() {

    // When user clicks an unrevealed space: If it is not a mine, set the correct number, otherwise lose the game
    if (gameOver) {
        return;
    }
    var space = getSpace($(this).attr("id"));
    if (!space.getIsValid() || space.getIsRevealed() || space.getIsFlagged()) {
        return;
    }
    if (!gameStarted) {
        firstClick(space);
    } else {
        if (space.getIsMine()) {
            loseGame(space);
            return;
        }
    }
    setNumAdjacentMines(space);
}

function flagMine() {

    // Mark a space as a mine
    if (gameOver || !gameStarted) {
        return;
    }
    var space = getSpace($(this).attr("id"));
    if (space.getIsRevealed() || !space.getIsValid()) {
        return;
    }
    if (space.getIsFlagged()) {
        space.setIsFlagged(false);
        $(this).removeClass("flag-space");
        numRemaining++;
    } else {
        space.setIsFlagged(true);
        $(this).addClass("flag-space");
        numRemaining--;
    }
    document.getElementById("flagged-div-text").innerHTML = padZeros(numRemaining, 2);
}

function setNumAdjacentMines(space) {

    // Show the number of mines that are adjacent to space. If there are 0, also show the number of mines adjacent to all the adjacent spaces.
    if (space.getIsRevealed()) {
        return;
    }
    space.setIsRevealed(true);
    var row = space.getRow();
    var col = space.getCol();
    var adjacentMines = 0;
    var adjacentSpaces = getAdjacentSpaces(row, col);
    adjacentSpaces.forEach(function(item) {
        if (item.getIsMine()) {
            adjacentMines++;
        }
    });
    $(space.getElement()).addClass("number-space");
    $(space.getElement()).addClass("number-" + adjacentMines + "-space");
    if (adjacentMines == 0) {
        adjacentSpaces.forEach(function(item) {
            setNumAdjacentMines(item);
        });
    }
}

function loseGame(space) {

    // Player clicked on a mine
    for (row = 0; row < FULL_HEIGHT; row++) {
        for (col = 0; col < FULL_WIDTH; col++) {
            var otherSpace = getSpaceByPosition(row, col);
            if (otherSpace.getIsMine() && !otherSpace.getIsFlagged() && otherSpace.getId() != space.getId()) {
                $(otherSpace.getElement()).addClass("mine-space");
            }
            if (!otherSpace.getIsMine() && otherSpace.getIsFlagged()) {
                $(otherSpace.getElement()).addClass("wrong-flag-space");
            }
        }
    }
    $(space.getElement()).addClass("mine-selected-space");
    var statusText = document.getElementById("game-status-div-text");
    statusText.innerHTML = "Game Over!";
    statusText.style["color"] = "red";
    if (timerId) {
        clearInterval(timerId);
    }
    gameOver = true;
}

function getSpace(i) {

    // i is a number between 0 and FULL_WIDTH*FULL_HEIGHT, where 0 represents top-left space and FULL_WIDTH*FULL_HEIGHT-1 represents bottom-right space OR
    // an id of the <td> element that contains the space, which is space-<number representing the above description>
    i = parseInt(i.toString().replace("space-", ""));
    var row = Math.floor(i / FULL_WIDTH);
    var col = i % FULL_WIDTH;
    if (row < 0 || row >= FULL_HEIGHT || col < 0 || col >= FULL_WIDTH) {
        var space = new Space("out-of-range");
        space.setIsValid(false);
        return space;
    }
    return board[row][col];
}

function getSpaceByPosition(row, col) {

    // Get space based on board position
    if (row < 0 || row >= FULL_HEIGHT || col < 0 || col >= FULL_WIDTH) {
        var space = new Space("out-of-range");
        space.setIsValid(false);
        return space;
    }
    return getSpace(row*FULL_WIDTH + col);
}

function getAdjacentSpaces(row, col) {

    // Get the 8 spaces that surround the space at position = (row, col)

    var possibleSpaces = [
        getSpaceByPosition(row - 1, col - 1), // Top-left
        getSpaceByPosition(row - 1, col    ), // Top-middle
        getSpaceByPosition(row - 1, col + 1), // Top-right
        getSpaceByPosition(row    , col - 1), // Middle-left
        getSpaceByPosition(row    , col + 1), // Middle-right
        getSpaceByPosition(row + 1, col - 1), // Bottom-left
        getSpaceByPosition(row + 1, col    ), // Bottom-middle
        getSpaceByPosition(row + 1, col + 1), // Bottom-right
    ]

    var spaces = [];
    possibleSpaces.forEach(function(item) {
        if (item.getIsValid()) {
            spaces.push(item);
        }
    });

    return spaces;
}

function setDifficulty() {

    // Set the value of the difficulty dropdown after the user clicks it
    var dropDown = document.getElementById("difficulty-dropdown");
    dropDown.innerHTML = this.innerHTML;
}


function startTimer() {

    // Start game timer, which is shown at the top
    if (timerId) {
        clearInterval(timerId);
    }
    var currTime = 1;
    timerId = setInterval(function() {
        document.getElementById("time-div-text").innerHTML = padZeros(currTime, 3);
        currTime++;
    }, 1000);
}

function padZeros(num, digits) {

    // Return num as a string, padded with up to digits 0s. Handles negative numbers.
    if (num >= 0) {
        return String(num).padStart(digits, "0");
    } else {
        return "-" + String(num).replace("-", "").padStart(digits, "0");
    }
}

$(document).ready(function() {
    $("#start-button").click(startGame);
});

$(document).ready(function() {
    $(".difficulty-item").click(setDifficulty);
});
