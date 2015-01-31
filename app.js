log = console.log.bind(console)
function List(posts){
	return '<ul class="posts">' +
		posts
		.map(function(post){
			return '<a href="#'+post.path+'">'+ post.name+'</a>' +
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

$(function(){
	$(
		'<div class="sidebar">'+
		Bio() +
		List(posts) +
		'</div>'
	).appendTo('body')
	$('.posts a').click(function(){
		var path = $(this).attr('href').replace('#','')
		$.get(path)
	  .then(_.identity)
		.then(marked)
		.then(PostBody)
	})
})
