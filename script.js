var canvas = document.createElement("canvas");
document.body.appendChild(canvas);
var c = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

var mouse = {
    x: undefined,
    y: undefined,
    down: false,
    rightDown: false,
    drawingWireFrom: undefined,
    drawingGate: undefined,
    rightDown: false,
    isMoving: undefined,
    stepArray: [],
    drawingDisplay: undefined
};

window.addEventListener("resize", resize);

canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.offsetX
    mouse.y = e.offsetY
});
canvas.addEventListener("mousedown", function (e) {
    if (e.which == 1) {
        mouse.down = true;
    }
    if (e.which == 3) {
        mouse.rightDown = true;
    }
});
canvas.addEventListener("mouseup", function (e) {
    if (e.which == 1) {
        mouse.down = false;
    }
    if (e.which == 3) {
        mouse.rightDown = false;
    }
});
canvas.addEventListener('contextmenu', function (ev) {
    ev.preventDefault();
    return false;
}, false);

window.addEventListener("keydown", function (e) {
    if (e.keyCode >= 49 && e.keyCode <= 57) {
        mouse.drawingGate = gates[e.keyCode - 49];
    }
    if (e.keyCode === 27) {
        mouse.drawingWireFrom = undefined;
        mouse.drawingGate = undefined;
        mouse.drawingDisplay = undefined;
    }
})

function detectCollision(x, y, w, h, x2, y2, w2, h2) {
    if (x + w > x2 && x < x2 + w2 && y + h > y2 && y < y2 + h2) {
        return true;
    };
};
function pointCircleCollide(point, circle, r) {
    if (r === 0) return false
    var dx = circle[0] - point[0]
    var dy = circle[1] - point[1]
    return dx * dx + dy * dy <= r * r
}
var tmp = [0, 0]

function lineCircleCollide(a, b, circle, radius, nearest) {
    //check to see if start or end points lie within circle
    if (pointCircleCollide(a, circle, radius)) {
        if (nearest) {
            nearest[0] = a[0]
            nearest[1] = a[1]
        }
        return true
    } if (pointCircleCollide(b, circle, radius)) {
        if (nearest) {
            nearest[0] = b[0]
            nearest[1] = b[1]
        }
        return true
    }

    var x1 = a[0],
        y1 = a[1],
        x2 = b[0],
        y2 = b[1],
        cx = circle[0],
        cy = circle[1]

    //vector d
    var dx = x2 - x1
    var dy = y2 - y1

    //vector lc
    var lcx = cx - x1
    var lcy = cy - y1

    //project lc onto d, resulting in vector p
    var dLen2 = dx * dx + dy * dy //len2 of d
    var px = dx
    var py = dy
    if (dLen2 > 0) {
        var dp = (lcx * dx + lcy * dy) / dLen2
        px *= dp
        py *= dp
    }

    if (!nearest)
        nearest = tmp
    nearest[0] = x1 + px
    nearest[1] = y1 + py

    //len2 of p
    var pLen2 = px * px + py * py

    //check collision
    return pointCircleCollide(nearest, circle, radius)
        && pLen2 <= dLen2 && (px * dx + py * dy) >= 0
}

var gates = [
    {
        name: "NOT",
        table: {
            '0': '1',
            '1': '0'
        }
    },
    {
        name: "AND",
        table: {
            '00': '0',
            '01': '0',
            '10': '0',
            '11': '1'
        }
    }
]

window.onload = loadData;
window.onbeforeunload = saveData;

var saveButton = undefined;
var clearButton = undefined;
var displayButton = undefined;

