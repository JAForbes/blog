/* jshint asi:true, expr:true */

disqusted = (function(){

var thread_element = document.createElement('div')
	thread_element.id = 'disqus_thread'


function disqusted(){
	killDisqus()
    initializeDisqus.bind(null,thread_element).apply(null,arguments)
}

function initializeDisqus(
	thread_element,
	thread_parent,
	disqus_shortname,
	disqus_identifier,
	disqus_url,
	disqus_title
){

	thread_parent.appendChild(thread_element)
	var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
	dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
	(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);

}

function toArray(input){
	var array = []
	for(var i = 0; i < input.length; i++){
	  array.push(input[i])
	}
	return array;
}


function invoke(method){
	return function(item){
		return item[method]()
	}
}

function killDisqus(){
	var $ = document.querySelectorAll.bind(document);
	toArray($('iframe[title="Disqus"]'))
		.concat(
			toArray($('script[src="//jaforbes.disqus.com/embed.js"]')),
			thread_element
		).map(invoke('remove'))

	window.DISQUS && Object.keys(DISQUS).map(function(key){
	  delete DISQUS[key]
	})
}
	window.killDisqus = killDisqus
	return disqusted
}())