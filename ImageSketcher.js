"use strict";

class ImageSketcher extends P5Component {

    static makeRandomParticleGenerator() {
        return function (sketcher) {
            const pos = sketcher.createVector(sketcher.random(0, sketcher.width), sketcher.random(0, sketcher.height));
            const color = sketcher.getColor(sketcher.targetImage, Math.floor(pos.x), Math.floor(pos.y));
            return {pos: pos, color: color};
        };
    }

    constructor(targetImageURL, width, height, optionalParameters) {
        super();

        let { // default values
            particleCount = 100,
            stepsPerFrame = 5,
            startStopped = false,
            startPointGenerator = ImageSketcher.makeRandomParticleGenerator(),
            particleBehaviours = [
                // new MaxDistanceTraveledDeath(particle => particle.p5.random(10, 10)),
                new EvolveColorBehaviour(),
                new UpdateLimitDeathBehaviour(particle => particle.p5.random(75, 100)),
                new OutOfBoundsDeathBehaviour(),
                new LinearOutOfBoundsForceBehaviour(),
                new NoiseForceBehaviour(),
                new SimpleAttractiveForceBehaviour(),
            ],
            onKeyListener = Function(), // empty function
            onClickListener = Function(),

            defaultVel, // a new vector can't be instantiated at this point
            dampeningFactor = 0.99,
            maxSpeed = 3.0,
            dropRate = 0.0008,
            dropAlpha = 150,
            dropMaxSize = 5,
            drawAlpha = 50,
            drawWeight = 1,
        } = optionalParameters || {};

        // TODO add type checks
        this._defaultVel = defaultVel;
        this._dampeningFactor = dampeningFactor;
        this._maxSpeed = maxSpeed;
        this._dropRate = dropRate;
        this._drawAlpha = drawAlpha;
        this._drawWeight = drawWeight;
        this._dropAlpha = dropAlpha;
        this._dropMaxSize = dropMaxSize;

        this._targetImageURL = targetImageURL;
        this._width = Math.floor(width) || undefined;
        this._height = Math.floor(height) || undefined;
        // width and height are dealt with when the image is loaded
        // if undefined is passed it will stay undefined instead of going to NaN

        this._particles = [];
        this._stepsPerFrame = stepsPerFrame;
        this._particleCount = particleCount;

        this._particleStartGenerator = startPointGenerator;
        this._particleBehaviours = particleBehaviours;

        this._isStopped = startStopped;
        this._forceClear = false;

        this._onKeyListener = onKeyListener;
        this._onClickListener = onClickListener;

    }

    /**
     * @throws `404 Not found` error if `this.image` is a string an can't be loaded
     */
    preload() {
        if (this._defaultVel === undefined) {
            this._defaultVel = this.createVector(0, 0)
        }
        this._targetImage = this.loadImage(this.targetImageURL)
    }

    setup(parent) {

        this.targetImage = this._targetImage; // calls the setter
        // loading in p5 is a pain because calling loadImage doesn't return an image
        // only the promise of an image

        if (parent === undefined) {
            this.createCanvas(this.targetImage.width, this.targetImage.height);
        }

        this.background(255, 255, 255);
        this.colorMode(this.RGB, 255);

    }

    _spawnParticle() {

        const startParams = this._particleStartGenerator(this);
        this._particles.push(new Particle(this, startParams));

    }