async function saveData() {
    if (JSON.stringify(localStorage).length > 4500000) {

    } else {
        localStorage.clear();
        localStorage.setItem("gates", JSON.stringify(gates))
    }
}
function loadData() {
    if (JSON.parse(localStorage.getItem("gates"))) {
        gates = JSON.parse(localStorage.getItem("gates"))
    }
    init();
}
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
const measureText = (() => {
    var data, w, size = 120; // for higher accuracy increase this size in pixels.
    const isColumnEmpty = x => {
        var idx = x, h = size * 2;
        while (h--) {
            if (data[idx]) { return false }
            idx += can.width;
        }
        return true;
    }
    const can = document.createElement("canvas");
    const ctx = can.getContext("2d");
    return ({ text, font, baseSize = size }) => {
        size = baseSize;
        can.height = size * 2;
        font = size + "px " + font;
        if (text.trim() === "") { return }
        ctx.font = font;
        can.width = (w = ctx.measureText(text).width) + 8;
        ctx.font = font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(text, 0, size);
        data = new Uint32Array(ctx.getImageData(0, 0, can.width, can.height).data.buffer);
        var left, right;
        var lIdx = 0, rIdx = can.width - 1;
        while (lIdx < rIdx) {
            if (left === undefined && !isColumnEmpty(lIdx)) { left = lIdx }
            if (right === undefined && !isColumnEmpty(rIdx)) { right = rIdx }
            if (right !== undefined && left !== undefined) { break }
            lIdx += 1;
            rIdx -= 1;
        }
        data = undefined; // release RAM held
        can.width = 1; // release RAM held
        return right - left >= 1 ? {
            left, right, rightOffset: w - right, width: right - left,
            measuredWidth: w, font, baseSize
        } : undefined;
    }
})();
function saveCurrentGates(l) {
    let inputArrayValues = JSON.prune(inputArray)
    let outputArrayValues = JSON.prune(outputArray)
    let gateArrayValues = JSON.prune(gateArray)

    let wireArray = [];
    function putSearches(h) {
        h.wireArray.forEach(g => {
            let object = {
                from: {
                    x: g.from.x,
                    y: g.from.y
                },
                to: {
                    x: g.to.x,
                    y: g.to.y
                },
                stepArray: g.stepArray
            }
            if (wireArray.includes(JSON.stringify(object)) == false) {
                wireArray.push(JSON.stringify(object));
            }
        })
    }
    function searchForWire(e) {
        if (e instanceof Gate) {
            e.inputs.forEach(h => {
                putSearches(h)
            })
            e.outputs.forEach(h => {
                putSearches(h)
            })
        } else if (e instanceof Display) {
            e.inputs.forEach(h => {
                putSearches(h)
            })
        } else {
            putSearches(e.wireConnector);
        }
    }



    inputArray.forEach(e => searchForWire(e))
    outputArray.forEach(e => searchForWire(e))
    gateArray.forEach(e => searchForWire(e))

    wireValues = JSON.stringify(wireArray);

    let values = {
        input: inputArrayValues,
        gate: gateArrayValues,
        output: outputArrayValues,
        wires: wireValues
    };
    gates[l].values = values;
}
async function loadGate(i) {

    if (gates[i].values == undefined) {
        clearButton.onClick();
        return;
    }

    inputArray = [];
    let tmpInputArray = JSON.parse(gates[i].values.input);
    tmpInputArray.forEach(e => {
        inputArray.push(new Input(e.y));
    });

    gateArray = [];
    let tmpGateArray = JSON.parse(gates[i].values.gate);
    tmpGateArray.forEach(e => {
        if (e.name) {
            if (gates[i].values.gate.table) {
                let table = [];
                e.tableInputs.forEach(function (g, i) {
                    table[JSON.stringify(g).replace(",", "").replace("[", "").replace("]", "")] = JSON.stringify(e.tableOutputs[i][0])
                })
                gateArray.push(new Gate(e.x, e.y, { table: table, name: e.name }));
            } else {
                gateArray.push(new Gate(e.x, e.y, gates[gates.map(e => e.name).indexOf(e.name)]));
            }
        } else {
            gateArray.push(new Display(e.x, e.y));
        }


    });


    outputArray = [];

    let tmpOutputArray = JSON.parse(gates[i].values.output);
    tmpOutputArray.forEach(e => {
        outputArray.push(new Output(e.y));
    });

    let wireArray = JSON.parse(gates[i].values.wires);
    wireArray = wireArray.map(e => JSON.parse(e))
    inputArray.forEach(async function (e) {
        wireArray.forEach(async function (g) {
            if (g.from.x == e.wireConnector.x && g.from.y == e.wireConnector.y) {
                gateArray.forEach(async function (h) {
                    h.inputs.forEach(async function (b) {
                        if (g.to.x == b.x && g.to.y == b.y) {
                            let wire = new Wire(e.wireConnector, b, g.stepArray);
                            e.wireConnector.wireArray.push(wire);
                            b.wireArray.push(wire)
                        }
                    })
                })
                outputArray.forEach(async function (h) {
                    if (g.to.x == h.wireConnector.x && g.to.y == h.wireConnector.y) {
                        let wire = new Wire(e.wireConnector, h.wireConnector, g.stepArray);
                        e.wireConnector.wireArray.push(wire);
                        h.wireConnector.wireArray.push(wire)
                    }

                })
            }
        })
    })
    gateArray.forEach(async function (e) {
        wireArray.forEach(async function (g) {
            e.outputs.forEach(async function (a) {

                if (g.from.x == a.x && g.from.y == a.y) {

                    gateArray.forEach(async function (h) {

                        h.inputs.forEach(async function (b) {

                            if (g.to.x == b.x && g.to.y == b.y) {
                                let wire = new Wire(a, b, g.stepArray);
                                a.wireArray.push(wire);
                                b.wireArray.push(wire)
                            }
                        })
                    })
                    await new Promise(resolve => setTimeout(resolve, 10));
                    outputArray.forEach(async function (h) {
                        if (g.to.y == h.wireConnector.y) {
                            g.stepArray = [{ x: a.x, y: a.y }, { x: h.wireConnector.x, y: h.wireConnector.y }]
                            let wire = new Wire(a, h.wireConnector, g.stepArray);
                            a.wireArray.push(wire);
                            h.wireConnector.wireArray.push(wire)
                        }

                    })
                }
            })
        })
    })
    mouse.drawingGate = undefined;
}

