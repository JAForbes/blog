---
title: A better LeafletJS
created: 2014-10-29T11:12:06.740Z
featured: false
archived: false
---

I've been using LeafletJS a lot while writing the secret project I mentioned earlier.  And because Leaflet insists to encapsulate data in its homemade class system, I had to spend a lot of time and energy hacking Leaflet to let me draw to a map without handing it any of my data.

Data is not the focus of Leaflet.  Leaflet's focus is nice, simple, maps embedded into webpages.  I wanted Backbone to manage my data because it is an event system designed for the express purpose of handling changing state.  Leaflet is a mapping library, but for some reason it is also a data conversion utility and an OOP library.

There are libraries I make use of when handling geodata.  But it is extremely frustrating to compose functionality between these libraries, because these functions do not return raw data, they return data wrapped by a pseudo class, and I can't reason about the behaviour of that return value as easily as I can a pure function.
There were times where I had no choice but to use `L.Point` to do some geospatial conversions.

Here is the `add` function in `L.Point` at the time of writing

```javascript
  // non-destructive, returns a new point
	add: function (point) {
		return this.clone()._add(L.point(point));
	},

	// destructive, used directly for performance in situations where it's safe to modify existing point
	_add: function (point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},
```

The `add` function proxies to the actual `_add` function.  This is the first step of misdirection.  Let's not jump straight to `_add` though, because we need to first understand how `clone` and `L.point(point)` works.

```javascript
clone: function () {
		return new L.Point(this.x, this.y);
},
```
Looks like `clone` just calls the constructor of `L.Point` with `this.x, this.y`.  This creates a new Point by reaching up into instance state.  What is the value of `this` at the time of calling this function?  That is not easy to reason about simply by looking at the source.  To do that we'd have to look at every piece of code that interacts with `L.Point` -  and even then we do not know what code may interact with `L.Point` when we are using this in production.  The value of `this` could be literally anything.

```javascript
L.Point = function (/*Number*/ x, /*Number*/ y, /*Boolean*/ round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};
```

`L.Point` itself takes an `x` and `y` and an option to apply `Math.round` to `x` and `y`.  This function doesn't actually return anything, it is a constructor and therefore just assigns the values to `this`.  So we really can't reason about this function, as stated before.  We don't know what the value of `this` was before we called this function.  We don't know anything about `this`.

Wouldn't it be better if `add` was just a function that returns some data?  That didn't access instance state, that didn't go through proxy functions and constructors?  That doesn't create new objects with methods and prototypes.  `add` should be a trivial function.  A function I can take the result of and compose with other functions.  That is the secret to layers of abstraction, not OOP.

Let's write a new version of `add` that is easy to reason about.

```javascript
add: function(p1,p2){
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y
  }
}
```

Here we have no calls to other functions or proxies.  We are automatically non destructive because we are returning an object literal.

So what is the supposed advantage of Leaflet's appraoch.  Why go to all this effort of magical misdirection for something as trivial as a vector `add` function.

I think the reason is chaining.  Leaflet let's you do this.

```javascript
var p1 = L.Point(4,5)
var p2 = L.Point(10,20)

p2
  .add(p1)
  .multiply(200)
  .divideBy(100)
  .distanceTo(p1)

//instead of

var p1 = {x:4, y: 5}
var p2 = {x: 10, y: 20}

distanceTo(divideBy(multiply(add(p1,p2),200),100),p1)
```

And that seems appealing, at first glance.  But the first is syntactically clean but so much more complicated to track the mutation of data, the second is syntacically messy but each function is easier to reason about.

>You'll probably find you can use a generic library (e.g. _) to do all the transforms you need if you are using a plain array or hash.
>
>James Forbes (@jmsfbs) [October 21, 2014](https://twitter.com/jmsfbs/status/524437730378252288)


>And, why does every library want to be dependency free? Now there'll be 5 different implementations/namespace of map().
>
>James Forbes (@jmsfbs) [October 21, 2014](https://twitter.com/jmsfbs/status/524440308931522560)


>Why create your own inheritance system for a library that has nothing to do with classes?
>
>James Forbes (@jmsfbs) [October 21, 2014](https://twitter.com/jmsfbs/status/524440800575254528)

We can solve the syntactic mess by making use of a `compose` function, available in underscore,lodash,ramda, etc

```javascript
var p1 = {x:4, y: 5}
var p2 = {x: 10, y: 20}

//assumes each function is curried
_.compose(
  distanceTo(p1)
  divideBy(100),
  multiply(200),
  add(p1)
)(p2)
```

This is _so_ much more powerful than using classes because each individual function is usable by anyone, by any codebase or library.

I can compose each function into more complex functions.  In this case I immediately invoked the compose function, but we could give this function a name and apply it over and over again to any other point.

Each function has effectively become a lego brick.  As long as I know what each function returns, I can "click" each brick into absolutely any other brick, (even a function defined inline) without needing to know anything about the internals.

If you still really like chaining, another trick is to mixin your function with lodash or underscore.  And because your functions are pure, that is as easy as.

```
_.mixin({

  add: function(p1,p2){
    return {
      x: p1.x + p2.x,
      y: p1.y + p2.y
    }
  }

  // add other functions
})


_.({x: 4, y: 5})
  .add({x:10, y:20})
  .multiply(2)
  .divideBy(4)
  .distance()
.value()

```

If Leaflet was just a hash of useful functions, with no classes or instance state.  To access all Leaflet functionality in one fell swoop you could just do.

```
_.mixin(L)
```

Or you could automatically namespace them.  (If you are worried about namespace collision)

```
//create our lodash library called Leaflet
Leafdash = _.clone(_)

//add all of Leaflets functions to our Leaflet lodash `Leafdash` library
Leafdash.mixin(L)

//use lodash's implicit chaining with Leaflet functions
Leafdash({x:2,y:4})
  .add({x:4,y:4})
  .multiplyBy(10)
.value()
```


Imagine if [SAT](https://github.com/jriecken/sat-js), [Three.JS](http://threejs.org/) and Leaflet did the same thing.  We could actually make use of the hard work put in by the creators and contributors of these libraries.  We could convert these separate encapsulated efforts into poweful new libraries.

By putting all useful hard work into pseudoclasses
- it makes it harder to rely on abstractions, not easier, because we want lego bricks not magical misdirection
- unit tests become more complex (if you need a mock, ask yourself, why do you even need mocks?)
- you cannot compose your hard work with others hard work, because you need an instance of a class to access that functionality
- the only benefit of pseudoclassing is chaining, and you don't need classes to chain.
- the codebase will be full of different buggy implementations of the same algorithm because it was too hard to interop between different instances.

The whole idea of classes and OOP was that encapsulation would save us from writing the same code over and over again.  That we could solve problems and stand on new layers of abstraction to tackle the next problems.  But that doesn't work, because instead we spend most of time writing code to make different interfaces interoperate with eachother.

Let's stop pretending our own problem domain is so unique, all we do, is transform data.  Javascript is a functional programming language, lets embrace that.


