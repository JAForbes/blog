log = console.log.bind(console)
function List(posts){
	return '<ul class="posts">' +
		posts
		.map(function(post){
			return '<a href="#'+post.path.replace('.md','')+'">'+ post.name.replace('.md','') +'</a>' +
			'<div class="tiny">' +moment(post.created).fromNow() + '</div>'
		})
		.map(function(anchor){
			return '<li>'+anchor+'</li>'
		}).join('') + 
	"</ul>"
}

function PostBody(html){
	//remove last post if it existed
	$('.post').remove()
	
	$('<div class="post">'+html+'</div>').appendTo('body')
}

function Bio(){
	return '<div class="bio">'+
		'<img src="img/bio.jpeg"/>'+
		'<p>' +"Hi!  I'm James!  I am a programmer and a musician."+'</p>' +
	'</div>'
}

function LoadPost(path){
	path = path.replace('#','')
	
	$.get(path+'.md')
	.then(_.identity)
	.then(marked)
	.then(PostBody)
}

$(function(){

	path = window.location.hash || '#'+posts[0].path
	LoadPost(path)

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
})
