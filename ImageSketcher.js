"use strict";

class ImageSketcher extends P5Component {

    static get DEFAULT_START_GENERATOR() {
        return function (sketcher) {
            const pos = sketcher.createVector(sketcher.random(0, sketcher.width), sketcher.random(0, sketcher.height));
            const color = sketcher.getColor(sketcher.targetImage, Math.floor(pos.x), Math.floor(pos.y));
            return {pos: pos, color: color};
        };
    }

    static makeEventUpdateLimitDeath(maxLife) {
        let updatesLived = {};
        let max = {};
        return function (particle) {
            if (updatesLived[particle] === undefined) {
                updatesLived[particle] = 1;

                if (typeof maxLife === "function") {
                    max[particle] = maxLife(particle);
                } else if (typeof maxLife === "number") {
                    max[particle] = maxLife;
                } else {
                    throw TypeError("maxLife must either be a number or a function which returns a number")
                }

            } else {
                updatesLived[particle] += 1;
            }

            if (updatesLived[particle] > max[particle]) {
                delete updatesLived[particle];
                delete max[particle];

                particle.isAlive = false;
            }
        };
    }

    static makeEventMaxDistanceTraveledDeath(maxDistance) {
        let distanceTraveled = {};
        let max = {};
        return function (particle) {
            const distance = particle.vel.copy().mag();
            if (distanceTraveled[particle] === undefined) {
                distanceTraveled[particle] = distance;

                if (typeof maxDistance === "function") {
                    max[particle] = maxDistance(particle);
                } else if (typeof maxDistance === "number") {
                    max[particle] = maxDistance;
                } else {
                    throw TypeError("maxDistance must either be a number or a function which returns a number")
                }

            } else {
                distanceTraveled[particle] += distance;
            }

            if (distanceTraveled[particle] >= max[particle]) {
                delete distanceTraveled[particle];
                delete max[particle];

                particle.isAlive = false;
            }
        };
    }

    static makeEventOutOfBoundsDeath() {
        return function (particle) {
            if (particle.pos.x > particle.sketcher.width ||
                particle.pos.y > particle.sketcher.height ||
                particle.pos.x < 0 ||
                particle.pos.y < 0) {

                particle.isAlive = false;
            }

        }
    }

    static makeEventEvolveColor(changeRate = 0.02, kernelSize = 5) {

        let kernelWidth;
        let kernelHeight;
        if (typeof kernelSize === "number") {
            kernelWidth = kernelSize;
            kernelHeight = kernelSize;
        } else if (Array.isArray(kernelSize) && kernelSize.length === 2) {
            [kernelWidth, kernelHeight] = kernelSize;
        } else {
            throw TypeError("kernelSize must be either a number or an Array of length 2")
        }

        kernelWidth /= 2; // this is so that it only needs to be divided once.
        kernelHeight /= 2;

        return function (particle) {
            let totals = {r: 0, g: 0, b: 0, pixles: 0};
            for (let xPixel = particle.pos.x - kernelWidth; xPixel < particle.pos.x + kernelWidth; xPixel++) {
                for (let yPixel = particle.pos.y - kernelHeight; yPixel < particle.pos.y + kernelHeight; yPixel++) {

                    const x = Math.floor(xPixel);
                    const y = Math.floor(yPixel);

                    if (x > 0 && y > 0 && x < particle.img.width && y < particle.img.height) {
                        const color = particle.sketcher.getColor(particle.img, x, y);
                        totals.r += color.levels[0];
                        totals.g += color.levels[1];
                        totals.b += color.levels[2];
                        totals.pixles += 1;
                    }
                }
            }
            const averageColor = {
                r: totals.r / totals.pixles,
                g: totals.g / totals.pixles,
                b: totals.b / totals.pixles
            };
            if (totals.pixles !== 0) {
                particle.color = particle.p5.color(
                    (1 - changeRate) * particle.color.levels[0] + changeRate * averageColor.r,
                    (1 - changeRate) * particle.color.levels[1] + changeRate * averageColor.g,
                    (1 - changeRate) * particle.color.levels[2] + changeRate * averageColor.b,
                    particle.color.levels[3]
                )
            }

        }
    }

    static makeEventLinearOutOfBoundsForce(bounds = 20, boundForceFactor = 0.25) {

        let top, right, bottom, left;
        if (typeof bounds === "number") {
            top = bounds;
            right = bounds;
            bottom = bounds;
            left = bounds;
        } else if (typeof bounds === "object" &&
            ("top" in bounds || "right" in bounds || "bottom" in bounds || "left" in bounds)
        ) {
            top = bounds.top || 0;
            right = bounds.right || 0;
            bottom = bounds.bottom || 0;
            left = bounds.left || 0;
        } else {
            throw TypeError("bounds must either be a number or an object containing the keys 'top', 'right'," +
                " 'bottom' or 'left'")
        }

        return function (particle) {
            const boundForce = particle.p5.createVector(0, 0);
            if (particle.pos.x < left) {
                boundForce.x = (left - particle.pos.x) / left;
            }
            if (particle.pos.x > particle.img.width - right) {
                boundForce.x = (particle.pos.x - particle.img.width) / right;
            }
            if (particle.pos.y < bottom) {
                boundForce.y = (bottom - particle.pos.y) / bottom;
            }
            if (particle.pos.y > particle.img.height - top) {
                boundForce.y = (particle.pos.y - particle.img.height) / top;
            }
            particle.force.add(boundForce.mult(boundForceFactor));
        };
    }