function update() {
    requestAnimationFrame(update);

    render();
    buttons.forEach(e => e.update());
    inputArray.forEach(e => e.update());
    outputArray.forEach(e => e.update());
    gateArray.forEach(e => e.update());

};
var fileReader;

function init() {
    gates.forEach(function (e, i) {
        e.button = new Button(10 + 110 * i, 10, 100, 30, e.name, function () {
            mouse.drawingGate = e;
        }, function () {
            if (i > 1) {
                mouse.rightDown = false;
                if (confirm("Would you like to edit this component?")) {
                    loadGate(i)
                } else {
                    if (confirm("Would you like to delete this component?")) {
                        gates.splice(gates.indexOf(e), 1)
                        init();

                    }
                }
            }
        });
    });
    downloadButton = new Button('canvas.width - 140', 10, 120, 30, "Download", function () {
        download(JSON.stringify(gates), "gates.json", 'text/plain')
    });
    loadButton = new Button('canvas.width - 260', 10, 100, 30, "Upload", function () {
        fileReader = document.createElement('input');
        fileReader.type = 'file';
        fileReader.accept = '.json';
        fileReader.click();
        fileReader.addEventListener('change', function (e) {
            let file = fileReader.files[0]
            let tmp = new FileReader();
            tmp.readAsText(file);
            tmp.onload = function () {
                gates = JSON.parse(tmp.result)
                init();
            };
        })
    });
    saveButton = new Button('canvas.width - 380', 10, 100, 30, "SAVE", save);
    clearButton = new Button('canvas.width - 500', 10, 100, 30, "CLEAR", function () {
        if (confirm("Are you sure you would like to clear?")) {
            inputArray = [];
            outputArray = [];
            gateArray = [];
        }
    });
    displayButton = new Button('canvas.width - 620', 10, 100, 30, "7SEG", function () {
        mouse.drawingDisplay = true;
    });

};

async function save() {
    /*
    let save = {}

    for (let i = 0; i < Math.pow(2, inputArray.length); i++) {
        let id = (i >>> 0).toString(2)
        id = '0'.repeat(inputArray.length - id.length) + id
        let inputs = id.split('')

        for (let j = 0; j < inputs.length; j++) {
            inputArray[j].on = inputs[j] === '1'
        }
        await new Promise(resolve => setTimeout(resolve, 50 * gateArray.length))
        let result = ''
        outputArray.forEach(output => result += output.on ? 1 : 0)
        save[id] = result
    }*/
    let name = "";
    while (name === "" || name === "NOT" || name === "AND" || name.length > 12) {
        name = prompt("Name of component: ", name)
    }
    if (gates.filter(e => e.name == name).length !== 1) {
        gates.push({ name: name })
        init()
        saveCurrentGates(gates.length - 1);
    } else {
        let index = gates.map(e => e.name).indexOf(name);
        gates[index] = ({ name: name })
        init()
        saveCurrentGates(index);
    }
    clearButton.onClick();
}

