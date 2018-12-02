"use strict";

function Paint(p) {

    let ppos = p.copy();
    var pos = p.copy();
    var vel = createVector(0, 0);
    var force = createVector(0, 0);

    var maxSpeed = 3.0;
    var perception = 5;
    var bound = 60;
    var boundForceFactor = 0.16;
    var noiseScale = 100.0;
    var noiseInfluence = 1 / 20.0;

    var dropRate = 0.004;
    var dropRange = 40;
    var dropAlpha = 150;
    var drawAlpha = 50;
    var drawColor = color(0, 0, 0, drawAlpha);
    var drawWeight = 1;
    var count = 0;
    var maxCount = 100;

    this.update = function () {
        ppos = pos.copy();
        force.mult(0);

        // Add pixels force
        let target = createVector(0, 0);
        let count = 0;
        for (let i = -floor(perception / 2); i < perception / 2; i++) {
            for (let j = -floor(perception / 2); j < perception / 2; j++) {
                if (i === 0 && j === 0)
                    continue;
                const x = floor(pos.x + i);
                const y = floor(pos.y + j);
                if (x <= img.width - 1 && x >= 0 && y < img.height - 1 && y >= 0) {
                    const c = fget(x, y);
                    const b = 1 - brightness(c) / 100.0;
                    const v = createVector(i, j);
                    target.add(v.normalize().copy().mult(b).div(v.mag()));
                    count++;
                }
            }
        }
        if (count !== 0) {
            force.add(target.div(count));
        }

        // Add noise force
        const n = noise(pos.x / noiseScale, pos.y / noiseScale, z) * 5 * TWO_PI;
        const v = p5.Vector.fromAngle(n);
        if (force.mag() < 0.01)
            force.add(v.mult(noiseInfluence * 5));
        else
            force.add(v.mult(noiseInfluence));

        // Add bound force
        const boundForce = createVector(0, 0);
        if (pos.x < bound) {
            boundForce.x = (bound - pos.x) / bound;
        }
        if (pos.x > width - bound) {
            boundForce.x = (pos.x - width) / bound;
        }
        if (pos.y < bound) {
            boundForce.y = (bound - pos.y) / bound;
        }
        if (pos.y > height - bound) {
            boundForce.y = (pos.y - height) / bound;
        }
        force.add(boundForce.mult(boundForceFactor));


        vel.add(force);
        vel.mult(0.9999);
        if (vel.mag() > maxSpeed) {
            vel.mult(maxSpeed / vel.mag());
        }

        pos.add(vel);
        if (pos.y < 0 || pos.y > height || pos.x < 0 || pos.x > width) {
            this.reset();
        }

    };

    this.reset = function () {
        img.updatePixels();
        img.loadPixels();

        count = 0;
        //maxCount = 200;
        var hasFound = false;
        while (!hasFound) {
            pos.x = random(1)*width;
            pos.y = random(1)*height;
            const b = brightness(fget(floor(pos.x), floor(pos.y)));
            if(b < 35)
                hasFound = true;
        }
        drawColor = fget(floor(pos.x), floor(pos.y));
        drawColor.setAlpha(drawAlpha);
        ppos = pos.copy();
        vel.mult(0);
    };

    this.show = function () {
        count++;
        if (count > maxCount)
            this.reset();
        stroke(drawColor);
        strokeWeight(drawWeight);
        if (force.mag() > 0.1 && random(1) < dropRate) {
            drawColor.setAlpha(dropAlpha);
            stroke(drawColor);
            let boldWeight = drawWeight + random(5);
            strokeWeight(boldWeight);
            drawColor.setAlpha(drawAlpha);
        }
        line(ppos.x, ppos.y, pos.x, pos.y);

        this.fadeLineFromImg(ppos.x, ppos.y, pos.x, pos.y);
    };

    /* Fade the pixels of the line */
    this.fadeLineFromImg = function (x1, y1, x2, y2) {

        const xOffset = floor(abs(x1 - x2));
        const yOffset = floor(abs(y1 - y2));
        const step = max(yOffset, xOffset);

        for (let i = 0; i < step; i++) {
            const x = floor(x1 + (x2 - x1) * i / step);
            const y = floor(y1 + (y2 - y1) * i / step);
            const originColor = fget(x, y);

            originColor.setRed(min(red(originColor) + 50, 255));
            originColor.setGreen(min(green(originColor) + 50, 255));
            originColor.setBlue(min(blue(originColor) + 50, 255));

            fset(x, y, originColor);

        }
    };

}