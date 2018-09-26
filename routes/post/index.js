
/* global twttr */
const marked = require('marked')
const Prism = require('prismjs');
const navbar = require('../navbar')
const Posts = require('../posts')

const m = require('mithril')
m.stream = require('mithril/stream')

function Twitter(vnode){

	const post = vnode.attrs.post
	function setupTwitter(vnode){

		vnode.dom.innerHTML = ""

		if(post() && post().twitter && post().path){
			try {
				return twttr.widgets.createTweet(
					post().twitter,
					vnode.dom,
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
		x => [x]
		.filter( x => x.dom.children.length )
		.forEach(
			() => Prism.highlightAll()
		)

	
	return {
		view: () => 
		m('div.post'
			,m('div', 
				{ oncreate: highlightCode
				}
				,m.trust(postBody())
			)
			,m('br')
			,post() 
			&& m(Twitter, { post, key: post().path })
		)
	}
}

function PostsModel(){
	const fetchBlogHTML = x =>
		[ x => m.request({ 
			url: x
			,headers: { "Content-Type": "text/markdown" }
			,deserialize: marked
		})
		, postBody
		]
		.reduce( (x, f) => x.then(f), Promise.resolve(x) )
		.catch( console.error )

	const markdown_url = m.stream()

	if(m.route.param('post')){
		markdown_url( 'posts/'+m.route.param('post') + '.md')
	}

	const postBody = m.stream()

	postBody.map( () => m.redraw() )
	
	markdown_url.map(fetchBlogHTML)

	//so the sidebar doesn't redraw with an empty posts.json every redraw
	const posts = m.stream()
	
	posts.map(
		posts => console.log({ posts })
	)
	const post = posts.map(function(posts){
		const murl = markdown_url()
		return posts.find( x => x.path === murl ) || {}
	})

	m.request('posts.json')
		.then(posts)
		.catch( console.error )
		.then( () => m.redraw() )
		

	return {
		postBody: postBody
		,post: post
		,posts: posts
	}
}

function PostsContainerView(){

	const model = PostsModel()
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