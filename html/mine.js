var FULL_WIDTH = 10; // TODO: Change to 30
var FULL_HEIGHT = 10; // TODO: Change to 16

var board = [];
var gameOver = false;

class Space {

    _id = "";
    isValid = false;
    isMine = false;
    isRevealed = false;
    isFlagged = false;
    row = -1;
    col = -1;

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

function drawBoard() {

    gameOver = false;

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
            space.setIsRevealed(false);
            space.setIsFlagged(false);
            space.setRow(row);
            space.setCol(col);
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
    $(".space").click(checkSpace);
    $(".space").bind("contextmenu", flagMine);
}

function checkSpace() {

    if (gameOver) {
        return;
    }
    var space = getSpace($(this).attr("id"));
    if (space.getIsRevealed() || space.getIsFlagged()) {
        return;
    }
    if (space.getIsMine()) {
        loseGame(space);
        return;
    }
    setNumAdjacentMines(space);
}

function flagMine() {

    if (gameOver) {
        return;
    }
    var space = getSpace($(this).attr("id"));
    if (space.getIsRevealed()) {
        return;
    }
    if (space.getIsFlagged()) {
        space.setIsFlagged(false);
        $(this).removeClass("flag-space");
    } else {
        space.setIsFlagged(true);
        $(this).addClass("flag-space");
    }
}

function setNumAdjacentMines(space) {

    var row = space.getRow();
    var col = space.getCol();
    var numMines = 0;
    if (getSpaceByPosition(row - 1, col - 1).getIsMine()) { // Top-left
        numMines++;
    }
    if (getSpaceByPosition(row - 1, col).getIsMine()) { // Top-middle
        numMines++;
    }
    if (getSpaceByPosition(row -1, col + 1).getIsMine()) { // Top-right
        numMines++;
    }
    if (getSpaceByPosition(row, col - 1).getIsMine()) { // Middle-left
        numMines++;
    }
    if (getSpaceByPosition(row, col + 1).getIsMine()) { // Middle-right
        numMines++;
    }
    if (getSpaceByPosition(row + 1, col - 1).getIsMine()) { // Bottom-left
        numMines++;
    }
    if (getSpaceByPosition(row + 1, col).getIsMine()) { // Bottom-middle
        numMines++;
    }
    if (getSpaceByPosition(row + 1, col + 1).getIsMine()) { // Bottom-right
        numMines++;
    }
    $(space.getElement()).addClass("number-space");
    $(space.getElement()).addClass("number-" + numMines + "-space");
}

function loseGame(space) {

    for (row = 0; row < FULL_HEIGHT; row++) {
        for (col = 0; col < FULL_WIDTH; col++) {
            var otherSpace = getSpaceByPosition(row, col);
            if (otherSpace.getIsMine() && $(otherSpace.getElement()).attr("id") != $(space.getElement()).attr("id")) {
                $(otherSpace.getElement()).addClass("mine-space");
            }
        }
    }
    $(space.getElement()).addClass("mine-selected-space");
    document.getElementById("flagged-div-text").innerHTML = "Game Over!";
    gameOver = true;
}

function getSpace(i) {

    // i is a number between 0 and FULL_WIDTH*FULL_HEIGHT, where 0 represents top-left space and FULL_WIDTH*FULL_HEIGHT-1 represents bottom-right space OR
    // an id of the <td> element that contains the space, which is space-<number representing the above description>
    i = parseInt(i.toString().replace("space-", ""));
    var row = Math.floor(i / FULL_WIDTH);
    var col = i % FULL_WIDTH;
    return board[row][col];
}

function getSpaceByPosition(row, col) {

    if (row < 0 || row >= FULL_HEIGHT || col < 0 || col >= FULL_WIDTH) {
        return new Space("out-of-range");
    }
    return getSpace(row*FULL_WIDTH + col);
}

function setDifficulty() {
    var dropDown = document.getElementById("difficulty-dropdown");
    dropDown.innerHTML = this.innerHTML;
}

$(document).ready(function() {
    $("#start-button").click(drawBoard);
});

$(document).ready(function() {
    $(".difficulty-item").click(setDifficulty);
});
