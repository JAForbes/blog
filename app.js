/* global document, container */



const m = require('mithril')
m.stream = require('mithril/stream')


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
