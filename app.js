log = console.log.bind(console)
function List(posts){
	return '<ul class="posts">' +
		posts
		.map(function(post){
			return '<a href="#!'+post.path.replace('.md','')+'">'+ post.name +'</a>' +
			'<div class="tiny">' +moment(post.created).fromNow() + '</div>'
		})
		.map(function(anchor){
			return '<li>'+anchor+'</li>'
		}).join('') +
	"</ul>"
}

function TwitterDiscussion(post){
	if(post.twitter){
		console.log(post)
		twttr.widgets.createTweet(
			post.twitter,
			$('.post .content')[0],
			{
				theme: 'light'
			}
		);	
	}
}

function PostBody(html){
	if(!$('.post')[0]){
		$('<div class="post"><div class="content"></div></div>')
			.appendTo('body')
	}
	$('.post .content').empty().html(html)
}

function Bio(){
	return '<div class="bio">'+
		'<img src="img/bio.jpeg"/>'+
		'<p>' +"Hi!  I'm James! Programmer and a musician."+'</p>' +
	'</div>'
}

function LoadPost(path){
	path = path.replace('#!','')
	
	var post = _.findWhere(posts,{path: path+'.md'})
	$.get(path+'.md')
		.then(_.identity)
		.then(marked)
		.then(PostBody)
		.then(syntaxHighlighting)
		.then(TwitterDiscussion.bind(null,post))
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
	window.location.hash = window.location.hash || '!'+posts[0].path.replace('.md','')

	window.onhashchange = function(){
		var path = window.location.hash
		if(path.indexOf('post') > -1){
			LoadPost(path)
		}
	}
	
	window.onhashchange()

})
