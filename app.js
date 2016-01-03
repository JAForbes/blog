/* global fetch */
/* global container */
var snabbdom = require('snabbdom');
var patch = snabbdom.init([ // Init patch function with choosen modules
  require('snabbdom/modules/class'), // makes it easy to toggle classes
  require('snabbdom/modules/props'), // for setting properties on DOM elements
  require('snabbdom/modules/style'), // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
]);

require('fetch-polyfill')

var R = {
	pipe: require('lodash/function/flow'),
	get: require('lodash/utility/property'),
	always: require('lodash/utility/constant'),
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
var router = require('./router')
var url = router('search')

if(window.location.hostname == 'localhost'){
	global.f = f
	global._ = R
	global.v = f.stream
	global.url = url
}

var h = require('snabbdom/h')

//v = value stream
var v = f.stream

var begin = require('./begin')

var iso8601 = function(time){
	return new Date(time).toISOString().slice(0,10)
}

function sidebar(posts){

	return h('ul', { class: { posts: true } },
		posts.map(function(post){
			var href = post.path.replace('.md', '')

			return h('li', { key: href }, [
				h('a', {
					props: { href: href },
					on: { click: function(e){
						url(href)
						e.preventDefault()
					} }
				}, [ post.name ]),
				h('div', { class: { tiny: true} },
					iso8601(post.created)
				)
			])
		})
	)
}

function bio(){
	var links = [
		{ href: 'https://babyx.bandcamp.com/', text: 'Band Music' },
		{ href: 'https://soundcloud.com/gazevectors/sets/impossible-lake', text: 'Solo Music' },
		{ href: 'https://twitter.com/james_a_forbes', text: 'Twitter'},
		{ href: 'http://canyon.itch.io/', text: 'Games' },
		{ href: 'https://github.com/JAForbes', text: 'Github' }
	]

	return h('div', { props: { className: 'bio' }}, [
		h('img', { props: {src: 'http://pbs.twimg.com/profile_images/571253075579396096/_csqQudw.jpeg'} }),
		h('p', 'Hi I\'m James Forbes.'),
		h('div',
			links
				.map(function(link){
					return h('a', { props: { href: link.href }}, link.text)
				})
				.map(function(a){
					return h('p', [a])
				})
		)
	])
}

var posts = v([])

function postsComponent(v){

	fetch('posts.json').then(function(response){
		return response.json()
	})
	.then(posts)
	.then(function(){
		if( url().indexOf('posts') == -1){
			url(posts()[0].path.replace('.md',''))
		}
	})

	var view = posts.map(function(posts){
		return h('div', { class: { sidebar: true } }, [
			bio(),
			sidebar(posts)
		])
	})

	return view
}

function appstart(){
	var domstream = f.dropRepeats(url).map(function(url){
		//match paths and choose which component to mount
		return postsComponent
	})
	begin(patch, v(container), domstream)
}


document.readyState === "complete" ? appstart() :
document.addEventListener('DOMContentLoaded', appstart)