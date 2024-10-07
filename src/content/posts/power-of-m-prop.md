---
title: The power of m.prop
subtitle: RIP
featured: false
created: 2016-01-08
archived: false
tags:
  - JS
  - programming
  - mithril.js
  - UI
---

> Please be aware this post was written when Mithril 0.2x was state of the art.
> Mithril 1.0 has built in support for streams and closure components; and enables writing in a declarative fashion.
> Many of the points I make here are still valid, but need to be read in the context of the mithril 0.2x API.
> The specific code samples and techniques used do not apply if you are using Mithril 1.0
>
> I'll leave this article here for posterity, and when I've got more experience with 1.0 I'll post a follow up.
> In the interim please feel free to ask questions in the [mithril chatroom](https://mithril.zulipchat.com/).
> 
> Happy Coding - James

Recently I've been working on a large interactive web app as part of a business I am involved in.

We have been using Mithril to build all our ui's to date, and it has proven itself
to be a wonderful framework for building stable predictable user interfaces.

One of Mithril's greatest strengths is its small API surface.  What was, and was not included, was for good reason.

The included API surface is often slightly unintuitive at first, but solves common problems more elegantly than other
frameworks I've used.

`m.prop` is mithril's answer to Backbone's `model.(get/set)`.
It solves all the problems of model binding, but in a more succinct and composable manner.

---

`m.prop` creates a getter/setter function.  Similar to JQuery's `val`.

```js
var a = m.prop(2)

a() //=> 2
a(4) //=> 4
a() //=> 4
```

Because it is a function, it can be passed directly to event handlers.
And by using `m.withAttr`, you can pass the event's value to the prop.
Saving a lot of muss and fuss creating useles callbacks like:

```js
function oninput(e){
	//you never have to do this
	//just use:
	//m.withAttr('value', input)
	input(e.target.value)
}
```

`withAttr('value')` just gets `event.target.value` and passes it to be stored in the `input` prop

```js
var input = m.prop('')

//inside a view:
{
	oninput: m.withAttr('value', input)
}
```

That alone is pretty useful.  It makes creating inline event listeners a cinch.
But there other benefits to wrapping values in a `prop`; _references_.

-----

Often you want to pass a value into a function.  And then edit the external value, for the other world to use.
One common scenario is writing view utility functions.

```js
function labeled_input(label, type, prop){
	//create a virtual dom element
	//of an input with a label
	//including model binding
	return m('label',
		label,
		m('input', {
			type: type,
			//get the value from the prop
			value: prop(),
			//save updates
			oninput: m.withAttr('value', prop)
		}
	)
}

//Creating a nice text input with model binding
//has never been so elegant...
model.name = m.prop('')

labeled_input('Name', 'text', model.name)
```

Notice we are passing in `model.name` the _function_ not the _value_.
This allows us to share the model value between multiple relevant views and make sure
our state is always in sync.

This would be a lot more complicated without `m.prop`.

---

`m.prop` has other super powers.  Because it is a function it can be composed with other functions with ease.

Composition just means passing the result of one function into the next.  A simple but powerful idea.
Composition can save you from writing repetitive functions and even avoiding inheritance / classes by achieving code reuse via other means.

Traditionally `compose` is a function that accepts a list of functions in the reverse order of invocation.
This is to mirror the manual approach of composition: `f(g(h(x)))`

When you call `f(g(h(x)))` `f` will be called _last_, despite being the furthest function to the left.

`f(g(h(x)))` is equivalent to the following.

```js
var a = h(x)
var b = g(a)
var c = f(b)
```

The same could be achieved by `_.compose(f,g,h)(x)`

I prefer to compose in the order of execution, using either ramda's `pipe` or lodash's `flow`.

```js
var h_then_g_then_f = R.pipe(h,g,f)

var c = h_then_g_then_f(x)
```

Let's say we want to make sure our `prop` is always cast as a number.  `event.target.value` will come back as a string, despite
the fact the input is a number.

No problem! Just compose `Number` with the prop in the event callback and we're done.

```js
var age = m.prop()
var oninput = R.pipe(
	Number,
	age
)

oninput: m.withAttr('value', oninput)
```

You could use `_.flow` instead of ramda's `R.pipe` too if you already have Lodash in your project.

---

What about serializating data to a file?  Won't storing values as functions just make a mess of things?
Actually, thanks to the `toJSON` api in Javascript you need not worry.  m.prop automatically will
convert your prop to its value when invoked by `JSON.stringify`

```js
var model = m.prop({
	name: m.prop('James'),
	age: m.prop(27)
})

model().name() //"James"

JSON.stringify(model) //=> "{ "name": "James", "age": 27 }"
```

`JSON.stringify` will recursively call `value.toJSON()` on your model, no matter how nested you go.

---

`m.prop` is clearly pretty useful, but perhaps you are not able to use `mithril` for your work, and are stuck in some other framework.

Not too worry!  m.prop is a tiny function that you can write in a few lines of code.

```js
var prop = function(current){
	function gettersetter(set){
		if(arguments.length){
			current = set
		}
		return current
	}
	gettersetter.toJSON = function(){
		return this()
	}
	return gettersetter
}

var a = prop(2)
a() //=> 2
```

voila!


Now you can try it out in a non mithril app, and get a feel for the approach.

### Limitations

`m.prop` is surely a wondeful thing.  But we can, and will do better!

Often when writing with mithril I've found I wanted to have a prop _react_ to changes in another prop.

I found myself writing my own version of prop with added abilities like `.map` and `.combineLatest` or `.fromEvent`.
Essentially writing a stream library with all the benefits of props.

```js
var a = m.prop(2)
var b = m.prop(3)

var sum = merge(a,b).map(function(){
	return a() + b()
})

sum() //=> 5

a(4)

sum() //=> 7
```

This turned out to be absolutely necessary for me to write some complex and highly interactive dashboards.
And despite fears of cleaning up all these streams of data on a route change, atomic updates, circular dependencies, debugging and
performance in general, I still found it to be generally worth the trade off.

But! What if I told you there was already a tiny, performant, stable stream library that allays all the aforementioned fears _and_
shares the same API as m.prop already out there?

Its called [__flyd__](https://github.com/paldepind/flyd) by [paldepind](https://github.com/paldepind).
> How do you pronounce it? Well it's Danish: the [pronunciation sounds](https://translate.google.com/#da/en/flyd) a little like _flew_ to me?)

Here is how you use it: its just like `m.prop` but with extra powers

```js
var f = require('flyd')
var R = require('ramda')

var prop = f.stream
var combine = f.lift

var a = prop(2)
var b = prop(3)

var sum = combine(R.add, a, b)

sum() //5

a(-10)

sum() //-7

```

In the above example you can see I am using `R.add` with `combine`.

I aliased `f.lift` to `combine` to better illustrate what is going on here.
`combine` will call the supplied function with the unwrapped value of the supplied streams.
It then creates a new stream that will always be up to date with any changes to `a` and `b`.

Streams can be ended manually, but dependent streams are automatically ended when their "parent" ends.

```js
// ends the stream and all listeners
a.end(true)
b.end(true)
```

The `.end` function on a stream is a stream itself.  So we could also have made `b` end when `a`
ends automatically.

```js
var a = prop(2)
var b = f.endsOn(a, prop(3))
```

or

```js
// calls b.end(true) when a.end(true)
// is called
a.end.on(b.end)
```

### Summary

Whether you are going reactive or not, I highly recommend trying or at least thinking about how
`m.prop`/flyd can fit in your workflow.
