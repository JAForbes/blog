var snabbdom = require('snabbdom');
var h = require('snabbdom/h')
var unique = require('flyd/module/droprepeats').dropRepeats

module.exports = h

h.begin = require('./begin')
h.mount = require('./mount')
h.url = require('./router')
h.redrawHook = require('./redrawHook')
h.streamFromEvent = require('./streamFromEvent')
h.throttleMerge = require('./throttleMerge')
h.patch = snabbdom.init([ // Init patch function with choosen modules
  require('snabbdom/modules/class'), // makes it easy to toggle classes
  require('snabbdom/modules/props'), // for setting properties on DOM elements
  require('snabbdom/modules/style'), // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
]);
h.router = function(defaultRoute, routes){
	return function(url){
		var match;
		Object.keys(routes)
			.some(function(k){
				if(url().indexOf(k) > -1){
					match = routes[k]
				}
				return false
			})
		if(!match){
			url(defaultRoute)
		}
		return match
	}
}

h.route = function(container, url, router){

	var component = unique(url).map(function(){
		return router(url)
	})

	h.begin(h.stream(container), component)

	return url
}
var f = require('flyd')
h.merge = f.merge
h.stream = f.stream