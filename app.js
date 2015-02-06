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
		twttr.widgets.createTweet(
			post.twitter,
			$('.post .content')[0],
			{
				theme: 'light'
			}
		);
	}
}

function PhoneNav(){
	return (
		"<div class='phone-menu-nav noselect'>"+
			"<p>&#9776;</p>"+
		"</div>"
	)
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

function SidebarTransitions(){
	var $phoneNav = $('.phone-menu-nav')

		var menuY = 0;

		$phoneNav.click(function(){
			var $sidebar = $('.sidebar')
			if( $sidebar.hasClass('show') ){
				$('.sidebar').removeClass('show')
			} else {
				$('.sidebar').css({
					top: window.scrollY
				})
				$('.sidebar').addClass('show')
				menuY = window.scrollY
			}
		})
		onFrame = function(){
			var h = $('.sidebar').height()
			var Y = window.scrollY
			var H = window.innerHeight
			if( $('.sidebar').hasClass('show') ){
				if( Y > menuY + h-H) {
					document.body.scrollTop = menuY + h-H
				} else if (Y < menuY) {
					document.body.scrollTop = menuY
				}
			}
			requestAnimationFrame(onFrame)
		}
		onFrame()
	
	$('a').click(function(){
		document.body.scrollTop = 0;
		$('.sidebar').removeClass('show')
		window.scrollTop = 0
	})
}

onPageReady = function(){

	$(
		'<div class="sidebar">'+
		Bio() +
		List(posts) +
		'</div>'+
		PhoneNav()
	).appendTo('body')
	window.location.hash = window.location.hash || '!'+posts[0].path.replace('.md','')

	window.onhashchange = function(){
		var path = window.location.hash
		if(path.indexOf('post') > -1){
			LoadPost(path)
		}
	}

	window.onhashchange()

	// media queries don't activate immediately on iphone 3gs
	// no idea why
	setTimeout(function(){
		SidebarTransitions()
	},1000)

}

$(onPageReady)
