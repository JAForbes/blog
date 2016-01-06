var f = require('flyd')

function streamFromEvent(event, streamFn, mapFn){
	var eventStream = streamFn()

	var listener = function(e){
		eventStream(mapFn(e))
	}

	window.addEventListener(event, listener)

	f.on(function(){
		removeEventListener(event, listener)

		//free for garbage collection
		listener =
		streamFn =
		event =
		window =
		eventStream = null

	}, eventStream.end )

	return eventStream
}

module.exports = streamFromEvent