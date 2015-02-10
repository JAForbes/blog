toggleSidebar = function(){
	var sidebar = document.querySelector('.sidebar');
	if( sidebar.className.indexOf('show') > -1 ){
		sidebar.className = sidebar.className.replace('show','')
	} else {
		sidebar.className += ' show'
	}
}

var POST_IS_READY = false;
var POST_IS_PENDING = false;
var POST;
var TWITTER;
var lastPath;
update = function(){
	if(document.body){

		if( window.location.hash.indexOf('posts') > -1 ){
			var path = window.location.hash.replace('#','')
			var post = _.findWhere(posts,{path: path+'.md'})


			if(path == lastPath && POST_IS_READY){
				m.render(document.body,[
					m('div.sidebar',[
						m('div.bio',[
							m('img[src="img/bio.jpeg"]'),
							m('p',"Hi! I'm James!  Programmer and a musician")
						]),
						m('ul.posts',
							posts.map(function(post){
								return m('li',[
									m('a',{href:"#"+post.path.replace('.md','') }, post.name),
									m('div.tiny', moment(post.created).fromNow() )
								])
							})
						),
						m('.phone-menu-nav.noselect', m('p',{onclick: toggleSidebar },"☰"))
					]),
					m('div.post', {config: function(el,isInit){
						isInit ||	$('pre code').each(function(i, block) {
							hljs.highlightBlock(block);
						});

					}}, [
						POST,
						m('div', {config:function(el, isInit){
							isInit || el.appendChild(TWITTER)
						}})
					])
				])

			} else if(!POST_IS_PENDING) {
				POST_IS_PENDING = true;
				m.request({method:'GET', url: post.path, deserialize: marked })
					.then(m.trust)
					.then(function(content){
						POST = content;
						POST_IS_READY = true;
						POST_IS_PENDING = false;
					})
					.then(function(){
						if( post.twitter ){
							temp = document.createElement('div');
							twttr.widgets.createTweet(
								post.twitter,
								temp,
								{
									theme: 'light'
								}
							)
							TWITTER = temp.children[0]
						}
					})
			}


		}
		lastPath = path

	}
	requestAnimationFrame(update)
}
update()
