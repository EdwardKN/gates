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
    if (e.keyCode === 27) {
        mouse.drawingWireFrom = undefined;
    }
})

function detectCollision(x, y, w, h, x2, y2, w2, h2) {
    if (x + w > x2 && x < x2 + w2 && y + h > y2 && y < y2 + h2) {
        return true;
    };
};

function update() {
    requestAnimationFrame(update);

    render();
    inputArray.forEach(e => e.update());
    outputArray.forEach(e => e.update());
    gateArray.forEach(e => e.update());

};

function render() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (mouse.drawingWireFrom) {
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(mouse.drawingWireFrom.x, mouse.drawingWireFrom.y);
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
            }
        } else if (mouse.x > canvas.width - 100) {
            if (inputArray.filter(e => detectCollision(10, e.y - 50 / 2, 25, 50, 10, mouse.y - 50, 25, 50)).length == 0) {
                c.fillRect(canvas.width - 25 - 20, mouse.y - 50 / 2, 25, 50);
                if (mouse.down) {
                    mouse.down = false;
                    outputArray.push(new Output(mouse.y - 50 / 2));
                };
            }
        } else {
            if (gateArray.filter(e => detectCollision(e.x, e.y, 25, Math.max(e.inputs.length, e.outputs.length) * 30, mouse.x - 200 / 2, mouse.y - 50 / 2, 200, 50)).length == 0) {
                c.fillRect(mouse.x - 25 / 2, mouse.y - 50 / 2, 25, 50);
                if (mouse.down) {
                    mouse.down = false;
                    gateArray.push(new Gate(mouse.x - 25 / 2, mouse.y - 50 / 2, 2, 1));
                };
            }
        };
    }
};

var inputArray = [];
var outputArray = [];
var gateArray = [];

class Input {
    constructor(y) {
        this.y = y;
        this.wireConnector = new WireConnector(40, this.y + 12.5, true);
        this.on = false;
    };
    update() {
        if (detectCollision(10, this.y, 25, 50, mouse.x, mouse.y, 1, 1)) {
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
        this.wireConnector = new WireConnector(canvas.width - 45 - 25, this.y + 12.5, false);
        this.on = false;
    }
    update() {
        this.draw()
        this.wireConnector.update();
    }
    draw() {
        c.fillRect(canvas.width - 20 - 25, this.y, 25, 50);
    }
}

class Gate {
    constructor(x, y, inputAmount, outputAmount) {
        this.x = x;
        this.y = y;
        this.inputs = [];
        for (let i = 0; i < inputAmount; i++) {
            this.inputs.push(new WireConnector(this.x - 30, this.y + i * 30, false))
        };
        this.outputs = [];
        for (let i = 0; i < outputAmount; i++) {
            this.outputs.push(new WireConnector(this.x + 35, this.y + i * 30, true))
        };
    };
    update() {
        this.inputs.forEach(e => e.update());
        this.outputs.forEach(e => e.update());
        this.draw();
    };
    draw() {
        c.fillStyle = "black";
        c.fillRect(this.x, this.y, 25, Math.max(this.inputs.length, this.outputs.length) * 30)
    };
};

class WireConnector {
    constructor(x, y, isOut) {
        this.x = x;
        this.y = y;
        this.isOut = isOut;
        this.wireArray = [];
        this.on = false;
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
    };
    update() {
        this.draw();
        this.to.on = this.on;
    };
    draw() {
        if (this.on) {
            c.strokeStyle = "red";
        } else {
            c.strokeStyle = "black";
        }
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(this.from.x, this.from.y);
        c.lineTo(this.to.x, this.to.y);
        c.stroke();
    };
};

resize();
update();