"use strict";

/**
 * This class encapsulates the particles in the simulation and their behaviour.
 * At the most basic level the class is only responsible for two behaviours: the basic physics simulation and the
 * drawing of the path that the particle has taken.  All other behaviours of the particle can are added through its
 * updateEvents field.
 */
class Particle {

    /**
     * Instantiates a new particle object
     * @param sketcher {ImageSketcher} This is the ImageSketcher which the particle is a part of
     * @param params {Object} This object contains all the optional parameters for the Particle object (this is so that
     * arguments can be passed in an arbitrary order).  <br>
     * These are the keys that the object may contain: <br>
     * `pos` - {p5.Vector} The starting position of the particle. <br>
     * `color` - {p5.Color} The starting color of the particle. <br>
     * `vel` - {p5.Vector} The starting velocity of the particle. <br>
     * `dampeningFactor` - {Number} The factor by which the velocity is multiplied by each update. <br>
     * `maxSpeed` - {Number} The maximum speed that the particle can reach. <br>
     * `dropRate` - {Number} The chance that an ink drop will be drawn during any draw call. <br>
     * `dropAlpha` - {Number} The opacity of the ink drops. <br>
     * `dropMaxSize` - {Number} The upper bound of the uniformly distributed. <br>
     * `drawAlpha` - {Number} The opacity of the trace that the particle draws. <br>
     * `drawWeight` - {Number} The width of the trace that the particle draws. <br>
     * `updateEvents` - {Array<Function>} List of functions which each take the particle as an argument which allow for complex particle
     * behaviours, may in built ones are available in ImageSketcher. <br>
     */
    constructor(sketcher, params) {
        let {
            pos, // must be passed TODO
            color, // must be passed TODO
            vel = sketcher.defaultVel.copy(),
            dampeningFactor = sketcher.dampeningFactor,
            maxSpeed = sketcher.maxSpeed,
            dropRate = sketcher.dropRate,
            dropAlpha = sketcher.dropAlpha,
            dropMaxSize = sketcher.dropMaxSize,
            drawAlpha = sketcher.drawAlpha,
            drawWeight = sketcher.drawWeight,
        } = params || {};

        this._img = sketcher.targetImage;
        this._p5 = sketcher.__proto__;
        // this is where all the p5 utilities are
        // this.p5. is shorter than this.sketcher.

        this._isAlive = true;

        this._pos = pos;
        this._lastPos = pos.copy();
        this._vel = vel;
        this._force = this._p5.createVector(0, 0);

        this._dampeningFactor = dampeningFactor;
        this._maxSpeed = maxSpeed;

        this._dropRate = dropRate; // chance of a drop (ink splodge) being drawn
        this._dropAlpha = dropAlpha;
        this._dropMaxSize = dropMaxSize;

        this._drawAlpha = drawAlpha;
        this._drawWeight = drawWeight;
        this._color = color;
        this._color.setAlpha(this._drawAlpha);
        this._sketcher = sketcher;

        // the only thing that the particle generator can't change on an individual basis is the behaviours

    }

    _fadeLineFromImg(x1, y1, x2, y2) {

        const xOffset = Math.floor(Math.abs(x1 - x2));
        const yOffset = Math.floor(Math.abs(y1 - y2));
        const step = Math.max(yOffset, xOffset);

        for (let i = 0; i < step; i++) {
            const x = Math.floor(x1 + (x2 - x1) * i / step);
            const y = Math.floor(y1 + (y2 - y1) * i / step);
            if (x < 0 || x >= this._sketcher.targetImage.width || y < 0 || y >= this._sketcher.targetImage.height) {
                continue
            }
            const originColor = this._sketcher.getColor(this._img, x, y);
            const modifiedColor = this._p5.color(
                Math.min(originColor.levels[0] + 50, 255),
                Math.min(originColor.levels[1] + 50, 255),
                Math.min(originColor.levels[2] + 50, 255)
            );
            ImageSketcher.setColor(this._img, x, y, modifiedColor);
        }
    }

    paint(canvas) {

        canvas.stroke(this._color);
        canvas.strokeWeight(this._drawWeight);

        if (this._sketcher.random(1) < this._dropRate) {
            this._color.setAlpha(this._dropAlpha);
            canvas.stroke(this._color);
            let boldWeight = this._sketcher.random(this._drawWeight, Math.max(this._dropMaxSize, this._drawWeight));
            canvas.strokeWeight(boldWeight);
            this._color.setAlpha(this._drawAlpha);
        }

        canvas.line(this._lastPos.x, this._lastPos.y, this._pos.x, this._pos.y);
        this._fadeLineFromImg(this._lastPos.x, this._lastPos.y, this._pos.x, this._pos.y);

    }

    update() {

        this._lastPos = this._pos.copy();
        this._force.mult(0);

        for (let i = 0; i < this.sketcher.particleBehaviours.length; i++) {
            this.sketcher.particleBehaviours[i].updateParticle(this);
        }

        this._vel.add(this._force); // force should really be replaced with impulse
        this._vel.mult(this._dampeningFactor);
        if (this._vel.mag() > this._maxSpeed) {
            this._vel.mult(this._maxSpeed / this._vel.mag());
        }

        this._pos.add(this._vel);

    }

    get sketcher() {
        return this._sketcher;
    }

    get img() {
        return this._img;
    }

    get p5() {
        return this._p5;
    }

    get isAlive() {
        return this._isAlive;
    }

    set isAlive(value) {
        this._isAlive = value;
    }

    get pos() {
        return this._pos;
    }

    set pos(value) {
        this._pos = value;
    }

    get lastPos() {
        return this._lastPos;
    }

    set lastPos(value) {
        this._lastPos = value;
    }

    get vel() {
        return this._vel;
    }

    set vel(value) {
        this._vel = value;
    }

    get force() {
        return this._force;
    }

    set force(value) {
        this._force = value;
    }

    get color() {
        return this._color;
    }

    set color(value) {
        this._color = value;
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

}