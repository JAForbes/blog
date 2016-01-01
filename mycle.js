var f = require('flyd')
function mount(patch, container, baseview){
	var olddom = f.stream()

	function redraw(){
		return olddom(
			patch(
				olddom(), baseview()
			)
		)
	}

	return function(){
		olddom(container)
		baseview.map(redraw)
	}()
}

module.exports = mount