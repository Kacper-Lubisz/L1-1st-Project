/**
 * This class is the abstraction for the different custom behaviours that can be added to the particles in the simulation
 * This class behaves as **abstract** and cannot be instantiated, only inherited from.
 */
class ParticleBehaviour {
    /**
     * Instantiates a new ParticleBehaviour, ensures that all the abstract methods are implemented and makes sure that
     * the constructor is being called from within the constructor or another class (super class).
     */
    constructor() {
        // this block emulates an abstract class
        if (this.constructor === ParticleBehaviour) {
            throw new TypeError('Abstract class "p5Component" cannot be instantiated directly.');
        }

        const emulatedMethodModifiers = {
            abstract: [
                {name: "update", args: 1},
                {name: "updateParticle", args: 1},
            ]
        };

        // this enforces the implementation of the listed methods to make them behave as though they were abstract
        for (let i = 0; i < emulatedMethodModifiers.abstract.length; i++) {
            const method = emulatedMethodModifiers.abstract[i];
            if (this[method.name] === P5Component.prototype[method.name] || typeof this[method.name] !== "function") {
                // if it's not overridden or if name is used for something other than a function
                throw new TypeError("Abstract method '" + method.name + "' must be implemented by " + this.__proto__.name);
            } else if (this[method.name].length !== method.args) {
                // function.length returns the number of arguments a function takes
                throw new TypeError("Abstract method '" + method.name + "' must take " + method.args +
                    " arguments, but takes " + this[method.name].length);
            }
        }

    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {
    }

}

/**
 * This particle behaviour adds a force to which attracts the particle towards the ares of the image near it with the
 * same color
 */
class SimpleAttractiveForceBehaviour extends ParticleBehaviour {