function render() {
    saveButton.visible = true;
    clearButton.visible = true;
    loadButton.visible = true;
    downloadButton.visible = true;
    displayButton.visible = true;
    gates.forEach(e => e.button.visible = true)
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = "gray"
    c.fillRect(0, 0, canvas.width, 50)
    if (mouse.y > 75 && mouse.isMoving == undefined) {
        if (mouse.drawingWireFrom) {
            if (mouse.down) {
                mouse.stepArray.push({ x: mouse.x, y: mouse.y })
            };
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(mouse.drawingWireFrom.x + 12.5, mouse.drawingWireFrom.y + 12.5);
            mouse.stepArray.forEach(e => {
                c.lineTo(e.x, e.y);
            })
            c.lineTo(mouse.x, mouse.y);
            c.stroke();
        } else {
            if (mouse.x < 100) {
                if (inputArray.filter(e => detectCollision(10, e.y - 50 / 2, 25, 50, 10, mouse.y - 50, 25, 50)).length == 0) {
                    c.fillRect(10, mouse.y - 50 / 2, 25, 50);
                    if (mouse.down) {
                        mouse.down = false;
                        inputArray.push(new Input(mouse.y - 50 / 2));
                    };
                };
            } else if (mouse.x > canvas.width - 100) {
                if (outputArray.filter(e => detectCollision(10, e.y - 50 / 2, 25, 50, 10, mouse.y - 50, 25, 50)).length == 0) {
                    c.fillRect(canvas.width - 25 - 20, mouse.y - 50 / 2, 25, 50);
                    if (mouse.down) {
                        mouse.down = false;
                        outputArray.push(new Output(mouse.y - 50 / 2));
                    };
                };
            } else if (mouse.drawingGate) {
                let tableInputs = [2, 2]
                let tableOutputs = [2, 2]
                c.fillStyle = "gray"
                c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);

                if (gateArray.filter(e => detectCollision(e.x - 60, e.y, 150, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, Math.max(tableInputs.length, tableOutputs.length) * 15)).length == 0) {
                    c.fillStyle = "black"
                    c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);
                    if (mouse.down) {
                        mouse.down = false;
                        gateArray.push(new Gate(mouse.x - 25 / 2, mouse.y - 50 / 2, mouse.drawingGate));
                        mouse.drawingGate = false;
                    };
                };
            } else if (mouse.drawingDisplay) {
                let tableInputs = [2, 2]
                let tableOutputs = [2, 2]
                c.fillStyle = "gray"
                c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);

                if (gateArray.filter(e => detectCollision(e.x - 60, e.y, 150, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, Math.max(tableInputs.length, tableOutputs.length) * 15)).length == 0) {
                    c.fillStyle = "black"
                    c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);
                    if (mouse.down) {
                        mouse.down = false;
                        gateArray.push(new Display(mouse.x - 25 / 2, mouse.y - 50 / 2));
                        mouse.drawingDisplay = false;
                    };
                };
            };;
        }
    };
};

var inputArray = [];
var outputArray = [];
var gateArray = [];
var buttons = [];

class Button {
    constructor(x, y, w, h, text, onClick, onRightClick) {
        this.xValue = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.hover = false;
        this.onClick = onClick;
        this.onRightClick = onRightClick;
        this.visible = false;
        this.text = text;
        this.textsize = measureText({ font: "serif", text: text });

        this.x = this.xValue;
        if (!this.onRightClick) {
            this.onRightClick = function () { }
        }
        if (!this.onClick) {
            this.onClick = function () { }
        }

        buttons.push(this);
    }
    update() {
        if (typeof this.xValue == 'string') {
            this.x = eval(this.xValue)
        }
        this.hover = false;
        if (this.visible) {
            if (detectCollision(this.x, this.y, this.w, this.h, mouse.x, mouse.y, 1, 1)) {
                this.hover = true;
            }
            if (this.hover && mouse.down) {
                mouse.down = false;
                this.onClick();
            }
            if (this.hover && mouse.rightDown) {
                this.onRightClick();
            }

            this.draw()
        }
        this.visible = false;
    }
    draw() {
        if (this.hover) {
            c.fillStyle = "gray"
        } else[
            c.fillStyle = "black"
        ]
        c.strokeStyle = "black";
        c.lineWidth = 5;
        c.fillRect(this.x, this.y, this.w, this.h)
        c.strokeRect(this.x, this.y, this.w, this.h)

        c.fillStyle = "white";
        let fontsize = (1 / this.textsize.width) * 10000 > 28 ? 28 : (1 / this.textsize.width) * 10000
        c.font = fontsize + "px serif";
        console.log(fontsize)
        c.textAlign = "center";
        c.fillText(this.text, this.x + this.w / 2, this.y + this.h - 5)
    };
}
class Input {
    constructor(y) {
        this.y = y;
        this.wireConnector = new WireConnector(40, this.y + 12.5, true);
        this.on = false;
    };
    update() {
        if (detectCollision(10, this.y, 25, 50, mouse.x, mouse.y, 1, 1)) {
            if (mouse.rightDown) {
                this.wireConnector.wireArray.forEach(e => e.remove())
                inputArray.splice(inputArray.indexOf(this), 1);
            }
            if (this.on) {
                c.fillStyle = "darkred";
            } else {
                c.fillStyle = "gray";
            }
            if (mouse.down) {
                mouse.down = false;
                this.on = !this.on;
            }
        } else {
            if (this.on) {
                c.fillStyle = "red";
            } else {
                c.fillStyle = "black";
            }
        };
        this.draw();
        this.wireConnector.on = this.on;
        this.wireConnector.update();
    };
    draw() {
        c.fillRect(10, this.y, 25, 50);
    };
};
class Output {
    constructor(y) {
        this.y = y;
        this.wireConnector = new WireConnector(canvas.width - 45 - 25, this.y + 12.5, false, this);
        this.on = false;
        this.hover = false;
    }
    update() {
        this.hover = detectCollision(canvas.width - 20 - 25, this.y, 25, 50, mouse.x, mouse.y, 1, 1)
        if (this.hover) {
            if (mouse.rightDown) {
                this.wireConnector.wireArray.forEach(e => e.remove())
                outputArray.splice(inputArray.indexOf(this), 1);
            }
        }
        this.draw()
        this.wireConnector.x = canvas.width - 45 - 25;
        this.wireConnector.update();
    }
    draw() {
        if (this.on) {
            if (this.hover) {
                c.fillStyle = "darkred"
            } else {
                c.fillStyle = "red"
            }
        } else {
            if (this.hover) {
                c.fillStyle = "gray"
            } else {
                c.fillStyle = "black"
            }
        }
        c.fillRect(canvas.width - 20 - 25, this.y, 25, 50);
    }
}

