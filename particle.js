"use strict";

class Particle {
    constructor(img) {
		
		this.img = img;

        this.ppos = createVector(0, 0);
        this.pos = createVector(0, 0);
        this.vel = createVector(0, 0);
        this.force = createVector(0, 0);

        this.maxSpeed = 3.0;
        this.perception = 5;
        this.bound = 60;
        this.boundForceFactor = 0.16;
        this.noiseScale = 100.0;
        this.noiseInfluence = 1 / 20.0;

        this.dropRate = 0.004;
        this.dropRange = 40;
        this.dropAlpha = 150;
        this.drawAlpha = 50;
        this.drawColor = color(0, 0, 0, this.drawAlpha);
        this.drawWeight = 1;
        this.count = 0;
        this.maxCount = 100;

    }

    /* Fade the pixels of the line */
    fadeLineFromImg(x1, y1, x2, y2) {

        const xOffset = floor(abs(x1 - x2));
        const yOffset = floor(abs(y1 - y2));
        const step = max(yOffset, xOffset);

        for (let i = 0; i < step; i++) {
            const x = floor(x1 + (x2 - x1) * i / step);
            const y = floor(y1 + (y2 - y1) * i / step);
            const originColor = this.img.getColor(x, y);

            originColor.setRed(min(red(originColor) + 50, 255));
            originColor.setGreen(min(green(originColor) + 50, 255));
            originColor.setBlue(min(blue(originColor) + 50, 255));

            this.img.setColor(x, y, originColor);

        }
    }

    show(canvas) {
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
        console.log(this.pos);
        console.log(this.ppos);
        canvas.line(this.ppos.x, this.ppos.y, this.pos.x, this.pos.y);

        this.fadeLineFromImg(this.ppos.x, this.ppos.y, this.pos.x, this.pos.y);
    }

    update() {
        this.ppos = this.pos.copy();
        this.force.mult(0);

        // Add pixels force
        let target = createVector(0, 0);
        let count = 0;

        // this is a convolution kernel
        for (let i = -floor(this.perception / 2); i < this.perception / 2; i++) {
            for (let j = -floor(this.perception / 2); j < this.perception / 2; j++) {
                if (i === 0 && j === 0)
                    continue;
                const x = floor(this.pos.x + i);
                const y = floor(this.pos.y + j);
                if (x <= this.img.width - 1 && x >= 0 && y < this.img.height - 1 && y >= 0) {
                    console.log(this.img);
                    const c = this.img.getColor(x, y);
                    const b = 1 - brightness(c) / 100.0;
                    const v = createVector(i, j);
                    target.add(v.normalize().copy().mult(b).div(v.mag()));
                    count++;
                }
            }
        }
        if (count !== 0) {
            this.force.add(target.div(count));
        }

        // Add noise force
        const n = noise(this.pos.x / this.noiseScale, this.pos.y / this.noiseScale, z) * 5 * TWO_PI;
        const v = p5.Vector.fromAngle(n);
        if (this.force.mag() < 0.01)
            this.force.add(v.mult(this.noiseInfluence * 5));
        else
            this.force.add(v.mult(this.noiseInfluence));

        // Add bound force
        const boundForce = createVector(0, 0);
        if (this.pos.x < this.bound) {
            boundForce.x = (this.bound - this.pos.x) / this.bound;
        }
        if (this.pos.x > width - this.bound) {
            boundForce.x = (this.pos.x - width) / this.bound;
        }
        if (this.pos.y < this.bound) {
            boundForce.y = (this.bound - this.pos.y) / this.bound;
        }
        if (this.pos.y > height - this.bound) {
            boundForce.y = (this.pos.y - height) / this.bound;
        }
        this.force.add(boundForce.mult(this.boundForceFactor));


        this.vel.add(this.force);
        this.vel.mult(0.9999);
        if (this.vel.mag() > this.maxSpeed) {
            this.vel.mult(this.maxSpeed / this.vel.mag());
        }

        this.pos.add(this.vel);
        if (this.pos.y < 0 || this.pos.y > height || this.pos.x < 0 || this.pos.x > width) {
            this.reset();
        }

    }

    reset() {
        this.img.updatePixels();
        this.img.loadPixels();

        this.count = 0;
        //maxCount = 200;
        var hasFound = false;
        while (!hasFound) {
            this.pos.x = random(1) * width;
            this.pos.y = random(1) * height;
			console.log(this.img)
            const b = brightness(this.img.getColor(floor(this.pos.x), floor(this.pos.y)));
            if (b < 35)
                hasFound = true;
        }
        this.drawColor = this.img.getColor(floor(this.pos.x), floor(this.pos.y));
        this.drawColor.setAlpha(this.drawAlpha);
        this.ppos = this.pos.copy();
        this.vel.mult(0);
    }
}