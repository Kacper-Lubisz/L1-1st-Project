"use strict";

class Sketcher {

	constructor(bounds, image){
		this.bounds = bounds;

		this.z = 0;
		this.particles = [];
		this.particleCount = 50;
        this.stepsPerFrame = 15;
		let z = 0;
		this.isStop = false;

        this.img = image;
		this.img = createImage(floor(bounds.width), floor(bounds.height));
		this.setImage(image);

		for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.img));
		}

		background(255, 255, 255);
		colorMode(RGB, 255, 255, 255, 255);
	}

	draw(canvas) {
		canvas.image(this.img, this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
		if (!this.isStop) {
			for (let i = 0; i < this.particleCount; i++) {
				for (let j = 0; j < this.stepsPerFrame; j++) {
					this.particles[i].update();
					this.particles[i].show(canvas);
				}
			}
			this.z += 0.01;
		}		
	}

	keyPressed() {
		console.log(key);
		if (key === 's' || key === 'S') {
			this.isStop = !this.isStop;
		}
	}

	setImage(newImage){
        this.img.copy(newImage, 0, 0, newImage.width, newImage.height, 0, 0, this.img.width, this.img.height);
        this.img.loadPixels();
        clear();
	}

}