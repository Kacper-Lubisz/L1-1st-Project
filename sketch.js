"use strict";

let images = ["test1.png", "test2.png", "test3.png"]
let components = [];
let canvas;
let subCanvases = {}

function preload() {
	images = images.map(function(name){  
		return loadImage(name);
	})	
}

function setup() {
	
	// add pixel set and get extension methods to the image prototype
	p5.Image.prototype.fget = function(x, y) {
		const index = (y * this.width + x) * 4;
		
		console.log(this.pixels.slice(index, index + 4))
		
		return color(this.pixels.slice(index, index + 4));
	}
	p5.Image.prototype.fset = function(x, j, c) {
		const index = (y * this.width + x) * 4;
		for (let i = 0; i < 4; i++) {
			this.pixels[index + i] = c.levels[i];
		}
	}
	
	const size = max(min(windowWidth, windowHeight), 600);
	canvas = createCanvas(size, size);
		
	components[0] = new Sketcher(new Bounds(0, 0, size / 2, size / 2), images)
	components[1] = new Sketcher(new Bounds(size / 2, 0, size / 2, size / 2), images)
	components[2] = new Sketcher(new Bounds(0, size / 2, size / 2, size / 2), images)
	components[3] = new Sketcher(new Bounds(size / 2, size / 2, size / 2, size / 2), images)
		
	background(255, 255, 255);
	colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
	components.forEach(function(comp) {
		// create the canvas that each component is going to draw on
		// this means that each component is isolated from all others
		// a new canvas is not created of one already exists
		
		canvas = subCanvases[comp] || createGraphics(comp.bounds.width, comp.bounds.width);
		subCanvases[comp] = canvas
		
		comp.draw(canvas)
		image(canvas, comp.bounds.x, comp.bounds.y); // temporary canvas to main canvas
		
	});
}

function keyPressed() {
	console.log(key);
	if (key === 's' || key === 'S') {
		isStop = !isStop;
	}
}

function nextImage(){
	components.forEach(function(comp){
		comp.nextImage()
	})
}

function mouseClicked() {
	nextImage();
}

function touchStarted() {
	nextImage();
}

class Bounds {
	constructor(x, y, width, height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}