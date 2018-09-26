/* global document, container */



const m = require('mithril')
const css = require('bss')
m.stream = require('mithril/stream')
const helpers = require('./bss-helpers')

css.helper(helpers)

// todo-james do this as a service
const updateTitle = Component => 
	[
		() => {
			const heading = document.querySelector('h1,h2')
			
			document.title = 
				"James Forbes" 
					+ (heading ? ' - ' + heading.innerText : '')
		}
	]
	.map( f => () => setTimeout(f, 1000) )
	.map( f => ({ attrs }) => 
		m('div', Object.assign({ oncreate: f }, attrs), m(Component)) 
	)
	.map( view => ({ view }))
	.shift()


const routes = {
	Home: require('./components/home')
	,Post: require('./components/post')
}

m.route(container, '/', 
	{ '/': routes.Home
	, '/posts/:key': routes.Post
	}
)
