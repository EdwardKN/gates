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
    drawingWireFrom: undefined,
    drawingGate: undefined,
    isRemoving: false,
    isMoving: undefined
};

window.addEventListener("resize", resize);

canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.offsetX
    mouse.y = e.offsetY
});
canvas.addEventListener("mousedown", function (e) {
    mouse.down = true;
});
canvas.addEventListener("mouseup", function (e) {
    mouse.down = false;
});

window.addEventListener("keydown", function (e) {
    if(e.keyCode >= 49 && e.keyCode <= 57){
        mouse.drawingGate = gates[e.keyCode-49];
    }
    if (e.keyCode === 27) {
        mouse.drawingWireFrom = undefined;
        mouse.drawingGate = undefined;
    }
    if (e.keyCode === 8) {
        mouse.isRemoving = true;
    }
})
window.addEventListener("keyup", function (e) {
    if (e.keyCode === 8) {
        mouse.isRemoving = false;
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
var saveButton = undefined;

function update() {
    requestAnimationFrame(update);

    render();
    buttons.forEach(e => e.update());
    inputArray.forEach(e => e.update());
    outputArray.forEach(e => e.update());
    gateArray.forEach(e => e.update());

};

function init() {
    gates.forEach(function (e, i) {
        e.button = new Button(10 + 110 * i, 10, 100, 30, e.name, function () {
            mouse.drawingGate = e;
        })
    })
    saveButton = new Button('canvas.width - 120', 10, 100, 30, "SAVE", save)
}

async function save() {
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
    }
    
    let name = prompt("Name of component: ") || 'Default'
    gates.push( { name: name, table: save })
    init()

}

function render() {
    saveButton.visible = true;
    gates.forEach(e => e.button.visible = true)
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = "gray"
    c.fillRect(0, 0, canvas.width, 50)
    if (mouse.y > 75 && mouse.isMoving == undefined) {
        if (mouse.drawingWireFrom) {
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(mouse.drawingWireFrom.x + 12.5, mouse.drawingWireFrom.y + 12.5);
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
                let tableInputs = Object.keys(mouse.drawingGate.table).map(e => e.split("").map(e => JSON.parse(e)));
                let tableOutputs = Object.values(mouse.drawingGate.table).map(e => e.split("").map(e => JSON.parse(e)));
                c.fillStyle = "gray"
                c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);

                if (gateArray.filter(e => detectCollision(e.x - 60, e.y, 150, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, Math.max(tableInputs.length, tableOutputs.length) * 15)).length == 0) {
                    c.fillStyle = "black"
                    c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);

                    c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 100, Math.max(tableInputs.length, tableOutputs.length) * 15);
                    if (mouse.down) {
                        mouse.down = false;
                        gateArray.push(new Gate(mouse.x - 25 / 2, mouse.y - 50 / 2, mouse.drawingGate));
                        mouse.drawingGate = false;
                    };
                };
            };
        };
    };
};

var inputArray = [];
var outputArray = [];
var gateArray = [];
var buttons = [];

