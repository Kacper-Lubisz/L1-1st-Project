"use strict";

class Particle {

    constructor(sketcher, startParams) {
        let {
            pos = sketcher.createVector(0, 0),
            color = sketcher.color(0, 0, 0)
        } = startParams || {};

        this.sketcher = sketcher;
        this.img = sketcher.targetImage;
        this.p5 = sketcher.__proto__;
        // this is where all the p5 utilities are
        // this.p5. is shorter than this.sketcher.

        this._isAlive = true;

        this.pos = pos;
        this.lastPos = pos.copy();
        this.vel = this.p5.createVector(0, 0);
        this.force = this.p5.createVector(0, 0);

        this.dampeningFactor = 0.99;

        this.maxSpeed = 3.0;

        this.dropRate = 0.0016;
        this.dropAlpha = 150;
        this.maxDropSize = 5;
        this.drawAlpha = 50;

        this.color = color;
        this.color.setAlpha(this.drawAlpha);
        this.drawWeight = 1;

        this.onOutOfBounds = Function()

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
            const originColor = this.sketcher.getColor(this.img, x, y);
            const modifiedColor = this.p5.color(
                Math.min(originColor.levels[0] + 50, 255),
                Math.min(originColor.levels[1] + 50, 255),
                Math.min(originColor.levels[2] + 50, 255)
            );
            ImageSketcher.setColor(this.img, x, y, modifiedColor);
        }
    }

    paint(canvas) {

        canvas.stroke(this.color);
        canvas.strokeWeight(this.drawWeight);

        if (this.force.mag() > 0.1 && random(1) < this.dropRate) {
            this.color.setAlpha(this.dropAlpha);
            canvas.stroke(this.color);
            let boldWeight = this.drawWeight + random(this.maxDropSize);
            canvas.strokeWeight(boldWeight);
            this.color.setAlpha(this.drawAlpha);
        }

        canvas.line(this.lastPos.x, this.lastPos.y, this.pos.x, this.pos.y);
        this.fadeLineFromImg(this.lastPos.x, this.lastPos.y, this.pos.x, this.pos.y);

    }

    update() {

        this.lastPos = this.pos.copy();
        this.force.mult(0);

        for (let i = 0; i < this.sketcher.particleUpdateEvents.length; i++) {
            this.sketcher.particleUpdateEvents[i](this);
        }

        this.vel.add(this.force); // force should really be replaced with impulse
        // this.vel.mult(this.dampeningFactor);
        if (this.vel.mag() > this.maxSpeed) {
            this.vel.mult(this.maxSpeed / this.vel.mag());
        }

        this.pos.add(this.vel);

    }

    get isAlive() {
        return this._isAlive;
    }

    set isAlive(value) {
        this._isAlive = value;
    }

}