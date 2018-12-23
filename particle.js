"use strict";

class Particle {

    constructor(sketcher) {

        this.sketcher = sketcher;
        this.img = sketcher.image;

        this.ppos = this.sketcher.createVector(0, 0);
        this.pos = this.sketcher.createVector(0, 0);
        this.vel = this.sketcher.createVector(0, 0);
        this.force = this.sketcher.createVector(0, 0);

        this.maxSpeed = 3.0;
        this.perception = 5;
        this.bound = 60;
        this.boundForceFactor = 0.16;
        this.noiseScale = 100.0;
        this.noiseInfluence = 1 / 20.0;

        this.dropRate = 0.0004;
        this.dropRange = 40;
        this.dropAlpha = 150;
        this.drawAlpha = 50;
        this.drawColor = this.sketcher.color(0, 0, 0, this.drawAlpha);
        this.drawWeight = 1;
        this.count = 0;
        this.maxCount = this.sketcher.floor(100 * this.sketcher.random(.75, 1.25));

        // this.onOutOfBounds = this.reset;
        this.onOutOfBounds = function () {
            this.vel = this.vel.mult(-1)
        };

        this.reset()

    }

    /* Fade the pixels of the line */
    fadeLineFromImg(x1, y1, x2, y2, fadeFunction) {

        if (fadeFunction === undefined) {
            const particle = this; // remove this name ambiguity
            fadeFunction = function (originColor) {
                return particle.sketcher.color(
                    particle.sketcher.min(particle.sketcher.red(originColor) + 50, 255),
                    particle.sketcher. min(particle.sketcher.green(originColor) + 50, 255),
                    particle.sketcher.min(particle.sketcher.blue(originColor) + 50, 255)
                );
            }
        } else if (typeof (fadeFunction) !== "function") {
            throw "Invalid argument, fadeFunction must be a function"
        }

        const xOffset = this.sketcher.floor(this.sketcher.abs(x1 - x2));
        const yOffset = this.sketcher.floor(this.sketcher.abs(y1 - y2));
        const step = this.sketcher.max(yOffset, xOffset);

        for (let i = 0; i < step; i++) {
            const x = this.sketcher.floor(x1 + (x2 - x1) * i / step);
            const y = this.sketcher.floor(y1 + (y2 - y1) * i / step);
            if (x < 0 || x >= this.sketcher.width || y < 0 || y >= this.sketcher.height) {
                continue
            }
            const originColor = this.img.getColor(x, y);
            const modifiedColor = fadeFunction(originColor);
            this.img.setColor(x, y, modifiedColor);
        }
    }

    show(canvas) {
        this.count++;
        if (this.count > this.maxCount)
            this.reset();

        canvas.stroke(this.drawColor);
        canvas.strokeWeight(this.drawWeight);

        if (this.force.mag() > 0.1 && this.sketcher.random(1) < this.dropRate) {
            this.drawColor.setAlpha(this.dropAlpha);
            canvas.stroke(this.drawColor);
            let boldWeight = this.drawWeight + this.sketcher.random(5);
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
        let target = this.sketcher.createVector(0, 0);
        let count = 0;

        // this is a convolution kernel
        for (let i = -this.sketcher.floor(this.perception / 2); i < this.perception / 2; i++) {
            for (let j = -this.sketcher.floor(this.perception / 2); j < this.perception / 2; j++) {
                if (i === 0 && j === 0)
                    continue;
                const x = this.sketcher.floor(this.pos.x + i);
                const y = this.sketcher.floor(this.pos.y + j);
                if (x <= this.img.width - 1 && x >= 0 && y < this.img.height - 1 && y >= 0) {
                    const c = this.sketcher.color(this.img.getColor(x, y));
                    const b = 1 - this.sketcher.brightness(c) / 100.0;
                    const v = this.sketcher.createVector(i, j);
                    target.add(v.normalize().copy().mult(b));
                    count++;
                }
            }
        }
        if (count !== 0) {
            this.force.add(target.div(count));
        }

        // Add noise force
        const n = this.sketcher.noise(this.pos.x / this.noiseScale, this.pos.y / this.noiseScale, this.sketcher.noiseTimeOffset + this.sketcher.millis() / 100) * this.sketcher.TWO_PI * 10;
        const v = p5.Vector.fromAngle(n);
        if (this.force.mag() < 0.01) // this can be replaced with an activation and a blending
            this.force.add(v.mult(this.noiseInfluence * 5));
        else
            this.force.add(v.mult(this.noiseInfluence));

        // Add bound force
        const boundForce = this.sketcher.createVector(0, 0); // all of bounding should be done by one handler
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
            this.pos.x = this.sketcher.random(1) * this.sketcher.width;
            this.pos.y = this.sketcher.random(1) * this.sketcher.height;
            const b = this.sketcher.brightness(this.sketcher.color(this.img.getColor(this.sketcher.floor(this.pos.x), this.sketcher.floor(this.pos.y))));
            if (b < 35)
                hasFound = true;
        }
        this.drawColor = this.sketcher.color(this.img.getColor(this.sketcher.floor(this.pos.x), this.sketcher.floor(this.pos.y)));
        this.drawColor.setAlpha(this.drawAlpha);
        this.ppos = this.pos.copy();
        this.vel.mult(0);
    }
}