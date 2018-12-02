"use strict";

const images = [];
let imgIndex = -1;
let img;
let paint = [];
const particleCount = 50;
let stepsPerFrame = 15;
let z = 0;
let isStop = false;

function preload() {
    images[0] = loadImage("test1.png");
    images[1] = loadImage("test2.png");
    images[2] = loadImage("test3.png");
}

function setup() {
    const size = max(min(windowWidth, windowHeight), 600);
    createCanvas(size, size);

    img = createImage(width, height);
    nextImage();
    for (let i = 0; i < particleCount; i++) {
        paint.push(new Particle());
    }

    background(255, 255, 255);
    colorMode(RGB, 255, 255, 255, 255);
}

function draw() {
    //console.log(frameRate());
    if (!isStop) {
        for (let i = 0; i < particleCount; i++) {
            for (let j = 0; j < stepsPerFrame; j++) {
                paint[i].update();
                paint[i].show();
            }
        }
        z += 0.01;
    }
    //background(255);
    //image(img, 0, 0, width, height);
}

function fget(i, j) {
    const index = (j * img.width + i) * 4;
    return color(img.pixels[index], img.pixels[index + 1], img.pixels[index + 2], img.pixels[index + 3]);
}

function fset(i, j, c) {
    const index = (j * img.width + i) * 4;
    img.pixels[index] = red(c);
    img.pixels[index + 1] = green(c);
    img.pixels[index + 2] = blue(c);
    img.pixels[index + 3] = alpha(c);
}

function keyPressed() {
    console.log(key);
    if (key === 's' || key === 'S') {
        isStop = !isStop;
    }
}

function mouseClicked() {
    nextImage();
}

function touchStarted() {
    nextImage();
}

function nextImage() {
    if (!img) return;
    imgIndex = (imgIndex + 1) % images.length;
    let targetImg = images[imgIndex];
    img.copy(targetImg, 0, 0, targetImg.width, targetImg.height, 0, 0, img.width, img.height);
    //img.resize(width, height);
    img.loadPixels();
    clear();
}