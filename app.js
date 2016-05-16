/* global container */

var h = require('./framework')

global.url = h.url('search')

var router = h.router('/home', {
	'/home': require('./routes/home')
	,'/posts': require('./routes/posts')
})

h.route(container, url, router)