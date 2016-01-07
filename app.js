/* global container */

var h = require('./framework')

global.url = h.url('search')

var router = h.router('/posts', {
	'/posts' : require('./routes/posts')
})

h.route(container, url, router)