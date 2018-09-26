/* global container */



const m = require('mithril')
const css = require('bss')
m.stream = require('mithril/stream')
const helpers = require('./bss-helpers')

css.helper(helpers)

const routes = {
	Home: require('./components/home')
	,Post: require('./components/post')
}

m.route(container, '/', 
	{ '/': routes.Home
	, '/posts/:key': routes.Post
	}
)
