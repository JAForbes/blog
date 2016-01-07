/* global window */
/* global twttr */
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

if (!Array.from) Array.from = require('array-from');

var hljs = require('highlight.js')

var url = require('./framework/router')('search')
var begin = require('./framework/begin')
var fromEvent = require('./framework/streamFromEvent')

function throttleMerge(s1, s2, s3, etc){
	var streams = Array.from(arguments);
	var head = streams.slice(0,-1)
	var tail = streams.slice(-1)[0]
	return aftersilence(0, head.reduce(f.merge, tail))
}

function redrawHook(callback){
	return {
		insert: callback,
		update: function(_, newNode){
			callback(newNode)
		}
	}
}

var marked = require('marked')

require('fetch-ie8')

var R = {
	pipe: require('ramda/src/pipe'),
	pipeP: require('ramda/src/pipeP'),
	invoker: require('ramda/src/invoker'),
	prop: require('ramda/src/prop'),
	partial: require('ramda/src/partial'),
	identity: require('ramda/src/identity'),
	tap: require('ramda/src/tap'),
	once: require('ramda/src/once'),
	path: require('ramda/src/path'),
	when: require('ramda/src/when')
}
var I = R.identity

var f = require('flyd')
var unique = require('flyd/module/droprepeats').dropRepeats
var filter = require('flyd/module/filter')
var combine = require('flyd/module/lift')
var aftersilence = require('flyd/module/aftersilence')

if(window.location.hostname == 'localhost'){
	global.f = f
	global.R = R
	global.v = f.stream
	global.url = url
}

var h = require('snabbdom/h')

//v = value stream
var v = f.stream

function Sidebar(v, posts, show_sidebar){

	var iso8601 = function(time){
		return new Date(time).toISOString().slice(0,10)
	}

	var list = posts.map(function(posts){
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
	})

	var view = f.merge(list, show_sidebar).map(function(){
		return h('div', {
				key: 'sidebar',
				class: { sidebar: true, show: show_sidebar() },
			}, [
			bio(),
			list(),
		])
	})

	return view;
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

function PhoneNav(v, show_sidebar$){
	return show_sidebar$.map(function(){
		return h('div', {
			class: { 'phone-menu-nav': true, noselect: true },
			on: { click: [toggle, show_sidebar$] },
		}, [
			h('p', { props: { innerHTML: '&#9776;' } } )
		])
	})
}

function Twitter(v, post){

	var setupTwitter = R.once(function(node){

		node.elm.innerHTML = ""

		return twttr.widgets.createTweet(
			post().twitter,
			node.elm,
			{ theme: 'light' }
		)
	})

	var twitterHook =
		redrawHook(
			R.when(function(){
				return post().twitter
			}, setupTwitter)
		)

	var view = function(){
		return h('div', {
			key: 'twitter-view',
			hook: twitterHook
		})
	}

	return view;
}

function Post(v, postBody, post){

	var highlightCode = R.once(function(){
		Array.from(document.querySelectorAll('pre code')).forEach(hljs.highlightBlock)
	})

	var highlightHook =
		redrawHook(
			R.when(
				R.path(['elm','children','length']),
				highlightCode
			)
		)

	var twitter = Twitter(v, post)

	var model = f.merge(postBody, post);

	var view = model.map(function(){
		return h('div', {
			class: { post: true },
		}, [
			h('div', {
				key: 'post-view',
				props: { innerHTML: postBody() || "" },
				hook: highlightHook
			}),
			twitter()
		])
	})

	return view
}

function PostsModel(v, postsCache){
	var show_sidebar = v(false)
	var text = R.invoker(0, 'text')
	var fetchBlogHTML = R.pipeP(fetch,text,marked)

	var markdown_url = v()

	if(url().indexOf('posts') > -1){
		markdown_url( url() + '.md')
	}

	var postBody = f.map(fetchBlogHTML, markdown_url)

	//so the sidebar doesn't redraw with an empty posts.json every redraw
	var posts = v(postsCache())

	var post = posts.map(function(posts){
		var murl = markdown_url()
		for(var i = 0; i < posts.length; i++){
			if( '/'+posts[i].path == murl ) return posts[i]
		}
		return {}
	})

	fetch('posts.json').then(function(response){
		return response.json()
	})
		.then(R.pipe(
			R.tap(posts),
			postsCache
		))
		.then(function(){
			if( url().indexOf('posts') == -1){
				url('/'+posts()[0].path.replace('.md',''))
			}
		})

	return {
		postBody: postBody,
		post: post,
		posts: posts,
		show_sidebar: show_sidebar
	}
}

var postsCache = v([])

function PostsContainerView(v){

	var model = PostsModel(v, postsCache)

	var views = {
		post: Post(v, model.postBody, model.post),
		sidebar: Sidebar(v, model.posts, model.show_sidebar),
		phoneNav: PhoneNav(v, model.show_sidebar)
	}

	var subviews = throttleMerge(views.sidebar, views.post, views.phoneNav)

	var view = subviews.map(function(){
		return h('div', { class: { container: true }}, [
			views.sidebar(),
			views.post(),
			views.phoneNav()
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
		return PostsContainerView
	}
})

begin(patch, v(container), component)