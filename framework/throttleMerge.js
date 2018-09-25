var aftersilence = require('flyd/module/aftersilence')
if (!Array.from) Array.from = require('array-from');

var f = require('flyd')
function throttleMerge(s1, s2, s3, etc){
	var streams = Array.from(arguments);
	var head = streams.slice(0,-1)
	var tail = streams.slice(-1)[0]
	return aftersilence(0, head.reduce(f.merge, tail))
}

module.exports = throttleMerge