var f = require('flyd')
var v = f.stream
var mount = require('./mount')
var h = require('.')

function begin(olddom, domstream){
	var source = v()

	f.on(function(newdom){
		if( newdom ){
			//kill streams of old component
			source(true)

			//kill the kill stream
			source.end(true)

			//create a new source for the component
			//it will be manually ended
			//but it can also end if the olddom is ended
			source = f.endsOn(olddom.end, v())

			function scoped(){
				return f.endsOn(source, v.apply(null, arguments))
			}
			mount(h.patch, olddom, newdom(scoped) )
		}
	}, domstream)

	return olddom
}

module.exports = begin