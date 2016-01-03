var f = require('flyd')
	f.dropRepeats = require('flyd/module/droprepeats').dropRepeats

var v = f.stream

var I = function(v){ return v }

function mode_to_char(mode){
	return {
		pathname: '/', search: '?', hash: '#'
	}[mode]
}

function currentPath(mode, mode_char){
	window.location[mode()].replace(mode_char(), "")
}

function router(options){
	options = options || {}
	var mode = v(options.mode || 'search')
	var mode_char = mode.map(mode_to_char)

	//internal stream of pop state urls
	var popstate = v()

	//external getter setter stream for pushing state
	var external_url = f.dropRepeats(popstate.map(I))
	var url = f.dropRepeats(external_url)

	//make all streams end when url ends
	//so the outside world can end the stream
	f.endsOn(url.end, popstate)
	f.endsOn(url.end, mode)

	//if its from the backbutton, do not push state
	f.on(function(url){
		if(currentPath(mode, mode_char) != url){
			history.pushState({}, '', mode_char() + url)
		}
	}, url)

	//when the backbutton triggers, set the popstate
	//which also sets the url - without pushing state -
	onpopstate = function(){
		popstate( window.location[mode()].replace(mode_char(), "") )
	}
	//initial state push
	onpopstate()

	return external_url
}
module.exports = router