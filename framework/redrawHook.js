function redrawHook(callback){
	return {
		insert: callback,
		update: function(_, newNode){
			callback(newNode)
		}
	}
}

module.exports = redrawHook