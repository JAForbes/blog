---
title: Hardcoding is great
created: 2015-01-31T03:37:30.456Z
featured: false
archived: false
---

Better than generic coding
--------------------------

The one thing I have struggled most with over the years, is deprogramming
all the Java nonsense that was stuffed into my head at University.

Just when I think I have unlearned what I have learned, I find myself reading
recent code and getting very angry at myself for complicating a simple end goal
by trying to save myself work in the future.

So as an affirmation of the clarity that can be found by _hard_ coding.  Let's
do a code review of this website.

### Sidebar

I have just rewritten the equivalent functionality of this website in 40 mins.  It
is now much faster, and easier to edit.  I removed all the MVC nonsense
and instead have a few functions that return very specific HTML strings for my
very specific needs.

Here is the `List` function.

```js
function List(posts){
	return '<ul class="posts">' +
		posts
		.map(function(post){
			return '<a href="#'+post.path+'">'+ post.name +'</a>' +
			'<div class="tiny">' +moment(post.created).fromNow() + '</div>'
			})
			.map(function(anchor){
				return '<li>'+anchor+'</li>'
				}).join('') +
		"</ul>"
}
```

It isn't beautiful, but it is easy to understand.  I take some data `posts`.  I turn it into some HTML.

I use moment js to format the date in a pretty way.  And there is not much else to it.  Notice there is no class, instance variables, templating or any of that nonsense.

`List()` is just a function that takes an array of very specific data and spits out some very specific HTML.

It took about 3 minutes to write.  And it works wonderfully.  And I will write a new one later (from scratch!)
when I need different functionality.


### Blog Meta Data

`List()` is easy to understand, but where does the input data come from.  What is `posts`?

Previously I was grabbing my post meta data via the github API.  I was then using github commit dates as my creation date database.  What a wonderfully generic system!

Well I nuked it for a JS file with some hard coded data:

```js
posts = [
	{
		"name": "Pulling Date Stamps from Commits",
		"path": "posts/Pulling Date Stamps from Commits.md",
		"created": "2014-08-03T11:31:29Z"
	},
	{
		"name": "No Tumblr But All is Well",
		"path": "posts/No Tumblr But All is Well.md",
		"created": "2014-08-03T10:25:53Z"
	},
	{
		"name": "Hosting via gh-pages",
		"path": "posts/Hosting via gh-pages.md",
		"created": "2014-11-03T23:44:08Z"
	},
	{
		"name": "Google Glass",
		"path": "posts/Google Glass.md",
		"created": "2014-08-03T23:52:20Z"
	},
	{
		"name": "Example Post",
		"path": "posts/Example Post.md",
		"created": "2014-08-03T03:08:14Z"
	}
]
```

When I publish a new post I'll just fill in this file myself. That means I have fine control over post dates,
I don't have to make any network requests and the website is easier to review via source control.

### Rendering the Blog Post

So the blog post meta data is hard coded.  But how is it rendered?

The blog post itself is just a markdown file in the same folder as this webpage.

When we click a blog post title in the sidebar.  We just grab the file with `$.get`
convert it to html with `marked` and then render it using the function `PostBody()`

This is the code to load the file and render it.

```js
function PostBody(html){
	//remove last post if it existed
	$('.post').remove()

	$('<div class="post">'+html+'</div>').appendTo('body')
}

function LoadPost(path){
	path = path.replace('#','')

	$.get(path+'.md')
		.then(_.identity)
		.then(marked)
		.then(PostBody)
}
```

`LoadPost` gets called on the click event for a list item.  It simply loads the markdown file, converts it to HTML and then renders it
via the `PostBody` function.

The `_.identity` is just a quick hack to prevent `$.get`'s extra arguments from polluting the markdown function.

Because I am using markdown, I don't need a front end for editing blog posts.  I just use any old text editor.

### Routes and Initialisation

I've nearly shown you the entire source for the site.  All that is left is initializing the page and handling
routes.

```js
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
```

`path = window.location.hash || '#'+posts[0].path` is handling someone linking to specific posts.
If the route is empty.  We load the most recent post by default.

Here is the code for the side bar:

```
'<div class="sidebar">'+
	Bio() +
	List(posts) +
'</div>'
```

`Bio()` just returns a profile picture and a paragraph.  And you've already seen `List(posts)`
And remember, no templating!

Here is the click handler for loading posts:

```
$('.posts a').click(function(){
	var path = $(this).attr('href')
	LoadPost(path)
})
```

Notice `LoadPost(path)` is the same function we use to handle the `window.location.hash` on initialisation.
That was just a happy accident I was not _trying_ to be generic.

Conclusion
----------

This website is now easier to edit.  The page doesn't rely on slow external API requests, and I can control everything
in a text editor.

Instead of being afraid of hard coding, we should discuss how to hard code in a way that is easy to edit later.
Hard coding and using a Class based approach is the real danger.

Because my hard coding is broken up into isolated functions, it would be trivial to make any part more generic when
the need arose.

