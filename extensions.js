"use strict";

p5.Image.prototype.getColor = function (x, y) {
    const index = (y * this.width + x) * 4;
    return [this.pixels.slice(index, index + 4)];
};
p5.Image.prototype.setColor = function (x, y, color) {
    const index = (y * this.width + x) * 4;
    for (let i = 0; i < 4; i++) {
        this.pixels[index + i] = color.levels[i];
    }
};