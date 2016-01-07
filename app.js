/* global window */
/* global twttr */
/* global fetch */
/* global container */

var h = require('./framework')

var unique = require('flyd/module/droprepeats').dropRepeats

var PostsContainerView = require('./routes/posts')

//v = value stream
var v = require('flyd').stream

function simpleComponent(v){
	return v(
		h('h1', 'Simple')
	)
}

function nestedComponent(v){
	var existing = simpleComponent(v)

	return v(
		h('div', [
			simpleComponent(v)(),
			existing()
		])
	)
}
global.url = h.url('search')

var component = unique(url).map(function(url){
	if( url == '/nested' ){
		return nestedComponent
	} else if( url == '/simple' ){
		return simpleComponent
	} else {
		return PostsContainerView
	}
})

h.begin(h.patch, v(container), component)