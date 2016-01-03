var _ = {
	pipe: require('lodash/function/flow'),
	get: require('lodash/utility/property'),
	constant: require('lodash/utility/constant'),
	add: function(a, b){
		return a + b
	},
	multiply: function(a, b){
		return a * b
	}
}

var f = require('flyd')
	f.lift = require('flyd/module/lift')
var combine = f.lift
var url = require('./router')()

if(window.location.hostname == 'localhost'){
	global.f = f
	global._ = _
	global.v = f.stream
	global.url = url
}

var snabbdom = require('snabbdom');
var patch = snabbdom.init([ // Init patch function with choosen modules
  require('snabbdom/modules/class'), // makes it easy to toggle classes
  require('snabbdom/modules/props'), // for setting properties on DOM elements
  require('snabbdom/modules/style'), // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
]);

var h = require('snabbdom/h')

//v = value stream
var v = f.stream

var mount = require('./mycle')

//takes a stream of views and creates a new view stream div wrapper
function div_deps(deps){
	return f.combine(function(){
		return h('div', deps.map(function(d){ return d() }))
	}, deps)
}

function input(label, stream){
	var oninput = _.pipe(_.get('target.value'), Number, stream)

	return stream.map(function(){
		return h('p', [
			h('label', [
				label,
				h('input', {
					props: { type: 'number', value: stream() },
					on: { input: oninput }
				})
			])
		])
	})
}

function display(label, stream){
	return stream.map( function(){
		return h('p', label+stream())
	})
}

function start(){
	// var history = require('history').createHistory()
	// var location = v()
	// var hash = location.map(_.get('hash'))
	// var search = location.map(_.get('search'))

	// f.on(console.log.bind(console), location)
	// f.on(console.log.bind(console), hash)
	// f.on(console.log.bind(console), search)
	// history.listen(location)

	mount(patch, document.body, Welcome())
}

function Welcome(){
	//state streams
	var a = v(1)
	var b = v(2)

	var sum = combine(_.add, a, b)
	var product = combine(_.multiply, a, b)

	//child view streams
	var input_a = input('a: ', a)
	var input_b = input('b: ', b)
	var display_sum = display('a + b: ', sum)
	var display_product = display('a * b: ', product)

	//parent view streams
	var inputs = div_deps([input_a, input_b])
	var displays = div_deps([display_sum, display_product])

	//root view
	var view = div_deps([inputs, displays])

	return view
}


var mode = v('search')
var mode_char = mode.map(function(mode){
  return mode == 'search' ? '?' : '#'
})


document.readyState === "complete" ? start() :
document.addEventListener('DOMContentLoaded', start)