    static makeEventAddNoiseForce(noiseScale = .001, noiseInfluence = 0.1, timeFactor = 0.02, noiseTimeOffset) {

        if (noiseTimeOffset === undefined) {
            noiseTimeOffset = Math.random() * 10;
            // this is random such that different instances of this ImageSketcher don't have the same noise patterns
        }
        let updateCount = 0;

        return function (particle) {

            const n = particle.p5.noise(
                particle.pos.x * noiseScale,
                particle.pos.y * noiseScale,
                noiseTimeOffset + updateCount * timeFactor
            ) * particle.p5.TWO_PI * 10;
            particle.force.add(p5.Vector.fromAngle(n, noiseInfluence));
            updateCount += 1;
        }
    }

    static makeEventSimpleAttractiveForce(kernelSize = 5, forceFactor = 12, willAverage = false) {

        let kernelWidth;
        let kernelHeight;
        if (typeof kernelSize === "number") {
            kernelWidth = kernelSize;
            kernelHeight = kernelSize;
        } else if (Array.isArray(kernelSize) && kernelSize.length === 2) {
            [kernelWidth, kernelHeight] = kernelSize;
        } else {
            throw TypeError("kernelSize must be either a number or an Array of length 2")
        }

        kernelWidth = Math.floor(kernelWidth / 2); // this is so that it only needs to be divided once.
        kernelHeight = Math.floor(kernelHeight / 2);

        return function (particle) {

            let total = particle.p5.createVector(0, 0);
            let pixels = 0;
            for (let i = -kernelWidth; i <= kernelWidth; i++) {
                for (let j = -kernelHeight; j <= kernelHeight; j++) {
                    if (i === 0 && j === 0)
                        continue;

                    const x = Math.floor(particle.pos.x + i);
                    const y = Math.floor(particle.pos.y + j);

                    if (x < particle.img.width && x >= 0 && y < particle.img.height && y >= 0) {
                        const c = particle.sketcher.getColor(particle.img, x, y);
                        const dif = particle.p5.color(
                            Math.abs(c.levels[0] - particle.color.levels[0]),
                            Math.abs(c.levels[1] - particle.color.levels[1]),
                            Math.abs(c.levels[2] - particle.color.levels[2])
                        );
                        const b = 1 - particle.p5.brightness(dif) / 255;
                        const v = particle.p5.createVector(i, j);
                        total.add(v.normalize().mult(b));

                        pixels += 1;
                    }

                }
            }
            if (willAverage && pixels !== 0) {
                particle.force.add(total.mult(forceFactor / pixels));
            } else {
                particle.force.add(total.mult(forceFactor));
            }
        }
    }


    constructor(targetImage, width, height, optionalParameters) {
        let {
            particleCount = 100,
            stepsPerFrame = 5,
            startStopped = false,
            startPointGenerator = ImageSketcher.DEFAULT_START_GENERATOR,
            particleUpdateEvents = [
                ImageSketcher.makeEventUpdateLimitDeath(particle => particle.p5.random(50, 100)),
                // ImageSketcher.makeEventMaxDistanceTraveledDeath(particle => particle.p5.random(10, 10)),
                ImageSketcher.makeEventOutOfBoundsDeath(),
                ImageSketcher.makeEventLinearOutOfBoundsForce(),
                ImageSketcher.makeEventEvolveColor(),
                ImageSketcher.makeEventAddNoiseForce(),
                ImageSketcher.makeEventSimpleAttractiveForce()
            ],
            onKeyListener = Function(), // empty function
            onClickListener = Function()
        } = optionalParameters || {};

        super();

        if (!targetImage instanceof p5.Image || typeof targetImage !== "string") {
            throw new TypeError("image is undefined, you must pass an image or the address to one");
        }

        this._targetImage = targetImage;
        this._width = width; // width and height are dealt with when the image is loaded (must by the end of setup)
        this._height = height;

        this._particles = [];
        this._stepsPerFrame = stepsPerFrame;
        this._particleCount = particleCount;

        this._particleStartGenerator = startPointGenerator;
        this._particleUpdateEvents = particleUpdateEvents;

        this._isStopped = startStopped;
        this._forceClear = false;

        this._onKeyListener = onKeyListener;
        this._onClickListener = onClickListener;

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

        this.background(255, 255, 255);
        this.colorMode(this.RGB, 255);

    }

    spawnParticle() {

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
        }

        if (!this._isStopped) {
            canvas.push();

            // make sure that the number of particles matches the specified number
            if (this._particles.length < this._particleCount) {
                const newParticles = this._particleCount - this._particles.length;
                for (let i = 0; i < newParticles; i++) {
                    this.spawnParticle();
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
                        this.spawnParticle();
                    }
                }
            }
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

    set particleStartGenerator(value) {
        this._particleStartGenerator = value;
    }

    get particleUpdateEvents() {
        return this._particleUpdateEvents;
    }

    set particleUpdateEvents(value) {
        this._particleUpdateEvents = value;
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
    ;

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
    ;

}