class Display {
    constructor(x, y, visualOnly) {
        this.x = x;
        this.y = y;
        this.visualOnly = visualOnly;
        this.inputs = [];

        for (let i = 0; i < 8; i++) {
            if (!this.visualOnly) {
                this.inputs.push(new WireConnector(this.x - 30, this.y + (((8 * 30) / 8) - 20) / 2 + (8 * 30) / 8 * i, false))
            } else {
                this.inputs.push({ on: false })
            }
        };
        this.outputs = [0, 0, 0, 0, 0, 0, 0, 0]
        this.type = "disp"

    }
    update() {
        if (!this.visualOnly) {
            this.hover = detectCollision(this.x, this.y, 160, Math.max(this.inputs.length, this.outputs.length) * 30, mouse.x, mouse.y, 1, 1)
            if (this.hover) {
                if (mouse.rightDown) {
                    this.inputs.forEach(g => { g.wireArray.forEach(e => e.remove()) })
                    gateArray.splice(gateArray.indexOf(this), 1);
                }
                if (mouse.down && mouse.isMoving == undefined || mouse.down && mouse.isMoving == this) {

                    mouse.isMoving = this;
                    let self = this;
                    if (gateArray.filter(e => e !== self && detectCollision(e.x - 60, e.y, 150, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, Math.max(this.inputAmount, this.outputAmount) * 15)).length == 0) {
                        this.x = mouse.x - 160 / 2;
                        this.y = mouse.y - 240 / 2;
                        for (let i = 0; i < 8; i++) {
                            this.inputs[i].x = this.x - 30
                            this.inputs[i].y = this.y + (((8 * 30) / 8) - 20) / 2 + (8 * 30) / 8 * i
                        };
                    }
                } else if (mouse.isMoving === this) {
                    mouse.isMoving = undefined;
                    mouse.down = false;
                }
            }
            this.inputs.forEach(e => e.update())
        }

        this.draw();

    }
    draw() {
        if (this.hover) {
            c.strokeStyle = "gray";
        } else {
            c.strokeStyle = "black";
        }
        c.lineWidth = 5
        c.strokeRect(this.x, this.y, 160, Math.max(this.inputs.length, this.outputs.length) * 30)
        c.fillStyle = this.inputs[0].on ? "black" : "lightgray"
        c.fillRect(this.x + 40, this.y + 20, 100, 20)

        c.fillStyle = this.inputs[1].on ? "black" : "lightgray"
        c.fillRect(this.x + 120, this.y + 20, 20, 110)

        c.fillStyle = this.inputs[2].on ? "black" : "lightgray"
        c.fillRect(this.x + 120, this.y + 100, 20, 110)

        c.fillStyle = this.inputs[3].on ? "black" : "lightgray"
        c.fillRect(this.x + 40, this.y + 20 + 190, 100, 20)

        c.fillStyle = this.inputs[4].on ? "black" : "lightgray"
        c.fillRect(this.x + 40, this.y + 100, 20, 110)

        c.fillStyle = this.inputs[5].on ? "black" : "lightgray"
        c.fillRect(this.x + 40, this.y + 20, 20, 110)

        c.fillStyle = this.inputs[6].on ? "black" : "lightgray"
        c.fillRect(this.x + 40, this.y + 20 + 95, 100, 20)

        c.fillStyle = this.inputs[7].on ? "black" : "lightgray"
        c.fillRect(this.x + 5, this.y + 120, 30, 10)


    }
}

