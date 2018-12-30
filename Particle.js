"use strict";

class Particle {

    constructor(sketcher, convolution) {

        this.sketcher = sketcher;
        this.img = sketcher.targetImage;
        this.p5 = sketcher.__proto__;
        // this is where all the p5 utilities are
        // this.p5. is much shorter than this.sketcher.

        this._isAlive = true;

        this.convolution = convolution; // TODO validate this

        this.ppos = this.p5.createVector(0, 0);
        this.pos = this.p5.createVector(0, 0);
        this.vel = this.p5.createVector(0, 0);
        this.force = this.p5.createVector(0, 0);

        this.maxSpeed = 3.0;
        this.perception = 5;
        this.bound = 60;
        this.boundForceFactor = 0.16;
        this.noiseScale = 100.0;
        this.noiseInfluence = 1 / 20.0;

        this.dropRate = 0.0004;
        this.dropAlpha = 150;
        this.drawAlpha = 50;
        this.drawColor = this.p5.color(0, 0, 0, this.drawAlpha);
        this.drawWeight = 1;
        this.count = 0;
        this.maxCount = this.p5.floor(100 * this.p5.random(.75, 1.25));

        // this.onOutOfBounds = this.reset;
        this.onOutOfBounds = function () {
            this.vel = this.vel.mult(-1)
        };

        this.reset()

    }

    // Fade the pixels of the line
    fadeLineFromImg(x1, y1, x2, y2) {

        const xOffset = Math.floor(Math.abs(x1 - x2));
        const yOffset = Math.floor(Math.abs(y1 - y2));
        const step = Math.max(yOffset, xOffset);

        for (let i = 0; i < step; i++) {
            const x = Math.floor(x1 + (x2 - x1) * i / step);
            const y = Math.floor(y1 + (y2 - y1) * i / step);
            if (x < 0 || x >= this.sketcher.width || y < 0 || y >= this.sketcher.height) {
                continue
            }
            const originColor = this.getColor(this.img, x, y);
            const modifiedColor = this.p5.color(
                Math.min(this.p5.red(originColor) + 50, 255),
                Math.min(this.p5.green(originColor) + 50, 255),
                Math.min(this.p5.blue(originColor) + 50, 255)
            );
            Particle.setColor(this.img, x, y, modifiedColor);
        }
    }

    paint(canvas) {
        this.count++;
        if (this.count > this.maxCount)
            this.reset();

        canvas.stroke(this.drawColor);
        canvas.strokeWeight(this.drawWeight);

        if (this.force.mag() > 0.1 && random(1) < this.dropRate) {
            this.drawColor.setAlpha(this.dropAlpha);
            canvas.stroke(this.drawColor);
            let boldWeight = this.drawWeight + random(5);
            canvas.strokeWeight(boldWeight);
            this.drawColor.setAlpha(this.drawAlpha);
        }

        canvas.line(this.ppos.x, this.ppos.y, this.pos.x, this.pos.y);

        this.fadeLineFromImg(this.ppos.x, this.ppos.y, this.pos.x, this.pos.y);
    }

    update() {

        this.ppos = this.pos.copy();
        this.force.mult(0);

        // Add pixels force
        let target = this.p5.createVector(0, 0);
        let count = 0;

        // this is a convolution kernel
        for (let i = -Math.floor(this.perception / 2); i < this.perception / 2; i++) {
            for (let j = -Math.floor(this.perception / 2); j < this.perception / 2; j++) {
                if (i === 0 && j === 0)
                    continue;
                const x = Math.floor(this.pos.x + i);
                const y = Math.floor(this.pos.y + j);
                if (x <= this.img.width - 1 && x >= 0 && y < this.img.height - 1 && y >= 0) {
                    const c = this.getColor(this.img, x, y);
                    const b = 1 - this.p5.brightness(c) / 100.0;
                    const v = this.p5.createVector(i, j);
                    target.add(v.normalize().copy().mult(b));
                    count++;
                }
            }
        }
        if (count !== 0) {
            this.force.add(target.div(count));
        }

        // Add noise force
        const n = this.p5.noise(this.pos.x / this.noiseScale, this.pos.y / this.noiseScale, this.sketcher._noiseTimeOffset + this.p5.millis() / 100) * this.p5.TWO_PI * 10;
        const v = p5.Vector.fromAngle(n);
        if (this.force.mag() < 0.01) // this can be replaced with an activation and a blending
            this.force.add(v.mult(this.noiseInfluence * 5));
        else
            this.force.add(v.mult(this.noiseInfluence));

        // Add bound force
        const boundForce = this.p5.createVector(0, 0); // all of bounding should be done by one handler
        if (this.pos.x < this.bound) {
            boundForce.x = (this.bound - this.pos.x) / this.bound;
        }
        if (this.pos.x > this.img.width - this.bound) {
            boundForce.x = (this.pos.x - this.sketcher.width) / this.bound;
        }
        if (this.pos.y < this.bound) {
            boundForce.y = (this.bound - this.pos.y) / this.bound;
        }
        if (this.pos.y > this.sketcher.height - this.bound) {
            boundForce.y = (this.pos.y - this.sketcher.height) / this.bound;
        }
        this.force.add(boundForce.mult(this.boundForceFactor));


        this.vel.add(this.force); // force should really be replaced with impulse
        this.vel.mult(0.9999);
        if (this.vel.mag() > this.maxSpeed) {
            this.vel.mult(this.maxSpeed / this.vel.mag());
        }

        this.pos.add(this.vel);
        if (this.pos.y < 0 || this.pos.y > this.sketcher.height || this.pos.x < 0 || this.pos.x > this.sketcher.width) {
            this.onOutOfBounds()
        }

    }

    reset() {
        this.img.updatePixels();
        this.img.loadPixels();

        this.count = 0;
        let hasFound = false;
        while (!hasFound) {
            this.pos.x = random(1) * this.sketcher.width;
            this.pos.y = random(1) * this.sketcher.height;

            // noinspection JSSuspiciousNameCombination, this is to suppress a mistaken IDE warning
            const b = this.p5.brightness(this.getColor(this.img, Math.floor(this.pos.x), Math.floor(this.pos.y)));
            if (b < 35)
                hasFound = true;
        }
        // noinspection JSSuspiciousNameCombination, this is to suppress the same mistaken IDE warning
        this.drawColor = this.getColor(this.img, Math.floor(this.pos.x), Math.floor(this.pos.y));
        this.drawColor.setAlpha(this.drawAlpha);
        this.ppos = this.pos.copy();
        this.vel.mult(0);
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
        return this.p5.color(...img.pixels.slice(index, index + 4));
    };

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
    };

    get isAlive() {
        return this._isAlive;
    }

    set isAlive(value) {
        this._isAlive = value;
    }

}