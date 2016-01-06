/* global fetch */
/* global container */
window.onerror = alert

global.Promise = require('es6-promise').Promise

var snabbdom = require('snabbdom');
var patch = snabbdom.init([ // Init patch function with choosen modules
  require('snabbdom/modules/class'), // makes it easy to toggle classes
  require('snabbdom/modules/props'), // for setting properties on DOM elements
  require('snabbdom/modules/style'), // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
]);


var url = require('./framework/router')('search')
var begin = require('./framework/begin')
var fromEvent = require('./framework/streamFromEvent')
var marked = require('marked')


require('fetch-ie8')


var R = {
	pipe: require('ramda/src/pipe'),
	pipeP: require('ramda/src/pipeP'),
	invoker: require('ramda/src/invoker'),
	prop: require('ramda/src/prop'),
	partial: require('ramda/src/partial'),
	identity: require('ramda/src/identity'),
	tap: require('ramda/src/tap')
}
var I = R.identity

var f = require('flyd')
var unique = require('flyd/module/droprepeats').dropRepeats
var filter = require('flyd/module/filter')
var combine = require('flyd/module/lift')

if(window.location.hostname == 'localhost'){
	global.f = f
	global.R = R
	global.v = f.stream
	global.url = url
}

var h = require('snabbdom/h')

//v = value stream
var v = f.stream

var iso8601 = function(time){
	return new Date(time).toISOString().slice(0,10)
}

function sidebar(posts){
	console.log('sidebar: ', typeof posts)
	return h('ul', { class: { posts: true}, key: 'posts-list' },
		posts.map(function(post){
			var href = post.path.replace('.md', '')

			return h('li', { key: href }, [
				h('a', {
					props: { href: href },
					on: {
						click: function(e){
							scrollBy(0, -scrollY)
							url('/' + href)
							e.preventDefault()
						}
					}
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
		h('img', { props: {src: 'img/bio.jpeg'} }),
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

function toggle(stream){
	return stream(!stream())
}

function phoneNav(show_sidebar$){
	return h('div', {
		class: { 'phone-menu-nav': true, noselect: true },
		on: { click: [toggle, show_sidebar$] },
	}, [
		h('p', { props: { innerHTML: '&#9776;' } } )
	])
}

var postsCache = v([])

function postsComponent(v){

	var show_sidebar = v(false)
	var text = R.invoker(0, 'text')
	var fetchBlogHTML = R.pipeP(fetch,text,marked)

	var markdown_url = v()

	if(url().indexOf('posts') > -1){
		markdown_url( url() + '.md')
	}

	var postBody = f.map(fetchBlogHTML, markdown_url)
		postBody("")

	//so the sidebar doesn't redraw with an empty posts.json every redraw
	var posts = v(postsCache())

	fetch('posts.json').then(function(response){
		return response.json()
	})
		.then(R.pipe(
			R.tap(posts),
			postsCache
		))
		.then(function(){
			if( url().indexOf('posts') == -1){
				console.log('showing default post')
				url('/'+posts()[0].path.replace('.md',''))
			}
		})

	var model = [posts, postBody, show_sidebar].reduce(f.merge, v())


	var view = model.map(function(){
		return h('div', { key: 'container', class: { container: true }}, [
			h('div', {
					key: 'sidebar',
					class: { sidebar: true, show: show_sidebar() },
				}, [
				bio(),
				sidebar(posts()),
			]),
			h('div', {
				class: { post: true },
				props: { innerHTML: postBody() }
			}),
			phoneNav(show_sidebar)
		])
	})

	return view
}

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
var component = unique(url).map(function(url){
	if( url == '/nested' ){
		return nestedComponent
	} else if( url == '/simple' ){
		return simpleComponent
	} else {
		return postsComponent
	}
})

begin(patch, v(container), component)