    /**
     * This method draws the image sketcher object on the canvas
     * @param canvas {p5} The canvas to be drawn on
     */
    draw(canvas) {

        if (this._forceClear) {
            canvas.clear();
            this._forceClear = false;

            while (this._particles.length !== 0) {
                this._particles.shift();
            }
        }


        if (!this._isStopped) {
            canvas.push();

            for (let i = 0; i < this._particleBehaviours.length; i++) {
                this._particleBehaviours[i].update(this);
            }

            // make sure that the number of particles matches the specified number
            if (this._particles.length < this._particleCount) {
                const newParticles = this._particleCount - this._particles.length;
                for (let i = 0; i < newParticles; i++) {
                    this._spawnParticle();
                }
            } else if (this._particles.length < this._particleCount) {
                // it is possible for more particles to exist than the target, if the target is changed
                const particlesToDelete = this._particleCount - this._particles.length;
                for (let i = 0; i < particlesToDelete; i++) {
                    this._particles.shift(); // remove the first element
                }
            }

            for (let i = 0; i < this._particleCount; i++) {
                for (let j = 0; j < this._stepsPerFrame; j++) {
                    const particle = this._particles[i];
                    particle.update();
                    particle.paint(canvas);
                    if (!particle.isAlive) {
                        this._particles.splice(i, 1);
                        this._spawnParticle();
                    }
                }
            }
            this.targetImage.updatePixels();
            canvas.pop();
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

    reset() {
        this._forceClear = true;
        this.targetImageURL = this.targetImageURL // call setter to reset the target image
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

        let width = this._width;
        let height = this._height;
        if (width === undefined && height === undefined) { // nothing give, taken from image
            width = this._targetImage.width;
            height = this._targetImage.height;
        } else if (width === undefined) { // height, infer width from aspect ration
            width = Math.floor(value.width / value.height * height);
        } else if (height === undefined) { // width, infer height from aspect ration
            height = Math.floor(value.height / value.width * width);
        } // else values are already good


        this._targetImage = this.createImage(width, height);
        this._targetImage.copy(value, 0, 0, value.width, value.height, 0, 0, this._targetImage.width, this._targetImage.height);
        this._targetImage.loadPixels();
        this.resizeCanvas(width, height, true);
    }

    get targetImageURL() {
        return this._targetImageURL;
    }

    set targetImageURL(value) {
        this._targetImageURL = value;
        // this may fail and error out if the image isn't found

        const wasStopped = this._isStopped;
        this.isStopped = true;

        const sketcher = this;
        this.loadImage(value, function (image) {
            sketcher.targetImage = image;
            sketcher.isStopped = wasStopped;
        });

    }

    get targetHeight() {
        return this._height;
    }

    static _validateWidthHeight(value, text) {
        if (value !== undefined) if (typeof value !== "number") {
            throw TypeError("target " + text + " must be a number or undefined");
        } else if (!Number.isInteger(value)) {
            throw TypeError("target " + text + " must be an integer or undefined");
        } else if (value <= 0) {
            throw Error("target " + text + " must be more than 0 or undefined");
        }
    }

    setSize(width, height) {
        this._width = width;
        this._height = height;

        ImageSketcher._validateWidthHeight(width, "width");
        ImageSketcher._validateWidthHeight(height, "height");

        this.targetImage = this.targetImage;
        this.forceClear();
    }

    set targetHeight(value) {
        ImageSketcher._validateWidthHeight(value, "height");

        this._height = value;
        this.targetImage = this.targetImage;
        this.resizeCanvas(this._width, this._height, true);
        this.forceClear();
    }

    get targetWidth() {
        return this._width;
    }

    set targetWidth(value) {
        ImageSketcher._validateWidthHeight(width, "width");

        this._width = value;
        this.resizeCanvas(this._width, this._height, true);
        this.targetImage = this.targetImage;
        this.forceClear();
    }

    set particleStartGenerator(value) {
        this._particleStartGenerator = value;
    }

    get particleBehaviours() {
        return this._particleBehaviours;
    }

    set particleBehaviours(value) {
        this._particleBehaviours = value;
    }

    get defaultVel() {
        return this._defaultVel;
    }

    set defaultVel(value) {
        this._defaultVel = value;
    }

    get dampeningFactor() {
        return this._dampeningFactor;
    }

    set dampeningFactor(value) {
        this._dampeningFactor = value;
    }

    get maxSpeed() {
        return this._maxSpeed;
    }

    set maxSpeed(value) {
        this._maxSpeed = value;
    }

    get dropRate() {
        return this._dropRate;
    }

    set dropRate(value) {
        this._dropRate = value;
    }

    get drawAlpha() {
        return this._drawAlpha;
    }

    set drawAlpha(value) {
        this._drawAlpha = value;
    }

    get drawWeight() {
        return this._drawWeight;
    }

    set drawWeight(value) {
        this._drawWeight = value;
    }

    get dropAlpha() {
        return this._dropAlpha;
    }

    set dropAlpha(value) {
        this._dropAlpha = value;
    }

    get dropMaxSize() {
        return this._dropMaxSize;
    }

    set dropMaxSize(value) {
        this._dropMaxSize = value;
    }

    /**
     * This method returns the a color object which represents the color at the specified location the the image.
     * @param img {p5.Image} the image
     * @param x {Number} the x coordinate of the pixel
     * @param y {Number} the y coordinate of the pixel
     * @return {p5.Color} The color
     */
    getColor(img, x, y) {
        const index = (y * img.width + x) * 4;
        return this.color(...img.pixels.slice(index, index + 4));
    }

    /**
     * This function sets the color of the image at the specified location
     * @param img {p5.Image} the image
     * @param x {Number} the x coordinate of the pixel
     * @param y {Number} the y coordinate of the pixel
     * @param color {p5.Color}
     */
    static setColor(img, x, y, color) {
        const index = (y * img.width + x) * 4;
        for (let i = 0; i < 4; i++) {
            img.pixels[index + i] = color.levels[i];
            // it is safe to use `levels` (over `red`,`green`... since this will be RGB)
        }
    }

}