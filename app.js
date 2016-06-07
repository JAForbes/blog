/* global container */

var h = require('./framework')

global.url = h.url('search')

var router = h.router('/', {
	'/': require('./routes/home')
	,'/posts': require('./routes/post')
})

url.map(function(){
	scrollTo(0,0)
})
h.route(container, url, router)