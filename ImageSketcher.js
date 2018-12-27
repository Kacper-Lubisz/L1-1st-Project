"use strict";

class ImageSketcher extends P5Component {

    constructor(image, width, height, startStopped = false) {
        super();
        if (image === undefined) {
            throw new TypeError("image is undefined, you must pass an image");
        }

        this.image = image;
        this.width = width; // width and height are dealt with when the image is loaded
        this.height = height;

        // this is random such that different instances of this object don't have the same noise
        this.noiseTimeOffset = 0;
        this.particles = [];
        this.particleCount = 50;
        this.stepsPerFrame = 5;
        this._isStopped = startStopped;

        this._forceClear = false;

        this._onKeyListener = function (key) {
        };
        this._onClickListener = function (x, y) {
        };

    }

    /**
     * @throws `404 Not found` error if `this.image` is a string an can't be loaded
     */
    preload() {
        if (typeof this.image === "string") {
            this.image = this.loadImage(this.image);
            // this could throw an error if the file isn't found
        }
    }

    setup(parent) {

        if (this.width === undefined && this.height === undefined) { // nothing give, taken from image
            this.width = this.image.width;
            this.height = this.image.height;
        } else if (this.width === undefined) { // height, infer width from aspect ration
            this.width = image.width / image.height * this.height;
        } else if (this.height === undefined) { // width, infer height from aspect ration
            this.height = image.height / image.width * this.width;
        } // else values are already good

        if (parent === undefined) {
            this.createCanvas(this.width, this.height);
        }
        this.setImage(this.image);

        this.noiseTimeOffset = this.random(0, 10);

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this));
        }

        this.background(255, 255, 255);
        this.colorMode(this.RGB, 255);

    }

    /**
     * This method draws the image sketcher object on the canvas
     * @param canvas {p5} The canvas to be drawn on
     */
    draw(canvas) {
        if (this._forceClear) {
            canvas.clear();
            this._forceClear = false;
        }

        if (!this._isStopped) {

            for (let i = 0; i < this.particleCount; i++) {
                for (let j = 0; j < this.stepsPerFrame; j++) {
                    this.particles[i].update();
                    this.particles[i].paint(canvas);
                }
            }
        }
    }

    setImage(newImage) {

        this.image = this.createImage(this.floor(this.width), this.floor(this.height));
        this.image.copy(newImage, 0, 0, newImage.width, newImage.height, 0, 0, this.image.width, this.image.height);
        this.image.loadPixels();
        this._forceClear = true
    }

    mouseClicked() {
        this._onClickListener(this.mouseX, this.mouseY)
    }

    keyPressed() {
        this._onKeyListener(this.key)
    }

    forceClear() {
        this._forceClear = true;
    }

    get startStopped() {
        return this._isStopped;
    }

    set startStopped(value) {
        this._isStopped = value;
    }

    set onClickListener(value) {
        this._onClickListener = value;
    }

    set onKeyListener(value) {
        this._onKeyListener = value;
    }
}