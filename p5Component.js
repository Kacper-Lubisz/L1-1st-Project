"use strict";

class p5Component {

    constructor() {
        this.isSetup = false;
    }

    get seed() {
        const component = this;
        const originalProto = this.__proto__;
        return function (sketch) {
            component.initPrototype(sketch);
            if (originalProto.setup !== undefined) {
                sketch.setup = function () {
                    originalProto.setup.call(component);
                };
            }
            if (originalProto.draw !== undefined) {
                sketch.draw = function () {
                    originalProto.draw.call(component, sketch);
                };
            }
            if (originalProto.preload !== undefined) {
                sketch.preload = function () {
                    originalProto.preload.call(component)
                }
            }
        }
    }

    initPrototype(sketch) {
        this.__proto__ = p5Component.deepClone(this.__proto__);
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
        if (child.isSetup) {
            return
        }

        child.initPrototype(this.sketch);
        child.canvas = this.canvas;
        child.setup(this);
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