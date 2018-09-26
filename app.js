/* global document, container */



const m = require('mithril')
const css = require('bss')
m.stream = require('mithril/stream')
const helpers = require('./bss-helpers')

css.helper(helpers)

// todo-james do this as a service
const updateTitle = Component => ({
	view(){
		return m('div', 
			{ oncreate(){
				setTimeout(
					() => {

						const heading = document.querySelector('h1,h2')
						
						document.title = 
							"James Forbes" 
								+ (heading ? ' - ' + heading.innerText : '')
					}
					,1000
				)

			}
			}
			, m(Component)
		)
	}
})

const routes = {
	Home: updateTitle(require('./components/home'))
	,Post: updateTitle(require('./components/post'))
}

m.route(container, '/', 
	{ '/': routes.Home
	, '/posts/:post': routes.Post
	}
)
