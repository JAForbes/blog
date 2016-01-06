?Framework?
===========

Features
--------

- Automatic destruction of streams on component change
- Components as streams
- Simple tiny API
- Modular: Ramda, Snabbdom, Flyd
- Fast: Snabbdom is a speedy virtual dom library, Flyd is one of the fastest stream libraries
- Efficient: only redraws when your model changes
- Tiny
- Intuitive
- A router that is just a stream of urls.

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

var h = require('?framework?/patch')
var patch = require('?framework?/patch')
var begin = require('?framework?/begin')
var url$ = require('?framework?/router')('search')
var v = require('?framework?/stream')

var f = require('?framework?)

var dom$ = f.stream(document.body)

function HomePage( v ){

	//streams created with v will automatically be
	//garbage collected when the component is unmounted

	var mousex = f.fromEvent('mousemove', v, function(e){
		return e.clientX
	})

	var text = v("")

	//merge many streams to create a reactive model
	var model$ = f.merge(mousex, text)

	//when your model changes your view will be updated
	var view$ = model.map(function(){
		return h('div', [
			h('input', {
				attr: { type:'text' },
				on: { input: f.withAttr('value', text) },
				value: text()
			},
			h('p','mouse x' + mousex())
		])
	})

	//render your view
	return view$
}

// url$ is a stream of paths
// it uses the history api behind the scenes and supports 3 modes
// hash, search and path
var component$ = url$.map(function(url){

	// we could switch components here based on the url value
	return HomePage
})

//start your app
begin(patch, dom$, component$)

```