class Button {
    constructor(x, y, w, h, text, onClick) {
        this.xValue = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.hover = false;
        this.onClick = onClick;
        this.visible = false;
        this.text = text;
        this.x = this.xValue;

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
        c.font = "28px serif";
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
            if (mouse.isRemoving) {
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
            if (mouse.isRemoving) {
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

class Gate {
    constructor(x, y, gate) {
        this.x = x;
        this.y = y;
        this.name = gate.name;
        this.gate = gate;

        this.hover = false;
        this.init();

    };
    init() {
        let table = this.gate.table;
        this.tableInputs = Object.keys(table).map(e => e.split("").map(e => JSON.parse(e)));
        this.inputAmount = this.tableInputs[0].length;
        this.tableOutputs = Object.values(table).map(e => e.split("").map(e => JSON.parse(e)));
        this.outputAmount = this.tableOutputs[0].length;
        this.inputs = [];
        for (let i = 0; i < this.inputAmount; i++) {
            this.inputs.push(new WireConnector(this.x - 30, this.y+ (((Math.max(this.inputAmount, this.outputAmount) * 30)/this.inputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30)/this.inputAmount*i, false))
        };

        this.outputs = [];
        for (let i = 0; i < this.outputAmount; i++) {
            this.outputs.push(new WireConnector(this.x + 115, this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30)/this.outputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30)/this.outputAmount*i, true))
        };
    }
    update() {
        this.hover = detectCollision(this.x, this.y, 100, Math.max(this.inputs.length, this.outputs.length) * 30, mouse.x, mouse.y, 1, 1)
        if (mouse.isMoving === this) {
            this.hover = true;
        }
        if (this.hover) {
            if (mouse.isRemoving) {
                this.outputs.forEach(g => { g.wireArray.forEach(e => e.remove()) })
                this.inputs.forEach(g => { g.wireArray.forEach(e => e.remove()) })
                gateArray.splice(gateArray.indexOf(this), 1);
                mouse.isRemoving = false;
            }
            if (mouse.down && mouse.isMoving == undefined ||mouse.down && mouse.isMoving == this) {

                mouse.isMoving = this;
                let self = this;
                if (gateArray.filter(e => e !== self && detectCollision(e.x - 60, e.y, 150, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, Math.max(this.inputAmount, this.outputAmount) * 15)).length == 0) {
                    this.x = mouse.x - 25 / 2;
                    this.y = mouse.y - 50 / 2;
                    for (let i = 0; i < this.inputAmount; i++) {
                        this.inputs[i].x = this.x - 30
                        this.inputs[i].y = this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30)/this.inputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30)/this.inputAmount*i
                    };
                    for (let i = 0; i < this.outputAmount; i++) {
                        this.outputs[i].x = this.x + 115
                        this.outputs[i].y = this.y + (((Math.max(this.inputAmount, this.outputAmount) * 30)/this.outputAmount) - 20) / 2 + (Math.max(this.inputAmount, this.outputAmount) * 30)/this.outputAmount*i
                    };
                }
            } else if (mouse.isMoving === this) {
                mouse.isMoving = undefined;
                mouse.down = false;
            }
        }
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
        c.strokeRect(this.x, this.y, 100, Math.max(this.inputs.length, this.outputs.length) * 30)
        c.fillStyle = "black";
        c.font = "28px serif";
        c.textAlign = "center";
        c.fillText(this.name, this.x + 100 / 2, this.y + Math.max(this.inputs.length, this.outputs.length) * 15 + 10)
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

                            let wire = new Wire(this, mouse.drawingWireFrom);

                            this.wireArray.push(wire);
                            mouse.drawingWireFrom.wireArray.push(wire)

                            mouse.drawingWireFrom = undefined;
                        } else if (this.wireArray.length == 0) {
                            mouse.down = false;

                            let wire = new Wire(mouse.drawingWireFrom, this);

                            this.wireArray.push(wire);
                            mouse.drawingWireFrom.wireArray.push(wire)

                            mouse.drawingWireFrom = undefined;
                        }
                    }
                } else {
                    mouse.down = false;
                    mouse.drawingWireFrom = this;
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
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.on = false;
        this.hover = false;
    };
    update() {
        this.draw();
        this.to.on = this.on;
        let circle = [mouse.x, mouse.y]
        let radius = 10
        let a = [this.from.x + 12.5, this.from.y + 12.5]
        let b = [this.to.x + 12.5, this.to.y + 12.5]
        this.hover = lineCircleCollide(a, b, circle, radius);
        if (this.hover && mouse.isRemoving) {
            this.remove();
        }
    };
    remove() {
        this.from.wireArray.splice(this.from.wireArray.indexOf(this), 1)
        this.to.on = false;
        this.to.wireArray.splice(this.to.wireArray.indexOf(this), 1)
        this.to = undefined;
        this.from = undefined;
    }
    draw() {
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
        c.lineTo(this.to.x + 12.5, this.to.y + 12.5);
        c.stroke();
    };
};

resize();
init();
update();