class Gate {
    constructor(x, y, gate) {
        this.x = x;
        this.y = y;
        this.name = gate.name;
        this.gate = gate;
        this.displays = [];

        this.hover = false;
        this.inputs = [];
        this.outputs = []
        this.inputConnectors = [];
        this.outputConnectors = [];
        this.insideGates = [];
        this.init();

    };
    async init() {
        let table = this.gate.table;
        if (table) {
            this.tableInputs = Object.keys(table).map(e => e.split("").map(e => JSON.parse(e)));
            this.inputAmount = this.tableInputs[0].length;
            this.tableOutputs = Object.values(table).map(e => e.split("").map(e => JSON.parse(e)));
            this.outputAmount = this.tableOutputs[0].length;
            this.inputs = [];
            for (let i = 0; i < this.inputAmount; i++) {
                this.inputs.push(new WireConnector(this.x - 30, this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30) / this.inputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30) / this.inputAmount * i, false))
            };

            this.outputs = [];
            for (let i = 0; i < this.outputAmount; i++) {
                this.outputs.push(new WireConnector(this.x + 115, this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30) / this.outputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30) / this.outputAmount * i, true))
            };
        } else {
            let values = this.gate.values;
            this.inputAmount = JSON.parse(values.input).length;
            this.outputAmount = JSON.parse(values.output).length;
            let inputArray = JSON.parse(values.input).sort(function (a, b) { return a.y - b.y });
            let outputArray = JSON.parse(values.output).sort(function (a, b) { return a.y - b.y });
            let gateArray = JSON.parse(values.gate)
            this.insideGates = [];

            this.displays = [];
            for (let i = 0; i < JSON.parse(values.gate).length; i++) {
                if (gateArray[i].name) {
                    this.insideGates.push(new Gate(gateArray[i].x - 10000, gateArray[i].y - 10000, gates[gates.map(e => e.name).indexOf(JSON.parse(values.gate)[i].name)]))
                }
            }
            for (let i = 0; i < gateArray.filter(e => e.type == "disp").length; i++) {
                this.displays.push(new Display(this.x + i * 160, this.y, true))
                this.insideGates.push(new Display(gateArray.filter(e => e.type == "disp")[i].x - 10000, gateArray.filter(e => e.type == "disp")[i].y - 10000))
            }

            let self = this;
            this.insideGates.forEach(e => {
                if (e.displays == undefined) {
                    e.displays = []
                };
                e.displays.forEach((g, i) => {
                    this.displays.push(new Display(self.x + i * 160, self.y, true))
                })
            })
            for (let i = 0; i < this.displays.length; i++) {
                this.displays[i].x = this.x - 160 * i + (this.displays.length - 1) * 160;
                this.displays[i].y = this.y;
            };
            this.inputs = [];
            this.inputConnectors = [];
            for (let i = 0; i < this.inputAmount; i++) {
                this.inputs.push(new WireConnector(this.x - 30, this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30) / this.inputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30) / this.inputAmount * i, false))
                this.inputConnectors.push(new WireConnector(inputArray[i].wireConnector.x - 10000, inputArray[i].wireConnector.y - 10000, true))
            };

            this.outputs = [];
            this.outputConnectors = [];
            for (let i = 0; i < this.outputAmount; i++) {
                this.outputs.push(new WireConnector(this.x + 15 + Math.max(100, this.displays.length * 160), this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30) / this.outputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30) / this.outputAmount * i, true))
                this.outputConnectors.push(new WireConnector(outputArray[i].wireConnector.x - 10000, outputArray[i].wireConnector.y - 10000, true))
            };


            let wireArray = JSON.parse(values.wires);
            wireArray = wireArray.map(e => JSON.parse(e))

            this.inputConnectors.forEach(e => {
                wireArray.forEach(g => {

                    if (g.from.x - 10000 == e.x && g.from.y - 10000 == e.y) {

                        self.insideGates.forEach(h => {
                            h.inputs.forEach(b => {
                                if (g.to.x - 10000 == b.x && g.to.y - 10000 == b.y) {
                                    let wire = new Wire(e, b, g.stepArray, false);
                                    e.wireArray.push(wire);
                                    b.wireArray.push(wire)
                                }
                            })
                        })
                        self.outputConnectors.forEach(h => {
                            if (g.to.x - 10000 == h.x && g.to.y - 10000 == h.y) {
                                let wire = new Wire(e, h, g.stepArray, false);
                                e.wireArray.push(wire);
                                h.wireArray.push(wire)
                            }

                        })
                    }
                })
            })
            this.insideGates.forEach(e => {
                wireArray.forEach(g => {
                    e.outputs.forEach(async function (a) {
                        if (g.from.x - 10000 == a.x && g.from.y - 10000 == a.y) {
                            self.insideGates.forEach(h => {
                                h.inputs.forEach(b => {
                                    if (g.to.x - 10000 == b.x && g.to.y - 10000 == b.y) {
                                        let wire = new Wire(a, b, g.stepArray, false);
                                        a.wireArray.push(wire);
                                        b.wireArray.push(wire)
                                    }
                                })
                            })
                            await new Promise(resolve => setTimeout(resolve, 10));
                            self.outputConnectors.forEach(h => {
                                if (g.to.y - 10000 == h.y) {
                                    let wire = new Wire(a, h, [], false);
                                    a.wireArray.push(wire);
                                    h.wireArray.push(wire)
                                }

                            })
                        }
                    })
                })
            })

        }

    }
    update() {
        this.hover = detectCollision(this.x, this.y, Math.max(100, this.displays.length * 160), Math.max(Math.max(this.inputs.length, this.outputs.length) * 30, this.displays.length ? 30 * 8 : 0), mouse.x, mouse.y, 1, 1)
        if (mouse.isMoving === this) {
            this.hover = true;
        }
        if (this.hover) {
            if (mouse.rightDown) {
                this.outputs.forEach(g => { g.wireArray.forEach(e => e.remove()) })
                this.inputs.forEach(g => { g.wireArray.forEach(e => e.remove()) })
                gateArray.splice(gateArray.indexOf(this), 1);
            }
            if (mouse.down && mouse.isMoving == undefined || mouse.down && mouse.isMoving == this) {

                mouse.isMoving = this;
                let self = this;
                if (gateArray.filter(e => e !== self && detectCollision(e.x - 60, e.y, 150, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, Math.max(this.inputAmount, this.outputAmount) * 15)).length == 0) {
                    this.x = mouse.x - 25 / 2;
                    this.y = mouse.y - 50 / 2;
                    for (let i = 0; i < this.inputAmount; i++) {
                        this.inputs[i].x = this.x - 30
                        this.inputs[i].y = this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30) / this.inputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30) / this.inputAmount * i
                    };
                    for (let i = 0; i < this.outputAmount; i++) {
                        this.outputs[i].x = this.x + 15 + Math.max(100, this.displays.length * 160)
                        this.outputs[i].y = this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30) / this.outputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30) / this.outputAmount * i
                    };
                    for (let i = 0; i < this.displays.length; i++) {
                        this.displays[i].x = this.x - 160 * i + (this.displays.length - 1) * 160;
                        this.displays[i].y = this.y;
                    };
                }
            } else if (mouse.isMoving === this) {
                mouse.isMoving = undefined;
                mouse.down = false;
            }
        }

        if (this.gate.table) {
            let inputThing = this.inputs.map(e => e.on == true ? 1 : 0)
            let outputIndex = undefined;
            this.tableInputs.forEach(function (e, i) {
                if (e.toString() == inputThing.toString()) {
                    outputIndex = i;
                };
            });
            let self = this;
            this.outputs.forEach(function (e, i) {
                e.on = self.tableOutputs[outputIndex][i] == 0 ? false : true;
            });
        }
        let self = this;
        this.inputConnectors.forEach(function (e, i) {
            e.update()
            e.on = self.inputs[i].on;
        });
        this.outputConnectors.forEach(function (e, i) {
            e.update()
            self.outputs[i].on = e.on;
        });
        this.insideGates.forEach(function (e, i) {
            e.update();
        });
        this.displays.forEach(function (e, i) {
            e.update();
        });
        this.insideGates.filter(e => e.type == "disp").forEach((e, i, a) => {
            e.inputs.forEach((g, h) => {
                self.displays[a.length - i - 1].inputs[h].on = g.on;
            })
        })
        let dispAmount = 0;
        this.insideGates.forEach((e, d) => {
            if (e.displays.length) {
                e.displays.forEach((g, b) => {
                    dispAmount++;
                    g.inputs.forEach((h, i) => {

                        self.displays[dispAmount - 1].inputs[i].on = h.on;
                    })
                })
            }
        })


        this.inputs.forEach(e => e.update());
        this.outputs.forEach(e => e.update());
        this.draw();
    };
    draw() {
        if (this.hover) {
            c.strokeStyle = "gray";
        } else {
            c.strokeStyle = "black";
        }
        c.lineWidth = 5
        c.strokeRect(this.x, this.y, Math.max(100, this.displays.length * 160), Math.max(Math.max(this.inputs.length, this.outputs.length) * 30, this.displays.length ? 30 * 8 : 0))
        c.fillStyle = "black";
        c.font = "28px serif";
        c.textAlign = "center";
        if (this.displays.length == 0) {
            c.fillText(this.name, this.x + 100 / 2, this.y + Math.max(this.inputs.length, this.outputs.length) * 15 + 10)
        }
    };
};