    /**
     * Instantiates a new instance of SimpleAttractiveForceBehaviour
     * @param kernelSize {Number|Array<Number>} The area near which the particle will be attracted to
     * @param forceFactor {Number} The factor for the force that the particle will feel
     * @param willAverage {Boolean} If the force will be the average of all the pixels that exert a force on it
     */
    constructor(kernelSize = 5, forceFactor = 1.0, willAverage = false) {
        super();

        if (typeof kernelSize === "number") {
            this.kernelWidth = kernelSize;
            this.kernelHeight = kernelSize;
        } else if (Array.isArray(kernelSize) && kernelSize.length === 2) {
            [this.kernelWidth, this.kernelHeight] = kernelSize;
        } else {
            throw TypeError("kernelSize must be either a number or an Array of length 2")
        }

        this.kernelWidth /= 2;
        this.kernelHeight /= 2;

        this.forceFactor = forceFactor;
        this.willAverage = willAverage;
    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {

        let total = particle.p5.createVector(0, 0);
        let pixels = 0;
        for (let i = -this.kernelWidth; i <= this.kernelWidth; i++) {
            for (let j = -this.kernelHeight; j <= this.kernelHeight; j++) {
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
        // console.log(pixels)
        if (this.willAverage && pixels !== 0) {
            particle.force.add(total.mult(this.forceFactor / pixels));
        } else {
            particle.force.add(total.mult(this.forceFactor));
        }
    }

}

/**
 * This particle behaviour is used for adding noise forces to the particle.
 */
class NoiseForceBehaviour extends ParticleBehaviour {
    /**
     * Instantiates a new instance of NoiseForceBehaviour
     * @param noiseScale {Number} The factor for the location in noise space
     * @param noiseInfluence {Number} The factor on the size of the force that the particle feels
     * @param timeFactor {Number} The factor is how fast noise evolves through time
     * @param noiseTimeOffset {Number} The offset to the noise, used to make each instance of ImageSketcher unique
     */
    constructor(noiseScale = .001, noiseInfluence = 0.05, timeFactor = 0.01, noiseTimeOffset = Math.random()) {
        super();
        this._noiseScale = noiseScale;
        this._noiseInfluence = noiseInfluence;
        this._timeFactor = timeFactor;

        this._noiseTimeOffset = noiseTimeOffset;

        this._updateCount = 0;

    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
        this._updateCount += 1;
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {
        const n = particle.p5.noise(
            particle.pos.x * this._noiseScale,
            particle.pos.y * this._noiseScale,
            (this._noiseTimeOffset + this._updateCount) * this._timeFactor
        ) * 10 * particle.p5.TWO_PI;
        // multiplied by an arbitrary large factor to make more likely that the range of 0 to 2pi is covered
        particle.force.add(p5.Vector.fromAngle(n, this._noiseInfluence));
    }

    /**
     * Returns the noise scale
     * @return {Number} the noise scale
     */
    get noiseScale() {
        return this._noiseScale;
    }

    /**
     * Sets the noise scale
     * @param value {Number} the new noise scale
     */
    set noiseScale(value) {
        this._noiseScale = value;
    }

    /**
     * Returns the noise influence
     * @return {Number} the noiseInfluence
     */
    get noiseInfluence() {
        return this._noiseInfluence;
    }

    /**
     * Sets the new noise influence
     * @param value the new for noise influence
     */
    set noiseInfluence(value) {
        this._noiseInfluence = value;
    }

    /**
     * Returns the time factor
     * @return {Number} the time factor
     */
    get timeFactor() {
        return this._timeFactor;
    }

    /**
     * Sets the time factor
     * @param value {Number} the new time factor
     */
    set timeFactor(value) {
        this._timeFactor = value;
    }

}

/**
 *This particle behaviour makes it so that a particle dies after a certain amount of update calls
 */
class UpdateLimitDeathBehaviour extends ParticleBehaviour {

    /**
     * Instantiates a new instance of UpdateLimitDeathBehaviour
     * @param maxLife {Number | Function} The number of updates or a function which returns the number of updates
     */
    constructor(maxLife) {
        super();

        this._updatesLived = new Map();
        this._max = new Map();
        this._maxLife = maxLife;

        if (typeof this._maxLife !== "function" && typeof this._maxLife !== "number") {
            throw TypeError("maxLife must either be a number or a function which returns a number")
        }

    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
        if (this._updatesLived.size > sketcher.particleCount * 2) {
            // particles that die from other behaviours won't be removed
            // so from time to time the dictionaries should be purged to prevent a memory leak
            for (const particle of this._updatesLived.keys()) {
                if (!particle.isAlive) {
                    this._updatesLived.delete(particle);
                    this._max.delete(particle);
                }
            }
        }
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {

        if (this._updatesLived.get(particle) === undefined) {
            this._updatesLived.set(particle, 1);

            if (typeof this._maxLife === "function") {
                this._max.set(particle, this._maxLife(particle));
            } else {
                this._max.set(particle, this._maxLife);
            }

        } else {
            this._updatesLived.set(particle, this._updatesLived.get(particle) + 1);
        }

        if (this._updatesLived.get(particle) >= this._max.get(particle)) {
            this._updatesLived.delete(particle);
            this._max.delete(particle);

            particle.isAlive = false;
        }
    }
}

/**
 * This particle behaviour adds a force on the particle when the particle is close to the edge of the image.  The force
 * is interpolated linearly, meaning that at the bounds it is zero and then at the edge it is boundForceFactor.
 */
class LinearOutOfBoundsForceBehaviour extends ParticleBehaviour {

    /**
     * Instantiates a new instance of LinearOutOfBoundsForceBehaviour
     * @param bounds {Number | Object} the number distance from the edges or an object with the keys 'top', 'right',
     * 'bottom' and or 'left'
     * @param boundForceFactor {Number} The magnitude of the max force on the particle
     */
    constructor(bounds = 20, boundForceFactor = 0.25) {
        super();

        this._top = 0;
        this._right = 0;
        this._bottom = 0;
        this._left = 0;
        if (typeof bounds === "number") {
            this._top = bounds;
            this._right = bounds;
            this._bottom = bounds;
            this._left = bounds;
        } else if (typeof bounds === "object" &&
            ("top" in bounds || "right" in bounds || "bottom" in bounds || "left" in bounds)
        ) {
            this._top = bounds.top || 0;
            this._right = bounds.right || 0;
            this._bottom = bounds.bottom || 0;
            this._left = bounds.left || 0;
        } else {
            throw TypeError("bounds must either be a number or an object containing the keys 'top', 'right'," +
                " 'bottom' or 'left'")
        }
        this._boundForceFactor = boundForceFactor;

    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {

        const boundForce = particle.p5.createVector(0, 0);
        if (particle.pos.x < this._left) {
            boundForce.x = (this._left - particle.pos.x) / this._left;
        }
        if (particle.pos.x > particle.img.width - this._right) {
            boundForce.x = (particle.pos.x - particle.img.width) / this._right;
        }
        if (particle.pos.y < this._bottom) {
            boundForce.y = (this._bottom - particle.pos.y) / this._bottom;
        }
        if (particle.pos.y > particle.img.height - this._top) {
            boundForce.y = (particle.pos.y - particle.img.height) / this._top;
        }
        particle.force.add(boundForce.mult(this._boundForceFactor));

    }
}

class MaxDistanceTraveledDeath extends ParticleBehaviour {
    constructor(maxDistance) {
        super();

        this.distanceTraveled = new Map();
        this.max = new Map();
        this.maxDistance = maxDistance;

        if (typeof maxDistance !== "function" && typeof maxDistance !== "number") {
            throw TypeError("maxDistance must either be a number or a function which returns a number")
        }

    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
        if (this.distanceTraveled.size > sketcher.particleCount * 2) {
            // particles that die from other behaviours won't be removed
            // so from time to time the dictionaries should be purged to prevent a memory leak
            for (const particle of this.distanceTraveled.keys()) {
                if (!particle.isAlive) {
                    this.distanceTraveled.delete(particle);
                    this.max.delete(particle);
                }
            }
        }
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {
        const distance = particle.vel.copy().mag();
        if (this.distanceTraveled.get(particle) === undefined) {
            this.distanceTraveled.set(particle, distance);

            if (typeof this.maxDistance === "function") {
                this.max.set(particle, this.maxDistance(particle));
            } else {
                this.max.set(particle, this.maxDistance);
            }

        } else {
            this.distanceTraveled.set(particle, this.distanceTraveled.get(particle) + distance);
        }

        if (this.distanceTraveled.get(particle) >= this.max.get(particle)) {
            this.distanceTraveled.delete(particle);
            this.max.delete(particle);

            particle.isAlive = false;
        }
    }
}

class EvolveColorBehaviour extends ParticleBehaviour {

    constructor(changeRate = 0.005, kernelSize = 3) {
        super();

        this.changeRate = changeRate;
        if (typeof kernelSize === "number") {
            this.kernelWidth = kernelSize;
            this.kernelHeight = kernelSize;
        } else if (Array.isArray(kernelSize) && kernelSize.length === 2) {
            [this.kernelWidth, this.kernelHeight] = kernelSize;
        } else {
            throw TypeError("kernelSize must be either a number or an Array of length 2")
        }

        this.kernelWidth /= 2; // this is so that it only needs to be divided once.
        this.kernelHeight /= 2;

    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {
        let totals = {r: 0, g: 0, b: 0, count: 0};
        for (let x = Math.round(particle.pos.x - this.kernelWidth); x < particle.pos.x + this.kernelWidth; x++) {
            for (let y = Math.round(particle.pos.y - this.kernelHeight); y < particle.pos.y + this.kernelHeight; y++) {

                if (x > 0 && y > 0 && x < particle.img.width && y < particle.img.height) {
                    const color = particle.sketcher.getColor(particle.img, x, y);
                    totals.r += color.levels[0];
                    totals.g += color.levels[1];
                    totals.b += color.levels[2];
                    totals.count += 1;
                }
            }
        }
        const averageColor = {
            r: totals.r / totals.count,
            g: totals.g / totals.count,
            b: totals.b / totals.count
        };
        if (totals.count !== 0) {
            particle.color = particle.p5.color(
                (1 - this.changeRate) * particle.color.levels[0] + this.changeRate * averageColor.r,
                (1 - this.changeRate) * particle.color.levels[1] + this.changeRate * averageColor.g,
                (1 - this.changeRate) * particle.color.levels[2] + this.changeRate * averageColor.b,
                particle.color.levels[3]
            )
        }
    }
}

class OutOfBoundsDeathBehaviour extends ParticleBehaviour {
    constructor() {
        super();
    }

    /**
     * This method is called one per update and is for updating the state of the ParticleBehaviour object
     * This method behaves as **abstract** and must be implemented by a child class.     *
     * @param sketcher {ImageSketcher} The sketcher that the behaviour is part of
     */
    update(sketcher) {
    }

    /**
     * This method is called once per update per particle.  This is where the behaviour object will act on the particle
     * This method behaves as **abstract** and must be implemented by a child class.
     * @param particle {Particle} The particle that the behaviour is acting on
     */
    updateParticle(particle) {
        if (particle.pos.x > particle.sketcher.width ||
            particle.pos.y > particle.sketcher.height ||
            particle.pos.x < 0 ||
            particle.pos.y < 0) {

            particle.isAlive = false;
        }
    }

}
