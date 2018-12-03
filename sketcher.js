"use strict";

class Sketcher {

	constructor(bounds, images){
		this.bounds = bounds;
		this.images = images
		
		this.z = 0
		
		this.imgIndex = -1;
		let paint = [];
		const particleCount = 50;
		let stepsPerFrame = 15;
		let z = 0;
		let isStop = false;
		
		this.img = createImage(floor(bounds.width), floor(bounds.height));
		nextImage();
		for (let i = 0; i < particleCount; i++) {
			paint.push(new Particle(this.img));
		}

		background(255, 255, 255);
		colorMode(RGB, 255, 255, 255, 255);
	}

	draw(canvas) {
		//canvas.ellipse(100 + random() * 100,100,100,100)
		if (!this.isStop) {
			for (let i = 0; i < this.particleCount; i++) {
				for (let j = 0; j < this.stepsPerFrame; j++) {
					this.paint[i].update();
					this.paint[i].show(canvas);
				}
			}
			this.z += 0.01;
		}		
	}
	
	update(){
		
	}	

	keyPressed() {
		console.log(key);
		if (key === 's' || key === 'S') {
			isStop = !isStop;
		}
	}

	nextImage() {
		if (!this.img) return;
		this.imgIndex = (this.imgIndex + 1) % this.images.length;
		let targetImg = this.images[this.imgIndex];
		
		this.img.copy(targetImg, 0, 0, targetImg.width, targetImg.height, 0, 0, this.img.width, this.img.height);
		//img.resize(width, height);
		this.img.loadPixels();
		clear();
	}

}