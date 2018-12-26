"use strict";

class P5Component {

    constructor() {
        this.isSetup = false;
        this.isPreloaded = false;

        // this block emulates an abstract class
        if (this.constructor === P5Component) {
            throw new TypeError('Abstract class "p5Component" cannot be instantiated directly.');
        }
        const abstractMethods = [{name: "preload", args: 0}, {name: "setup", args: 1}, {name: "draw", args: 1}];
        for (let i = 0; i < abstractMethods.length; i++) {
            const method = abstractMethods[i];
            if (this[method.name] === P5Component.prototype[method.name] || typeof this[method.name] !== "function") {
                // if it's not overridden or if name is used for something other than a function
                throw new TypeError("Abstract method '" + method.name + "' must be implemented by " + this.__proto__.name);
            } else if (this[method.name].length !== method.args) {
                // function.length returns the number of arguments a function takes
                throw new TypeError("Abstract method '" + method.name + "' must take " + method.args +
                    " arguments, but takes " + this[method.name].length);
            }
        }


        const originalFunctions = {
            preload: this.preload.bind(this),
            setup: this.setup.bind(this),
            draw: this.draw.bind(this)
        }; // these need to be stored to avoid an infinite recursion
        const comp = this; // to remove this ambiguity

        this.preload = function () {
            if (!comp.isPreloaded) {
                originalFunctions.preload();
                comp.isPreloaded = true;
            }
        };
        this.setup = function (parent) {
            if (!comp.isSetup) {
                originalFunctions.setup(parent);
                comp.isSetup = true;
            }
        };
        this.draw = function (canvas) {
            if (canvas === undefined) {
                canvas = comp; // if no canvas is specified (such as when p5 calls), it should draw on itself
            }
            originalFunctions.draw(canvas)
        }

    }

    preload() {
    }

    setup(parent) {
    }

    draw(canvas) {
    }

    get seed() {
        const component = this;
        const originalProto = this.__proto__;
        return function (sketch) {
            component.initPrototype(sketch);
            P5Component.tryBindGlobals(sketch);
            sketch.setup = component.setup;
            sketch.draw = component.draw;
            sketch.preload = component.preload;
            // all of these functions have already been bound to component in the constructor (refer to function.bind)
        }
    }

    initPrototype(sketch) {
        this.__proto__ = P5Component.deepClone(this.__proto__);
        this.sketch = sketch;
        // deep clone the prototype, this is so that the other instances
        // are not affected by adding the sketch to the chain

        let lastPrototype = this; // add sketch to the end of the prototype chain.
        while (lastPrototype.__proto__ !== Object.prototype) {
            lastPrototype = lastPrototype.__proto__;
        }
        lastPrototype.__proto__ = sketch;
    }

    parentSetup(child) {
        if (!child.isSetup) {
            child.initPrototype(this.sketch);
            child.setup(this);
        }
    }

    static tryBindGlobals(sketch) {
        if (!P5Component.isGlobalBound) {
            P5Component.bindGlobals(sketch);
            P5Component.isGlobalBound = true
        }
    }

    static bindGlobals(sketch) {
        // this code is copied and modified from the p5 library, starting on line 48965
        const friendlyBindGlobal = sketch._createFriendlyGlobalFunctionBinder();
        console.log(Object.getOwnPropertyNames(sketch.__proto__).length);
        for (const key in sketch.__proto__) {
            if (sketch.__proto__.hasOwnProperty(key)) {
                friendlyBindGlobal(key, sketch.__proto__[key]);
            }
        }
    }

    static deepClone(obj) {
        const clone = {};
        Object.getOwnPropertyNames(obj).forEach(key => {
            if (typeof obj[key] == "object" && obj[key] != null) {
                clone[key] = this.deepClone(obj[key])
            } else {
                clone[key] = obj[key]
            }
        });
        return clone;
    }

}