const DRAW_MODE = 1;
const SIMULATE_MODE = 2;

var strokeCount = 0;

var applicationMode = DRAW_MODE;

// models the user's mouse\
class Mouse {
    constructor() {
        this.x = -1;
        this.y = -1;

        this.isDown = false;
    }
}

// class for cells (similar to pixel)
class Cell {
    constructor(r, g, b) {
        this.color = [r, g, b];
        this.isSolid = false;
    }

    getColorString() {
        return "RGB(" + String(this.color[0]) + "," + String(this.color[1]) + "," + String(this.color[2])+")";
    }
}

// class for simulation (similar to image)
class Simulation {
    constructor() {
        this.width = 128;
        this.height = 128;

        this.stepInterval = 500; // half a second = 500ms
        this.stepStartTime = -1;

        this.grid = [];

        for (var i = 0; i < this.height; i++) {
            this.grid.push([]);
            for (var j = 0; j < this.width; j++) {
                this.grid[i].push(undefined);
            }
        }
    }

    setCellAtMousePos(cell, x, y) {
        var newX = Math.floor(x / 4);
        var newY = Math.floor(y / 4);

        this.grid[newY][newX] = cell;
    }

    step() {
        if (this.stepStartTime < 0) {
            this.stepStartTime = Date.now();
        }

        if (Date.now() - this.stepStartTime > this.stepInterval) {
            // update from bottom up
            for (var y = this.height - 1; y >= 0; y--) {
                for (var x = 0; x < this.width; x++) {

                    if (this.grid[y][x] === undefined) {
                        continue;
                    }
                    
                    if (this.grid[y][x].isSolid) {
                        continue;
                    }

                    
                    // basic simulation (check if something below and then fall)
                    if (y < this.height - 1) {
                        if (this.grid[y + 1][x] === undefined) {
                            this.grid[y+1][x] = this.grid[y][x];
                            this.grid[y][x] = undefined;
                        }
                    }
                    
                }
            }
        }
    }
}

var simulation = new Simulation();
var mouse = new Mouse();

var cellStrokesGui  = new dat.GUI();
var cellStrokesGuiFolder = cellStrokesGui.addFolder('Cell Strokes');
cellStrokesGuiFolder.open();

var cellStrokeStack = [];
var cellStrokeStackGui = [];

var addCellGuiButton = function() {
    strokeCount += 1;

    var newCell = new Cell(255, 255, 255);
    cellStrokeStack.push(newCell);

    var strokeFolder = cellStrokesGuiFolder.addFolder("Stroke " + String(strokeCount));
    strokeFolder.addColor(newCell, "color");
    strokeFolder.add(newCell, "isSolid");
    strokeFolder.open();
    cellStrokeStackGui.push(strokeFolder);
}

var removeCellGuiButton = function() {
    if (cellStrokeStack.length < 1) {
        return;
    }

    var lastCell = cellStrokeStack.pop();
    var lastFolder = cellStrokeStackGui.pop();

    cellStrokesGuiFolder.removeFolder(lastFolder);

    for (var i = 0; i < simulation.height; i++) {
        for (var j = 0; j < simulation.width; j++) {
            if (simulation.grid[i][j] === lastCell) {
                simulation.grid[i][j] = undefined;
            }
        }
    }

}

var simulateGuiButton = function() {
    applicationMode = SIMULATE_MODE;
}


var controlsGUIdict = {add : addCellGuiButton, remove : removeCellGuiButton, simulate : simulateGuiButton, brushSize : 1};
var controlsGui  = new dat.GUI();
var controlsGuiFolder = controlsGui.addFolder('Controls');
controlsGuiFolder.add(controlsGUIdict, "brushSize", 1, 5, 1);
controlsGuiFolder.add(controlsGUIdict, "add");
controlsGuiFolder.add(controlsGUIdict, "remove");
controlsGuiFolder.add(controlsGUIdict, "simulate");
controlsGuiFolder.open();

var mainCanvas = document.getElementById("mainCanvas");
var mainContext = mainCanvas.getContext("2d");

var rect = mainCanvas.getBoundingClientRect();




var drawCursor = function() {
    // clamp to square
    var newX = Math.floor(mouse.x / 4) * 4;
    var newY = Math.floor(mouse.y / 4) * 4;

    mainContext.lineWidth = 1;
    mainContext.strokeStyle = 'white';
    mainContext.strokeRect(newX, newY, mainCanvas.width/ 128.0, mainCanvas.height/128.0);
}


mainCanvas.onmousedown = function(e) {
    mouse.isDown = true;
    //console.log("mouse button dodnwlwjnmed");
}

mainCanvas.onmouseup = function(e) {
    mouse.isDown = false;
    //console.log("mouse button UPPPP");
}


// just stop drawing if the user's mouse leaves the canvas
mainCanvas.onmouseleave = function(e) {
    mouse.isDown = false;
}


mainCanvas.onmousemove = function(e) {


    if (applicationMode == DRAW_MODE) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        if (mouse.isDown && cellStrokeStack.length > 0) {
            var currentCell = cellStrokeStack[cellStrokeStack.length - 1];
            simulation.setCellAtMousePos(currentCell, mouse.x, mouse.y);
        }

        
    }
    else if (applicationMode == SIMULATE_MODE) {
        return;
    }
}

var drawCell = function(cell, gridX, gridY) {
    var newX = gridX * 4;
    var newY = gridY * 4;

    mainContext.fillStyle = cell.getColorString();
    mainContext.fillRect(newX, newY, mainCanvas.width/ 128.0, mainCanvas.height/128.0);
}

var drawCellGrid = function() {
    for (var y = 0; y < simulation.height; y++) {
        for (var x = 0; x < simulation.width; x++) {
            if (simulation.grid[y][x] === undefined) {
                continue;
            }
            else {
                // should ideally check if object is type grid
                drawCell(simulation.grid[y][x], x, y);
            }
        }
    }
}


function draw() {
    
    // clear canvas
    mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    if (applicationMode == SIMULATE_MODE) {
        simulation.step();
    }

    // draw grid
    drawCellGrid();
    // draw cursor

    if (applicationMode == DRAW_MODE) {
        drawCursor();
    }
    
    window.requestAnimationFrame(draw, mainCanvas);
}

window.requestAnimationFrame(draw, mainCanvas);
