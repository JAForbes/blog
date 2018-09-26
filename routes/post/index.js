
/* global twttr */
const marked = require('marked')
const Prism = require('prismjs');
const navbar = require('../navbar')
const Posts = require('../posts')

const m = require('mithril')
m.stream = require('mithril/stream')
const R = {
	pipe: require('ramda/src/pipe')
	,pipeP: require('ramda/src/pipeP')
	,invoker: require('ramda/src/invoker')
	,tap: require('ramda/src/tap')
	,once: require('ramda/src/once')
	,path: require('ramda/src/path')
	,when: require('ramda/src/when')
}

function Twitter(vnode){

	const post = vnode.attrs.post
	function setupTwitter(node){

		node.dom.innerHTML = ""

		console.log('setupTwitter', post())
		if(post() && post().twitter && post().path){
			try {
				return twttr.widgets.createTweet(
					post().twitter,
					node.dom,
					{ theme: 'light' }
				)
			} catch (e) {}
		}

		return null

	}

	return {
		view: () => m('div', {
			oncreate: setupTwitter
		})
	}
}

function Post({ attrs:{postBody, post}}){

	const highlightCode =
		R.when(
			R.path(['dom','children','length']),
			() => Prism.highlightAll()
		)

	
	return {
		view: () => 
		console.log({ post: post() }) ||
		m('div.post'
			,m('div', 
				{ oncreate: highlightCode
				}
				,m.trust(postBody())
			)
			,m('br')
			,m(Twitter, { post, key: post() && post().path })
		)
	}
}

function PostsModel(postsCache){
	const fetchBlogHTML = x =>
		[ x => m.request({ 
			url: x
			,headers: { "Content-Type": "text/markdown" }
			,deserialize: marked
		})
		, x => console.log({ x }) || x
		, postBody
		]
		.reduce( (x, f) => x.then(f), Promise.resolve(x) )

	const markdown_url = m.stream()

	if(m.route.param('post')){
		markdown_url( 'posts/'+m.route.param('post') + '.md')
	}

	const postBody = m.stream()

	postBody.map( () => m.redraw() )
	
	markdown_url.map(fetchBlogHTML)

	//so the sidebar doesn't redraw with an empty posts.json every redraw
	const posts = m.stream()
	postsCache().map(posts)
	const post = posts.map(function(posts){
		const murl = markdown_url()
		for(let i = 0; i < posts.length; i++){
			console.log(murl(), posts[i].path)
			if( '/'+posts[i].path == murl ) return posts[i]
		}
		return {}
	})

	m.request('posts.json').then(function(response){
		return response.json()
	})
		.then(R.pipe(
			R.tap(posts),
			postsCache
		))
		.then( () => m.redraw() )

	return {
		postBody: postBody
		,post: post
		,posts: posts
	}
}

const postsCache = m.stream([])

function PostsContainerView(){

	const model = PostsModel(postsCache)
	const view = function(){
		return m('div.container'
			,navbar
			,m(Post, model)
			,m('br')
			,m(Posts)
		)
	}

	return { view }
}

module.exports = PostsContainerView