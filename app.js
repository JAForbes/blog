hideSidebar = function(){
	document.querySelector('.post').scrollTop = 0
	toggleSidebar()
}

toggleSidebar = function(){
	var sidebar = document.querySelector('.sidebar');
	if( sidebar.className.indexOf('show') > -1 ){
		sidebar.className = sidebar.className.replace('show','')
	} else {
		sidebar.className += ' show'
	}
}

var POST_IS_READY = 0;
var POST_IS_PENDING = 0;
var POST;
var TWITTER;
var lastPath;

update = function(){
	if(document.body){
		var path = window.location.hash.replace('#','') || posts[0].path.replace('.md','')
		if( path.indexOf('posts') > -1 ){

			var post = _.findWhere(posts,{path: path+'.md'})

			if(POST_IS_READY == 2){
				var blocks = document.querySelectorAll('pre code')
				for(var i = 0; i < blocks.length; i++){
					hljs.highlightBlock(blocks[i]);
				}
			}

			if(path == lastPath && POST_IS_READY){
				POST_IS_READY++
				m.render(document.body,[
					m('div.sidebar',[
						m('div.bio',[
							m('img[src="img/bio.jpeg"]'),
							m('p',"Hi! I'm James!  Programmer and a musician")
						]),
						m('ul.posts',
							posts.map(function(post){
								return m('li',[
									m('a',{href:"#"+post.path.replace('.md',''), onclick: hideSidebar}, post.name),
									m('div.tiny', moment(post.created).fromNow() )
								])
							})
						),
						m('.phone-menu-nav.noselect', m('p',{onclick: toggleSidebar },"☰"))
					]),
					m('div.post', [
						POST,
						m('div', {config: function(el, isInit){
							isInit || TWITTER && el.appendChild(TWITTER)
						}})
					])
				])

			} else if(path != lastPath && !POST_IS_PENDING) {
				POST_IS_PENDING = true;
				m.request({method:'GET', url: post.path, deserialize: marked })
					.then(function(content){
						POST = m.trust(content)
						POST_IS_READY = 1;
						POST_IS_PENDING = 0;
					})
					.then(function(){
						if( post.twitter ){
							var temp = document.createElement('div');
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