class WireConnector {
    constructor(x, y, isOut, outputThing) {
        this.x = x;
        this.y = y;
        this.isOut = isOut;
        this.wireArray = [];
        this.on = false;
        this.outputThing = outputThing;
    }
    update() {
        if (detectCollision(this.x, this.y, 20, 20, mouse.x, mouse.y, 1, 1)) {
            if (mouse.down) {

                if (mouse.drawingWireFrom) {
                    if (mouse.drawingWireFrom.isOut !== this.isOut) {
                        if (this.isOut) {
                            mouse.down = false;

                            let wire = new Wire(this, mouse.drawingWireFrom, mouse.stepArray);
                            mouse.stepArray = [];
                            this.wireArray.push(wire);
                            mouse.drawingWireFrom.wireArray.push(wire)

                            mouse.drawingWireFrom = undefined;
                        } else if (this.wireArray.length == 0) {
                            mouse.down = false;

                            let wire = new Wire(mouse.drawingWireFrom, this, mouse.stepArray);
                            mouse.stepArray = [];
                            this.wireArray.push(wire);
                            mouse.drawingWireFrom.wireArray.push(wire)

                            mouse.drawingWireFrom = undefined;
                        }
                    }
                } else {
                    mouse.down = false;
                    mouse.drawingWireFrom = this;
                    mouse.stepArray = [];
                }
            }
            if (this.on) {
                c.fillStyle = "darkred";
            } else {
                c.fillStyle = "gray";
            }
        } else {
            if (this.on) {
                c.fillStyle = "red";
            } else {
                c.fillStyle = "black";
            }
        };
        let self = this;
        if (this.isOut) {
            this.wireArray.forEach(e => e.on = self.on);
        }
        if (this.outputThing) {
            this.outputThing.on = this.on;
        }

        this.wireArray.forEach(e => e.update());
        this.draw();

    };
    draw() {
        c.fillRect(this.x, this.y, 20, 20);
    };
};

