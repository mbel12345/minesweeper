var FULL_WIDTH = 30;
var FULL_HEIGHT = 16;

var board = [];

class Space {

    _id = "";
    isValid = false;
    isMine = false;
    isVisible = false;
    numMines = 0;

    constructor(_idNum) {
        this._id = "space-" + _idNum;
    }

    setIsValid(isValid) {
        this.isValid = isValid;
    }

    setIsMine(isMine) {
        this.isMine = isMine;
    }

    setIsVisible(isVisible) {
        this.isVisible = isVisible;
    }

    setNumMines(numMines) {
        this.numMines = numMines;
    }

    getIsValid() {
        return this.isValid;
    }

    getIsMine() {
        return this.isMine;
    }

    toHtml() { 
        return "<td class='space " + (this.isValid ? "valid-space" : "invalid-space") + "' id='" + this._id + "'></td>";
    }
}

function setDifficulty() {
    var dropDown = document.getElementById("difficulty-dropdown");
    dropDown.innerHTML = this.innerHTML;
}

function getSpace(i) {

    i = parseInt(i.toString().replace("space-", ""));
    var row = Math.floor(i / FULL_WIDTH);
    var col = i % FULL_WIDTH;
    return board[row][col];
}

function drawBoard() {

    // Determine difficulty
    var difficultyDropDown = document.getElementById("difficulty-dropdown");
    if (!difficultyDropDown.innerHTML.includes("(")) {
        alert("Please choose a difficulty");
        return;
    }

    // Set 2-D array of spaces, inlcuding marking each space as valid or invalid
    var size = difficultyDropDown.innerHTML.split("(")[1].split(")")[0].toLowerCase().replace(" ", "");
    var width = Number(size.split("x")[0]);
    var height = Number(size.split("x")[1]);
    board = [];
    for (var row = 0; row < FULL_HEIGHT; row++) {
        board.push([]);
        for (var col = 0; col < FULL_WIDTH; col++) {
            var isValid = col >= (FULL_WIDTH - width)/2 && col <= FULL_WIDTH - 0.5 - (FULL_WIDTH - width)/2 && row >= (FULL_HEIGHT - height)/2 && row <= FULL_HEIGHT - 0.5 - (FULL_HEIGHT - height)/2;
            var space = new Space(row*FULL_WIDTH + col);
            space.setIsValid(isValid);
            space.setIsMine(false);
            space.setIsVisible(false);
            board[board.length - 1].push(space);
        }
    }

    // Set mines randomly in the valid spaces
    var numMines = difficultyDropDown.innerHTML.match(/([0-9]+) mines/)[1];
    var minesSet = 0;
    var attemptedMines = Array.from(Array(FULL_WIDTH*FULL_HEIGHT).keys());
    while (minesSet < numMines)
    {
        var attemptedMinesIndex = Math.floor(Math.random()*attemptedMines.length);
        var spaceIndex = attemptedMines[attemptedMinesIndex];
        attemptedMines.splice(attemptedMinesIndex, 1);
        space = getSpace(spaceIndex);
        if (space.getIsValid()) {
            space.setIsMine(true);
            minesSet++;
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
    $(".space").click(checkMine);
}

function checkMine() {

    var spaceId = $(this).attr("id");
    var space = getSpace(spaceId);
    if (space.getIsMine()) {
        $(this).addClass("mine-space");
        $(this).removeClass("valid-space");
    }
}

$(document).ready(function() {
    $(".difficulty-item").click(setDifficulty);
});

$(document).ready(function() {
    $("#start-button").click(drawBoard);
});
