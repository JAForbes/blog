
/* global twttr */
const marked = require('marked')
const Prism = require('prismjs')
const { maybe } = require('static-sum-type/modules/yslashn')
const { bifold } = require('static-sum-type')
const navbar = require('./navbar')
const Posts = require('./posts')
const Router = require('../src/route')

require('prismjs/components/prism-json');
require('prismjs/components/prism-bash');

const m = require('mithril')
const stream = require('mithril/stream')
const dropRepeats = require('../src/drop-repeats')

const Loaded = maybe('Loaded')

const True = () => true
const False = () => false
const then = f => p => p.then(f)

/* globals scrollTo */

function scrollTop(){
    scrollTo(
        { top: 0
        , behavior: 'smooth'
        }
    )
}


function Twitter(vnode){

	const post = vnode.attrs.post
	function setupTwitter(vnode){

		vnode.dom.innerHTML = ""

		if(post && post.twitter && post.path){
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

const isPostLoaded = isPostLoaded => 
	bifold (Loaded) (False, True) (isPostLoaded.post)

const assertLoaded = x => bifold (Loaded) ( () => [],  x => [x]) (x)

const Post = () => model => {

	// todo-james make a service
	// store when renders happen as data so a service can
	// trigger after the render after a post loads
	const highlightCode =
		x => [x]
			.filter( () => isPostLoaded(model) )
			.forEach(
				() => Prism.highlightAll()
			)

	
	return m('div.post',
		// todo-james also make a service
		// scroll to the top if y > n and the url has changed to a new post
		{ oncreate: () => setTimeout(scrollTop,1000)}
		,m('div', 
			{ oncreate: highlightCode
			, key: 
				isPostLoaded( model )
				&& model.post.value.path 
					+ model.post.value.body.length
				
			}
			, [model.post]
				.flatMap( assertLoaded )
				.map( x => m.trust(x.body) )
		)
		,m('br')
		,[ model.post ]
			.flatMap( assertLoaded )
			.map( x => x.meta )
			.flatMap( assertLoaded )
			.map( meta => 
				m(Twitter
					, { post: meta, key: meta.path }
				)
			)
	)
}

const service = theirModel$ => {

	const update$ = stream()

	
	const model$ = dropRepeats( ({ route }) => ({ route }) ) ( theirModel$ )

	// Cache promise to ensure blog html fetched after metadata fetched
	// while also avoiding refetching again and again
	const fetchingPostsJSON = m.request('/posts.json')
	
	const fetchBlogHTML = x =>
		fetchingPostsJSON.then(
			() => m.request(
				{ url: x
				, headers: { "Content-Type": "text/markdown" }
				, deserialize: marked
				}
			)
		)
	
	fetchingPostsJSON
		.then(
			posts => Loaded.Y(posts)
		)
		.then(
			posts => update$( model => Object.assign({}, model, { posts }) )
		)

	model$.map(
		model => {
			const path = 
				Router.Route.fold(
					{ List: () => []
					, Post: ({ path }) => [path]
					}
				) (model.route)

			path
			.map(
				path => fetchBlogHTML(path)
					.then(
						body => 
							Object.assign(
								{ body
								, path
								, meta:
									bifold ( Loaded ) (
										() => [],
										xs => xs
									) (model.posts)
									// Technically the meta data may not be
									// found (old url no longer in posts.json)
									.filter( x => x.path == path )
									.slice(0,1)
									.map( Loaded.Y )
									.concat( Loaded.N() )
									.shift()
								}
							)
					)
			)
			.map( then(Loaded.Y) )
			.concat(
				Promise.resolve( Loaded.N() )
			)
			.slice(0,1)
			.map(
				then(
					post => update$(
						model => Object.assign({}, model, { post })
					)
				)
			)
			.map( x => x.catch(console.error) )

			return null
		}
	)

	return update$
}

const component = update => model => {
	
	return m('div.container'
		,navbar(update)(model)
		,Post(update)(model)
		,m('br')
		,Posts(update)(model)
	)
}

module.exports = 
	{ component
	, service
	}