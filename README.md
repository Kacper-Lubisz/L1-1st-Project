# Programming Summative

## Design

The first step to this assignment is to try and understand what an ideal 'reusable component' would look like.  So I set
out to make a list of objectives for the end result.

*Future Author: In retrospect, this design section turned out more like a design story rather than a specification*

Firstly, it should be possible to create a reusable component that fully encapsulates another component.  In other words
a good model for such a component would allow for a component to take the role of calling all the event handlers of 
another component.  Meaning that layout manger alike component should be possible in such a model.  This would also 
allow for the example where a component is projected onto a 3d shape.  Thus it should be an objective to make both of 
those components in the same model as validation of the model.

Secondly, while studying the p5 library I found that p5 has two different ways for creating sketches, global mode (the 
mode that we were taught) and instance mode (https://github.com/processing/p5.js/wiki/Global-and-instance-mode).

Here is an example of how an instance mode sketch is created,
```javascript
let seed = function(sketch) {
    let x = 100; 
    let y = 100;    
    sketch.setup = function() {
        sketch.createCanvas(200, 200);
    };    
    sketch.draw = function() {
        sketch.background(0);
        sketch.fill(255);
        sketch.rect(x, y, 50, 50);
    };
};
let myp5 = new p5(seed, document.getElementById('id'));
```

A functional advantage of instance mode is that it allows you to create several p5 sketches (canvases) in the same html 
page, which is perfect for the examples.html page.  Besides this, instance mode offers the ability for greater
abstraction and encapsulation, resulting in *hopefully* nicer code.

Ideally, you should be able to instantiate a p5 sketch solely containing the reusable component.  The best conceivable 
implementation of this that matches the marking criteria of using ECMA 6 classes is to make components inherit from p5. 
This is in fact problematic because p5 isn't an ESMA 6 class. 

For clarity, I am describing the issues with this example,
```javascript
class Component extends p5 {
    constructor(args, node) {
        super(function () {
        }, node)
        // use args to init object
    }
    setup() {}
    draw() {
        this.canvas.rect(20, 20, 40, 40)
    }
}
```
The problem with this example is that the p5 code doesnt't call the draw method (this method in particular) on the 
component object, resulting in `this` always being `undefined`.
The example shows what can be found in the p5 source code, illustrating the issue.
```javascript
var context = this._isGlobal ? window : this; // this being the p5 sketch
// ...
var userDraw = context.draw;
// ...
    userDraw();
// ...
```
This means that a simple inheritance from p5 is impossible.  At this point any solution to instantiating a reusable 
component directly into a p5 sketch will go against the marking objective of using ECMA 6 classes in an appropriate way.

The obvious next step is to find the best compromise. My opinion being that I should prioritise making code 
(particularly the code for interfacing with p5) modular and forward compatible with ES6 classes.

A possible solution to this would be a `p5Component` class which has a method which creates a seed or to make a static 
function which creates a seed from any component (refer to the example of instance mode).  
```javascript
class p5Component {
    get seed(){
        const component = this;
        // to remove the ambiguity from what 'this' is referring to
        return function(sketch){
            component.sketch = sketch
            // attach the component to the sketch
        }
    }
    draw(){
        this.sketch.rect(20, 20, 40, 40)
    }
}
class CustomComponent extends p5Component {}
```
The problem with this is that is that a component can't exist on it's own without being attached to a sketch. 
Conceivably a user could call draw before setup which is symptomatic of a badly modeled OOP design.  It would be 
possible for the constructor of `p5Component` to override these methods such that they throw an error before the 
object's seed is called, though this would be a gross misuse of ptorotypal inheritance.

The other significant issue would be that the component itself needs to have access to the p5 (sketch) for things like 
calling drawing methods (e.g. rect). Ideally, the component has access to the sketch through inheritance, though simply 
inheriting from p5 is not an option.  This could be done by abusing prototypal inheritance.

The first idea is to replace the prototype with the sketch. This would result in the loss of all methods defined in the 
`CustomComponent` class.  It is notable that `draw` and `setup` must be 'attached' to the sketch to get around the 
`this = undefined` issue, meaning that only none-override methods would be lost. One solution is to hack around this by
copying all keys from the `CustomComponent`'s prototype that don't conflict to the sketch.  This could result in 
some truly awful bugs if there are any naming conflicts.

Other ideas for combining the prototypes of `CustomComponent` and the p5 sketch have their own issues. 
For example, we might instead try change the second prototype (of `CustomComponent`) in the chain. The first issue is 
that the inheritance chain might be longer, thus we would have to find the end of the chain and attach the sketch there. 
Though this would by implication make it so that every instance of `CustomComponent` (and any instance of any of it's 
superclasses) has access to the same sketch.  A work around would be to this which I explore later is to clone the 
whole prototype chain.

It is possible to reach a working solution by following the first idea.  Here is my preliminary implementation,
```javascript
class p5Component {
    get seed() {
        const component = this;
        // to remove the ambiguity from what 'this' is referring to
        const originalProto = this.__proto__;
        
        return function (sketch) {
            component.__proto__ = sketch;
            const ignoreKeys = ["constructor", "setup", "draw"];
            
            Object.getOwnPropertyNames(originalProto).forEach(key => {
                if (!ignoreKeys.includes(key)) {
                    if (key in sketch) {
                        throw "The use of the key, " + key +
                        ", in the implementation of custom components is forbidden";
                    } else {
                        sketch[key] = originalProto[key]
                    }
                }
            });
            sketch.setup = function () {
                originalProto.setup.call(component);
            };
            sketch.draw = function () {
                originalProto.draw.call(component);
            };
        }
    }
}

class ExampleComponent extends p5Component {
    constructor(dimensions = {width: 200, height: 200}) {
        super();
        this.dimensions = dimensions;
    }

    setup() {
        this.canvas = this.createCanvas(this.dimensions.width, this.dimensions.height)
    }

    draw() {
        this.clear();
        const position = this.calculatePosition();
        this.rect(position.x, position.y, 50, 50);
    }

    calculatePosition() {
        return {
            x: 75 + 50 * Math.sin(this.millis() / 1000),
            y: 75 + 50 * Math.cos(this.millis() / 1000)
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const sketcher = new ExampleComponent();
    new p5(sketcher.seed, document.getElementById("example_dom_node_id"))
});
```
As can be seen, the implementation of `ExampleComponent` and its usage looks like nice ES6 code.  The compromise being 
that the implementation of p5Component is very hacked together and quite frankly awful.

It is worth mentioning that `p5Component` ought to be an abstract class (for better abstraction, but primarily for 
making this code safer), which can also be hacked in ES6 as shown in the following example 
(from https://ilikekillnerds.com/2015/06/abstract-classes-in-javascript/).
```javascript
class Widget {
    constructor() {
        if (this.constructor === Widget) {
            throw new TypeError('Abstract class "Widget" cannot be instantiated directly.'); 
        }
    }
}
```

This is one solution to instantiating a component straight to a sketch.  The problem is that this solution isn't very
compatible with the first point I made (nested components). The main issue being that every instance of a component 
must have its methods added to sketch.  Of course, I could keep track of methods for each class and then throw an error
if the methods with the same name exist in multiple classes.

With great hesitation I implemented this.  The 