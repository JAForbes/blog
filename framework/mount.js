function mount(patch, olddom, newdom){

	function redraw(){
		return olddom(
			patch(
				olddom(), newdom()
			)
		)
	}

	newdom.map(redraw)
}

module.exports = mount