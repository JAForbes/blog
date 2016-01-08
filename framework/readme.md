?Framework?
===========

Small, Versatile, Capable MVI framework at < 16kb

Features
--------

- Persistent function state without closures or classes!
- Automatic destruction of streams on component change
- Components as streams
- Simple tiny API
- Modular: Ramda, Snabbdom, Flyd
- Fast: Snabbdom is a speedy virtual dom library, Flyd is one of the fastest stream libraries
- Efficient: only redraws when your model changes
- Tiny
- Intuitive
- A router that is just a stream of urls.
- Customizable Router

Inspiration
-----------

?Framework? is inspired by CycleJS's simplicity and mithril's component architecture.
I wrote this library because I wasn't into RxJS verbosity, CycleJS selectors in the DOM driver
and mithril's reliance on controller constructors and over abstraction over the diff lifecycle.

This library will feel very familiar to users of Mithril.  I believe it takes all the best ideas from both libraries.

Quick start
-----------

A simple ?Framework? app

```js
var h = require('./framework')

function Component(v){

	//v() lets you create streams
	var a = v(0)
	var b = v(1)

	//your view reacts to any changes to your model
	var model = h.merge(a,b)

	//this is an example of creating a child view stream
	var display = model.map(function(){
		return h('p', 'Sum of a + b',
			Number(a()) + Number(b())
		)
	})

	//display depends on a + b and view depends on display
	//therefore whenever a or b change, our view is updated
	var view = display.map(function(){

		return h('div', [
			//you can separate concerns
			//and arbitarily nest views and models
			labeled_input('a: ', a),
			labeled_input('b: ', b),

			//display is a stream
			//but but also a getter/setter function
			//here we call display to get the latest value
			//but you can also call them to set a value
			display()
		])

	})

	return view
}

// your views are just another
// representation of state
// you can identify patterns and create useful abstraction
function labeled_input(label, stream){
	return h('label', [
		label,

		//the virtual dom library is snabbdom
		//an extremely light weight vdom library
		h('input', {

			// here we are creating <input type="number">
			// with an event handler oninput, and setting the value
			// to the current value of the stream
			props: { type: 'number', value: stream() },
			on: { input: h.withAttr('value', stream) }
		})
	])
}


//There is a built in router, but you can roll your own
//just write a function that accepts a url stream as input
//and returns a component
var router = h.router('/home', {
	'/home' : Component
})

//this is a stream of urls
//it uses the history api behind the scenes
//it supports 3 modes hash/search/pathname
// (pathname requires server support)
var url = h.url('search')

// all v() streams will be garbage collected
// when your component is unmounted
h.route(container, url, router)

```