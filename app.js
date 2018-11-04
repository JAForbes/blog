/* global container */

const m = require('mithril')
const css = require('bss')
const { maybe } = require('static-sum-type/modules/yslashn')
const stream = require('mithril/stream')
const helpers = require('./bss-helpers')
const { Router, Route } = require('./src/route')
const Action = require('./src/action')
css.helper(helpers)

const Loaded = maybe('Loaded')

const update = stream()

const model = stream.scan( 
	(x,f) => f(x)
	, initial()
	, update
)

function initial(){
	return (
		[
			{ post: Loaded.N()
			, posts: Loaded.N()
			}
		]
		.map( Router.initial )
		.shift()
	)
}

const routes = 
	{ List: 
		{ component: require('./components/home')
		, service: () => stream()
		}
	, Post: require('./components/post')
	}

const routeToView = 
	Route.fold(
		{ List: () => routes.List.component
		, Post: () => routes.Post.component
		}
	)


const view = model.map( 
	x => routeToView (x.route) (update) ( model() )
)

Router
	.start ( model )
	.map ( update )

routes.Post.service ( model )
  .map ( update )

view.map( vtree => m.render(container, vtree))

// eslint-disable-next-line no-undef
window.app = {
	update, model, Router, view, Action, Loaded
}
