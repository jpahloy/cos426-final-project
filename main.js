const DRAW_MODE = 1;
const SIMULATE_MODE = 2;

var strokeCount = 0;

var applicationMode = DRAW_MODE;

// models the user's mouse
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
        this.density = 1.0;
    }

    getColorString() {
        return "RGB(" + String(this.color[0]) + "," + String(this.color[1]) + "," + String(this.color[2])+")";
    }
}

// class for simulation (similar to image)
class Simulation {
    constructor() {
        console.log("test 22");
        this.width = 128;
        this.height = 128;

        this.stepInterval = 17; // half a second = 500ms
        this.stepStartTime = -1;
        this.evenStep = true;

        this.grid = [];
        this.bufferGrid = [];

        for (var i = 0; i < this.height; i++) {
            this.grid.push([]);
            this.bufferGrid.push([]);
            for (var j = 0; j < this.width; j++) {
                this.grid[i].push(undefined);
                this.bufferGrid[i].push(undefined);
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
            this.evenStep = !this.evenStep;

            // some functions to swap for loop from going low index to high <-> high index to low
            var forLoopStartX = function(even, max) {
                if (even) {
                    return 0;
                }
                else {
                    return max -1;
                }
            }; 

            var forLoopCondition = function(t, even, max) {
                if (even) {
                    return t < max;
                }
                else {
                    return t >= 0;
                }
            };

            var foorLoopStep = function(even) {
                if (even) {
                    return 1;
                }
                else {
                    return -1;
                }
            }

            // updateCells is to maintain which cells have been updated in the current time step
            var updateCells = [];
            for (var i = 0; i < this.height; i++) {
                updateCells.push([]);
                for (var j = 0; j < this.width; j++) {
                    updateCells[i].push(false);
                }
            }

            // update from bottom up
            for (var y = this.height - 1; y >= 0; y--) {
                for (var x = forLoopStartX(this.evenStep, this.width); forLoopCondition(x, this.evenStep, this.width); x+= foorLoopStep(this.evenStep)) {
                    // if this cell is already updated then skip it
                    if (updateCells[y][x]) {
                        continue;
                    }


                    // if there is no cell then there is nothing to do
                    if (this.grid[y][x] === undefined) {
                        updateCells[y][x] = true;
                        continue;
                    }

                    // if the element is solid this it remains in same position
                    if (this.grid[y][x].isSolid) {
                        updateCells[y][x] = true;
                        continue;
                    }

                    // check if we can fall below us (or mix, should add check for solid here)
                    if (y < this.height - 1) {
                        // if directly below is free then fill it
                        if (this.grid[y+1][x] === undefined) {
                            this.grid[y+1][x] = this.grid[y][x];
                            this.grid[y][x] = undefined;

                            updateCells[y][x] = true;
                            updateCells[y+1][x] = true;
                            continue;
                        }
                        else if (!this.grid[y+1][x].isSolid && this.grid[y+1][x].density < this.grid[y][x].density) {
                            var densityDiff = this.grid[y][x].density - this.grid[y+1][x].density;
                            var densityProbability = 0.1 + (densityDiff / 2.0);

                            if(Math.random() < densityProbability) {
                                var temp = this.grid[y+1][x];
                                this.grid[y+1][x] = this.grid[y][x];
                                this.grid[y][x] = temp;

                                updateCells[y][x] = true;
                                updateCells[y+1][x] = true;
                                continue;
                            }
                        }

                        // else if diagionally down and left/right is free then fill it
                        var randomOffset = [-1, 1][Math.floor(Math.random() * 2)];
                        if (x + randomOffset >= 0 && x + randomOffset < this.width) {
                            // check if nothing is blocking our way
                            if (this.grid[y][x+randomOffset] === undefined || !this.grid[y][x+randomOffset].isSolid) {
                                if (this.grid[y+1][x+randomOffset] === undefined) {
                                    this.grid[y+1][x+randomOffset] = this.grid[y][x];
                                    this.grid[y][x] = undefined; 
        
                                    updateCells[y+1][x+randomOffset] = true;
                                    updateCells[y][x] = true;
                                    continue;
                                }
                                else if (!this.grid[y+1][x+randomOffset].isSolid && this.grid[y+1][x+randomOffset].density < this.grid[y][x].density){
                                    var densityDiff = this.grid[y][x].density - this.grid[y+1][x+randomOffset].density;
                                    var densityProbability = 0.1 + (densityDiff / 2.0);

                                    if(Math.random() < densityProbability) {
                                        var temp = this.grid[y+1][x+randomOffset];
                                        this.grid[y+1][x+randomOffset] = this.grid[y][x];
                                        this.grid[y][x] = temp;
        
                                        updateCells[y+1][x+randomOffset] = true;
                                        updateCells[y][x] = true;
                                        continue;
                                    }
                                }
                            }
                        }

                        if (x - randomOffset >= 0 && x -randomOffset < this.width) {
                            if (this.grid[y][x-randomOffset] === undefined || !this.grid[y][x-randomOffset].isSolid) {
                                if (this.grid[y+1][x-randomOffset] === undefined) {
                                    this.grid[y+1][x-randomOffset] = this.grid[y][x];
                                    this.grid[y][x] = undefined; 
        
                                    updateCells[y+1][x-randomOffset] = true;
                                    updateCells[y][x] = true;
                                    continue;
                                }
                                else if (!this.grid[y+1][x-randomOffset].isSolid && this.grid[y+1][x-randomOffset].density < this.grid[y][x].density){
                                    var densityDiff = this.grid[y][x].density - this.grid[y+1][x-randomOffset].density;
                                    var densityProbability = 0.1 + (densityDiff / 2.0);

                                    if(Math.random() < densityProbability) {
                                        var temp = this.grid[y+1][x-randomOffset];
                                        this.grid[y+1][x-randomOffset] = this.grid[y][x];
                                        this.grid[y][x] = temp;
        
                                        updateCells[y+1][x-randomOffset] = true;
                                        updateCells[y][x] = true;
                                        continue;
                                    }
                                }
                            }
                        }

                        // if we cannot move down then trail left and right to fill space if we can
                        // check if we can go left or right
                        var randomOffset2 = [-1, 1][Math.floor(Math.random() * 2)];
                        if (x + randomOffset2 >= 0 && x+randomOffset2 < this.width) {
                            if (this.grid[y][x+randomOffset2] === undefined) {
                                this.grid[y][x+randomOffset2] = this.grid[y][x];
                                this.grid[y][x] = undefined; 
    
                                updateCells[y][x+randomOffset2] = true;
                                updateCells[y][x] = true;
                                continue;
                            }
                            else if (!this.grid[y][x+randomOffset2].isSolid && this.grid[y][x+randomOffset2].density < this.grid[y][x].density) {
                                var densityDiff = this.grid[y][x].density - this.grid[y+1][x+randomOffset2].density;
                                var densityProbability = 0.1 + (densityDiff / 2.0);

                                if(Math.random() < densityProbability) {
                                    var temp = this.grid[y][x+randomOffset2];
                                    this.grid[y][x+randomOffset2] = this.grid[y][x];
                                    this.grid[y][x] = temp;
    
                                    updateCells[y][x+randomOffset2] = true;
                                    updateCells[y][x] = true;
                                    continue;
                                }
                            }
                        }

                        if (x - randomOffset2 >= 0 && x-randomOffset2 < this.width) {
                            if (this.grid[y][x-randomOffset2] === undefined) {
                                this.grid[y][x-randomOffset2] = this.grid[y][x];
                                this.grid[y][x] = undefined; 
    
                                updateCells[y][x-randomOffset2] = true;
                                updateCells[y][x] = true;
                                continue;
                            }
                            else if (!this.grid[y][x-randomOffset2].isSolid && this.grid[y][x-randomOffset2].density < this.grid[y][x].density) {
                                var densityDiff = this.grid[y][x].density - this.grid[y+1][x-randomOffset2].density;
                                var densityProbability = 0.1 + (densityDiff / 2.0);

                                if(Math.random() < densityProbability) {
                                    var temp = this.grid[y][x-randomOffset2];
                                    this.grid[y][x-randomOffset2] = this.grid[y][x];
                                    this.grid[y][x] = temp;
    
                                    updateCells[y][x-randomOffset2] = true;
                                    updateCells[y][x] = true;
                                    continue;
                                }
                            }
                        }
                    }
                }
            }

            this.stepStartTime = Date.now(); // restart timer
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

    var randomRed = Math.floor(Math.random()*256);
    var randomGreen = Math.floor(Math.random()*256);
    var randomBlue = Math.floor(Math.random()*256);
    var newCell = new Cell(randomRed, randomGreen, randomBlue);
    cellStrokeStack.push(newCell);

    var strokeFolder = cellStrokesGuiFolder.addFolder("Stroke " + String(strokeCount));
    strokeFolder.addColor(newCell, "color");
    strokeFolder.add(newCell, "isSolid");
    strokeFolder.add(newCell, "density", 0, 1);
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
    var newX = (Math.floor(mouse.x / 4) * 4) - 4*controlsGUIdict.brushSize;
    var newY = (Math.floor(mouse.y / 4) * 4) - 4*controlsGUIdict.brushSize;

    mainContext.lineWidth = 1;
    mainContext.strokeStyle = 'white';
    var diameter = 2*controlsGUIdict.brushSize + 1;
    mainContext.strokeRect(newX, newY, (mainCanvas.width/ 128.0) * diameter, (mainCanvas.height/128.0) * diameter);
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

            if (controlsGUIdict.brushSize < 1) {
                simulation.setCellAtMousePos(currentCell, mouse.x, mouse.y);
            }
            else {
                for (var x = mouse.x - 4*controlsGUIdict.brushSize; x <= mouse.x + 4*controlsGUIdict.brushSize; x += 4) {
                    for (var y = mouse.y - 4*controlsGUIdict.brushSize; y <= mouse.y + 4*controlsGUIdict.brushSize; y += 4) {
                        simulation.setCellAtMousePos(currentCell, x, y);
                    }
                }
            }            
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

addCellGuiButton();
window.requestAnimationFrame(draw, mainCanvas);
