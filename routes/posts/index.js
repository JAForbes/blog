/* global url */
/* global twttr */
var marked = require('marked')

var Prism = require('prismjs');

global.Promise = require('es6-promise').Promise
if (!Array.from) Array.from = require('array-from');
require('fetch-ie8')

var h = require('../../framework')
var R = {
	pipe: require('ramda/src/pipe'),
	pipeP: require('ramda/src/pipeP'),
	invoker: require('ramda/src/invoker'),
	tap: require('ramda/src/tap'),
	once: require('ramda/src/once'),
	path: require('ramda/src/path'),
	when: require('ramda/src/when')
}

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

	var view = h.merge(list, show_sidebar).map(function(){
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

function PhoneNav(v, show_sidebar$){
	function toggle(stream){
		return stream(!stream())
	}

	return show_sidebar$.map(function(){
		return h('div', {
			class: { 'phone-menu-nav': true, noselect: true },
			on: { click: [toggle, show_sidebar$] },
		}, [
			h('p', { props: { innerHTML: '&#9776;' } } )
		])
	})
}

function Twitter(v, post, postBody){

	var setupTwitter = R.once(function(node){

		node.elm.innerHTML = ""

		if(post().twitter){
			return twttr.widgets.createTweet(
				post().twitter,
				node.elm,
				{ theme: 'light' }
			)
		}

	})

	var twitterHook =
		h.redrawHook(
			R.when(function(){
				return post().path
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
		Prism.highlightAll()
	})

	var highlightHook =
		h.redrawHook(
			R.when(
				R.path(['elm','children','length']),
				highlightCode
			)
		)

	var twitter = Twitter(v, post, postBody)

	var model = h.merge(postBody, post);

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

	if(url().indexOf('posts/') > -1){
		markdown_url( url() + '.md')
	}

	var postBody = markdown_url.map(fetchBlogHTML)

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

	return {
		postBody: postBody,
		post: post,
		posts: posts,
		show_sidebar: show_sidebar
	}
}

var postsCache = h.stream([])

function PostsContainerView(v){

	var model = PostsModel(v, postsCache)

	var views = {
		post: Post(v, model.postBody, model.post),
		sidebar: Sidebar(v, model.posts, model.show_sidebar),
		phoneNav: PhoneNav(v, model.show_sidebar)
	}

	var subviews = h.throttleMerge(views.sidebar, views.post, views.phoneNav)

	var view = subviews.map(function(){
		return h('div', { class: { container: true }}, [
			views.sidebar(),
			views.post(),
			views.phoneNav()
		])
	})

	return view
}

module.exports = PostsContainerView