/* global container */



const m = require('mithril')
m.stream = require('mithril/stream')

const routes = {
	Home: require('./routes/home')
	,Post: require('./routes/post')
}
m.route(container, '/', 
	{ '/': routes.Home
	, '/posts/:post': routes.Post
	}
)


// todo-james use a route resolver?
// url.map(function(page){

// 	setTimeout(function(){

// 		const heading = document.querySelector('h1,h2')

// 		document.title = 
// 			"James Forbes" + (heading ? ' - ' + heading.innerText : '')

		

// 	}, 1000)

// 	scrollTo(0,0)

// })

