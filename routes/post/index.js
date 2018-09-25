/* global url */
/* global twttr */
var marked = require('marked')
var Prism = require('prismjs');
var j2c = require('j2c')
var navbar = require('../navbar')
var posts = require('../posts')

var appStyle = require('../../css/style.css.js')
var style = Object.assign(appStyle, {
    '@font-face': {
        font_family: 'Inconsolata'
        ,src: 'url(../font/Inconsolata-Regular.ttf) format("truetype")'
    }
	,'h1': {
		text_align: 'center'
		,font_family: '"Inconsolata", sans-serif'
	}
	,'h1, h2': {
		color: '#7588d3'
	}
    ,'.post': {
        'text-align': 'left'
		,'padding':'2em'
		,'@media (min-width: 801px)': {
			'width': '80%'
			,'margin-left': '10%'
		}
    }
    ,code: {
        'font-size': '0.9em'
    }
    ,'code, code span': {
        font_family: '"Inconsolata", sans-serif'
        ,color: 'black'
    }
})
var sheet = j2c.sheet(style)

global.Promise = require('es6-promise').Promise
if (!Array.from) Array.from = require('array-from');
require('fetch-ie8')

var h = require('../../framework')
var R = {
	pipe: require('ramda/src/pipe')
	,pipeP: require('ramda/src/pipeP')
	,invoker: require('ramda/src/invoker')
	,tap: require('ramda/src/tap')
	,once: require('ramda/src/once')
	,path: require('ramda/src/path')
	,when: require('ramda/src/when')
}

function Twitter(v, post){

	var setupTwitter = R.once(function(node){

		node.elm.innerHTML = ""

		if(post().twitter){
			try {
				return twttr.widgets.createTweet(
					post().twitter,
					node.elm,
					{ theme: 'light' }
				)
			} catch (e) {}
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
		return h('div', { props: { className: sheet.post }}, [
			h('div', {
				key: 'post-view'
				,props: { innerHTML: postBody() || "" }
				,hook: highlightHook
			})
			,h('br')
			,twitter()
		])
	})

	return view
}

function PostsModel(v, postsCache){
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
		posts: posts
	}
}

var postsCache = h.stream([])

function PostsContainerView(v){

	var model = PostsModel(v, postsCache)

	var views = {
		post: Post(v, model.postBody, model.post)
	}

	var subviews = h.throttleMerge(views.post)

	var view = subviews.map(function(){
		return h('div', { class: { container: true }}, [
			h('style', String(sheet) )
			,navbar
			,views.post()
			,h('br')
			,posts
		])
	})

	return view
}

module.exports = PostsContainerView