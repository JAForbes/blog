/* global container */



const m = require('mithril')
const css = require('bss')
const sst = require('static-sum-type')
const type = require('static-sum-type/modules/taggy')
const { maybe } = require('static-sum-type/modules/yslashn')
const stream = require('mithril/stream')
const helpers = require('./bss-helpers')

css.helper(helpers)

const Loaded = maybe('Loaded')

const Route = 
	type ('Route') (
		{ List: []
		, Post: ['path']
		}
	)

Route.fold = sst.fold (Route)
Route.toURL = Route.fold (
	{ List: () => '/'
	, Post: ({ path }) => '/posts/' + path
	}
)

Route.fromURL = url =>
	url.split('posts/')
		.slice(1)
		.flatMap( x => ['?','#'].flatMap( y => x.split(y).slice(0,1)) )
		.map( path => Route.Post({ path }))
		.concat( Route.List() )
		.shift()

const routes = {
	Home: require('./components/home')
	,Post: require('./components/post')
}

function initial({ path }){
	return (
		{ route: Route.fromURL(path)
		, post: Loaded.N()
		}
	)
}


const update = stream()
const model = stream.scan( (x,f) => f(x), initial({
	path: window.location.hash
}), update)

const view = model.map( x => m('p', 'hi'))

view.map(
	vtree => m.render(container, vtree)
)

// m.route(container, '/', 
// 	{ '/': routes.Home
// 	, '/posts/:key': routes.Post
// 	}
// )
