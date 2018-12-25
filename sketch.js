"use strict";

p5.Image.prototype.getColor = function (x, y) {
    console.log(x, y);
    const index = (y * this.width + x) * 4;
    return color(this.pixels[index], this.pixels[index + 1], this.pixels[index + 2], this.pixels[index + 3]);
};
p5.Image.prototype.setColor = function (x, y, color) {
    const index = (y * this.width + x) * 4;
    for (let i = 0; i < 4; i++) {
        this.pixels[index + i] = color.levels[i];
    }
};

let images = ["test1.png", "test2.png", "test3.png", "test4.png"];
let components = [];
let canvas;
let subCanvases = {};

function preload() {
    images = images.map(function (name) {
        return loadImage(name);
    })
}

function setup() {

    // add pixel set and get extension methods to the image prototype
    const size = max(min(windowWidth, windowHeight), 600);
    canvas = createCanvas(size, size);

    components[0] = new Sketcher(new Bounds(0, 0, size / 2, size / 2), images[0]);
    components[1] = new Sketcher(new Bounds(size / 2, 0, size / 2, size / 2), images[1]);
    components[2] = new Sketcher(new Bounds(0, size / 2, size / 2, size / 2), images[2]);
    components[3] = new Sketcher(new Bounds(size / 2, size / 2, size / 2, size / 2), images[3]);

    background(255, 255, 255);
    colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
    components.forEach(function (comp) {
        // create the canvas that each component is going to draw on
        // this means that each component is isolated from all others
        // a new canvas is not created of one already exists

        canvas = subCanvases[comp] || createGraphics(comp.bounds.width, comp.bounds.width);
        subCanvases[comp] = canvas;
		
        comp.draw(canvas);
        image(canvas, comp.bounds.x, comp.bounds.y); // temporary canvas to main canvas

    });
}

function keyPressed() {
    console.log(key);
    if (key === 's' || key === 'S') {
        // this.isStop = !isStop;
    }
}

function mouseClicked() {
    components.filter(function (comp) {
        return mouseX > comp.bounds.x && mouseX < comp.bounds.x + comp.bounds.width &&
            mouseY > comp.bounds.y && mouseY < comp.bounds.y + comp.bounds.height
    }).forEach(function (comp) {
        comp.setImage(images[floor(random(0, images.length))])
    })
}

function touchStarted() {
    mouseClicked();
}

class Bounds {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}