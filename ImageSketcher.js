"use strict";

class ImageSketcher extends P5Component {
    constructor(targetImage, width, height, particleCount = 100, stepsPerFrame = 5, startStopped = false) {
        super();

        if (!targetImage instanceof p5.Image || typeof targetImage !== "string") {
            throw new TypeError("image is undefined, you must pass an image or the address to one");
        }

        this._targetImage = targetImage;
        this._width = width; // width and height are dealt with when the image is loaded (must by the end of setup)
        this._height = height;

        this._noiseTimeOffset = 0; // init in setup
        this._particles = [];
        this._stepsPerFrame = stepsPerFrame;
        this._particleCount = particleCount;

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
        if (typeof this._targetImage === "string") {
            this._targetImage = this.loadImage(this._targetImage);
            // this could throw an error if the file isn't found
        }
    }

    setup(parent) {

        if (this._width === undefined && this._height === undefined) { // nothing give, taken from image
            this._width = this._targetImage.width;
            this._height = this._targetImage.height;
        } else if (this._width === undefined) { // height, infer width from aspect ration
            this._width = image.width / image.height * this._height;
        } else if (this._height === undefined) { // width, infer height from aspect ration
            this._height = image.height / image.width * this._width;
        } // else values are already good

        if (parent === undefined) {
            this.createCanvas(this._width, this._height);
        }
        this.targetImage = this._targetImage; // call the setter

        this._noiseTimeOffset = this.random(0, 10);
        // this is random such that different instances of this object don't have the same noise

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

            // make sure that the number of particles matches the specified number
            if (this._particles.length < this._particleCount) {
                const newParticles = this._particleCount - this._particles.length;
                for (let i = 0; i < newParticles; i++) {
                    this._particles.push(new Particle(this));
                }
            } else if (this._particles.length < this._particleCount) {
                // it is possible for more particles to exist than the target, if the target is changed
                const particlesToDelete = this._particleCount - this._particles.length;
                for (let i = 0; i < particlesToDelete; i++) {
                    this._particles.shift() // remove the first element
                }
            }

            for (let i = 0; i < this._particleCount; i++) {
                for (let j = 0; j < this._stepsPerFrame; j++) {
                    this._particles[i].update();
                    this._particles[i].paint(canvas);
                }
            }
        }
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

    get isStopped() {
        return this._isStopped;
    }

    set isStopped(value) {
        this._isStopped = value;
    }

    set onClickListener(value) {
        this._onClickListener = value;
    }

    set onKeyListener(value) {
        this._onKeyListener = value;
    }

    get stepsPerFrame() {
        return this._stepsPerFrame;
    }

    set stepsPerFrame(value) {
        this._stepsPerFrame = value;
    }

    get particleCount() {
        return this._particleCount;
    }

    set particleCount(value) {
        this._particleCount = value;
    }

    get targetImage() {
        return this._targetImage;
    }

    set targetImage(value) {
        if (typeof value === "string") {
            value = this.p5.loadImage(p5)
            // this may fail and error out
        }
        if (!value instanceof p5.Image) {
            throw TypeError("targetImage must be of type string or image");
        }

        this._targetImage = this.createImage(this.floor(this._width), this.floor(this._height));
        this._targetImage.copy(value, 0, 0, value.width, value.height, 0, 0, this._targetImage.width, this._targetImage.height);
        this._targetImage.loadPixels();
        this._forceClear = true
    }

    get height() {
        return this._height;
    }

    get width() {
        return this._width;
    }

}