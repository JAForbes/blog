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
	f.dropRepeats = require('flyd/module/droprepeats').dropRepeats

var combine = f.lift
var url = require('./router')('search')

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

var mount = require('./mount')

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
	var domstream = f.dropRepeats(url).map(function(url){
		//match paths and choose which component to mount
		if(url.indexOf('time') > -1){
			return timeComponent
		} else if( url.indexOf('default') > -1) {
			return defaultComponent
		}
	})
	begin(domstream)
}

function begin(domstream){
	var source = v()
	var olddom = v(document.body)

	f.on(function(newdom){
		if( newdom ){
			//kill streams of old component
			source(true)

			//kill the kill stream
			source.end(true)

			//create a new source for the component
			//it will be manually ended
			//but it can also end if the olddom is ended
			source = f.endsOn(olddom.end, v())

			function scoped(value){
				return f.endsOn(source, v(value))
			}

			mount(patch, olddom, newdom(scoped) )
		}
	}, domstream)

	return olddom
}


function timeComponent(v){
	var time = v()
	var onsecond = function(){
		time(new Date().getTime())
	}


	var interval_id = setInterval(onsecond,1000)
	f.on(function(){
		clearInterval(interval_id)
	}, time.end)
	var view = time.map(function(){
		return h('div', [
			h('p', 'time: '+ time())
		])
	})
	onsecond()
	return view
}

function defaultComponent(v){
	return v(
		h('div', [
			h('h1', 'Default')
		])
	)
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

document.readyState === "complete" ? start() :
document.addEventListener('DOMContentLoaded', start)