class Wire {
    constructor(from, to, stepArray, drawing) {
        this.from = from;
        this.to = to;
        this.on = false;
        this.hover = false;
        this.stepArray = stepArray;
        this.drawing = drawing;
        if (this.drawing == undefined) {
            this.drawing = true;
        }
    };
    update() {
        this.draw();
        this.to.on = this.on;
        let circle = [mouse.x, mouse.y]
        let radius = 10
        let self = this;
        this.hover = false;
        this.stepArray.forEach(function (e, i) {
            let a, b;
            if (i === 0) {
                a = [self.from.x + 12.5, self.from.y + 12.5];
            } else {
                a = [self.stepArray[i - 1].x, self.stepArray[i - 1].y];
            }
            if (i === self.stepArray.length - 1) {
                b = [self.to.x + 12.5, self.to.y + 12.5];
            } else {
                b = [self.stepArray[i].x, self.stepArray[i].y];
            }
            if (lineCircleCollide(a, b, circle, radius)) {
                self.hover = true
            }
            if (self.hover && mouse.rightDown) {
                self.remove();
            }
        })

    };
    remove() {
        this.from.wireArray.splice(this.from.wireArray.indexOf(this), 1)
        this.to.on = false;
        this.to.wireArray.splice(this.to.wireArray.indexOf(this), 1)
        this.to = undefined;
    }
    draw() {
        if (this.drawing) {
            if (this.on) {
                if (this.hover) {
                    c.strokeStyle = "darkred";
                } else {
                    c.strokeStyle = "red";
                }
            } else {
                if (this.hover) {
                    c.strokeStyle = "gray";
                } else {
                    c.strokeStyle = "black";
                }
            }
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(this.from.x + 12.5, this.from.y + 12.5);
            this.stepArray.forEach(e => {
                c.lineTo(e.x, e.y);
            })
            c.lineTo(this.to.x + 12.5, this.to.y + 12.5);
            c.stroke();
        }
    };
};

resize();
init();
update();
