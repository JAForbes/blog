log = console.log.bind(console)
function List(posts){
	return '<ul class="posts">' +
		posts
		.map(function(post){
			return '<a href="#'+post.path.replace('.md','')+'">'+ post.name +'</a>' +
			'<div class="tiny">' +moment(post.created).fromNow() + '</div>'
		})
		.map(function(anchor){
			return '<li>'+anchor+'</li>'
		}).join('') +
	"</ul>"
}

function PostBody(html){
	if(!$('.post')[0]){
		$('<div class="post"><div class="content"></div></div>')
			.appendTo('body')
	}
	$('.post .content').empty().html('<div class="content">'+html+'</div>')
}

function Bio(){
	return '<div class="bio">'+
		'<img src="img/bio.jpeg"/>'+
		'<p>' +"Hi!  I'm James!  I am a programmer and a musician."+'</p>' +
	'</div>'
}

function LoadPost(path){
	path = path.replace('#','')
	var disqus_thread = $('#disqus_thread')[0]

	$.get(path+'.md')
		.then(_.identity)
		.then(marked)
		.then(PostBody)
		.then(syntaxHighlighting)
		.then(resetDisqus.bind(null,disqus_thread))
}

function initDisqus(disqus_shortname,done){
	var disqus_thread = document.createElement('div')
		disqus_thread.style.display = 'none';
		disqus_thread.id = 'disqus_thread'

	document.body.appendChild(disqus_thread)

	var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = false;

	dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
	(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);

	dsq.onload = done
}

function resetDisqus(disqus_thread){
	$('.post').append(disqus_thread)
	disqus_thread.style.display = 'block';
	DISQUS.reset({
	  reload: true,
	  config: function () {
	    this.page.identifier = ($('h1')[0] || $('h2')[0]).id;
	    this.page.url = window.location.href;
	  }
	});
}

function syntaxHighlighting(){
	$('pre code').each(function(i, block) {
	    hljs.highlightBlock(block);
	});
}

$(function(){

	$(
		'<div class="sidebar">'+
		Bio() +
		List(posts) +
		'</div>'
	).appendTo('body')
	$('.posts a').click(function(){
		var path = $(this).attr('href')
		LoadPost(path)
	})
	window.location.hash = window.location.hash || posts[0].path.replace('.md','')

	window.onhashchange = function(){
		var path = window.location.hash
		if(path.indexOf('post') > -1){
			LoadPost(path)
		}
	}
	initDisqus('jaforbes',window.onhashchange)


})
