# Programming Summative

## Design

The first step to this assignment is to try and understand what an ideal 'reusable component' would look like.  So I set
out to make a list of objectives for the end result.

*Future Author: In retrospect, this design section turned out more like a design story rather than a specification*

### Goals for the abstraction of a 'reusable component'

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
page, which seems like an obvious necessity for a *reusable* component.  Besides this, instance mode offers the ability 
for greater encapsulation and thus abstraction, resulting in *hopefully* nicer code.

Finally, the code written to implement a reusable component and to instantiate it should be clean, concise and safe.

To summarise, a good model should:
* Allow for nested components
* Allow for instantiating straight to a p5 sketch
* Clean, concise and safe

### Thoughts and preliminary implementations of a good model

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
This means that a simple inheritance from p5 is impossible. Any model will somehow need to implement a work around to 
this issue, which will sacrifice either code cleanliness or it's conciseness.

The obvious next step is to find the best compromise. My opinion being that I should prioritise making any work around 
code (particularly the code for interfacing with p5) modular and forward compatible with ES6 classes.  The goal being 
to have the interface between the `p5Component` class contain any unclean code, such that the implementation of my 
particular sketch and it's usage to only uses good practices. 

A possible solution to this would be a `p5Component` class which has a method which creates a seed(refer to the example 
of instance mode) or to make a static function which creates a seed from any component.  
```javascript
class p5Component {
    get seed(){
        const component = this;
        const originalPrototype = this;
        // to remove the ambiguity from what 'this' is referring to
        return function(sketch){
            component.sketch = sketch;
            sketch.setup = function () {
                originalPrototype.setup.call(component);
            };
            // attach other methods to the sketch
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
possible for the constructor of `p5Component` to hide these methods such that they throw an error before the 
object's seed is called, though this would be a gross misuse of prototypal inheritance.  This could be resolved through
careful visibility modifiers on overloads of visible methods, which I discuss later.

The other significant issue would be that the component itself needs to have access to the p5 sketch methods, such as 
those for drawing to the canvas or other utilities such as `noise()`. Ideally, the component has access to the sketch 
through inheritance, though simply inheriting from p5 is not an option.  This could be done by abusing prototypal 
inheritance.

The first idea is to replace the prototype with the sketch. This would result in the loss of all methods defined in the 
`CustomComponent` class.  It is notable that `draw` and `setup` must be 'attached' to the sketch to get around the 
`this = undefined` issue, meaning that only none-override methods would be lost. 

One solution is to hack around this by copying all keys from the `CustomComponent`'s prototype that don't conflict to 
the sketch.  This could result in some truly awful bugs if there are any naming conflicts.  This was my first idea, and
an implementation can be found in `/design_tests/test1.html`.  As can be seen, the implementation of `ExampleComponent` 
and its usage looks like nice ES6 code.  The compromise being that the implementation of p5Component is very hacked 
together and quite frankly awful.

This is one solution to instantiating a component straight to a sketch.  The problem is that this solution isn't very
compatible with the first point I made (nested components). The main issue being that every instance of a component 
must have its methods added to sketch.  Of course, there is the idea that I could keep track of methods for each class 
and then throw an error if the methods with the same name exist in multiple classes.  After great hesitation I explored
this idea, only to reach a dead end (as can be found in `/design test/test2.html`).  The insight I found being that it
is just not possible for multiple objects to share a prototype and not encounter conflicts (duhh...).

Other ideas for combining the prototypes of `CustomComponent` and the p5 sketch have their own issues. 
For example, we might instead try change the second prototype (of `CustomComponent`) in the chain. The first issue is 
that the inheritance chain might be longer, thus we would have to find the end of the chain and attach the sketch there. 
Though this would by implication make it so that every instance of `CustomComponent` (and any instance of any of it's 
superclasses) has access to the same sketch.  In this case the sketch would effectively be a static field, which 
wouldn't work

A different work around would be to clone the whole prototype chain, and then add sketch to the end of the chain.
This would add all the methods of the sketch to the component but not alter any other component or break any instance.
The main downside to this is that instances of the same class no longer share the same prototype.  This isn't too bad
because editing the prototype of these classes would be a bad practice to avoid anyway.

It is possible to reach a working solution with this idea and here is my preliminary implementation,
```javascript
class p5Component {
    get seed() {
        const component = this;
        const originalProto = this.__proto__;
        return function (sketch) {
            component.initPrototype(sketch);
            sketch.setup = function () {
                originalProto.setup.call(component);
            };
            sketch.draw = function () {
                originalProto.draw.call(component, sketch);
            };
        }
    }

    initPrototype(sketch) {
        this.__proto__ = p5Component.deepClone(this.__proto__);
        // deep clone the prototype, this is so that the other instances
        // are not affected by adding the sketch to the chain

        let lastPrototype = this; // add sketch to the end of the prototype chain.
        while (lastPrototype.__proto__ !== Object.prototype) {
            lastPrototype = lastPrototype.__proto__;
        }
        lastPrototype.__proto__ = sketch;
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
```

This code is still not very nice, but is defiantly cleaner and less destructive than the previous example 
(`design_tests/test1.html`). The next step is to design a class model.    

### Javascript OOP features and thoughts on good abstraction

A good observation is that `p5Component` ought to be an abstract class (for better abstraction, but primarily for 
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
In other languages with richer OOP features I would have `setup` and `draw` (and the other methods such as `preload`) as
abstract methods.  Another feature which makes developing a safe and developer friendly interface is tight control over 
visibility (which doesn't exist in js), such as package or module only visibility. In combination with features such as 
final methods would allow me to write a `p5Component` class that is truly fail safe.  

For example, `setup` could have a final and hidden overload which is only called by the p5 class, a private `isSetup` 
field could be used to disallowing multiple calls the user defined setup from the p5 class.  This would make it safe to 
make multiple sketches of the same component and hide all that complexity from the developer using the `p5Component` 
class.

### Making a model for `p5Component`

We already have a solution for instantiating a component to a sketch, now we must consider what a good model which 
allows for easy nesting of components looks like.