The Road from Backbone to Mithril
=================================

![](http://images.starpulse.com/Photos/Previews/Zoolander-08.jpg)

When I first started eyeing off mithril, I found it hard to imagine adpating my existing knowledge of JS app development 
to this new framework.  There is a great article [Leo Horie](github.com/lhorie) wrote comparing 
[mithril to other major JS Frameworks](http://lhorie.github.io/mithril/comparison.html) but it was written as if the reader had
already bought into mithril's philosophies.

The framework I had the most experience with, before trying mithril, was Backbone.  So instead of saying why Mithril is better
than [Backbone](http://backbonejs.org/), I'm just going to show how to map Backbone's core ideas to Mithril, 
and leave the final judgement up to the reader.

Views
-----

Backbone introduced order to Javascript.  Before Backbone, we used to write applications as a series of jQuery event handlers
that micro managed specific DOM elements.  The previous approach became extremely hard to reason about because it wasn't clear
which steps happened in which order.  It was quite common for many different parts of the codebase to modify the same
elements on the page for different reasons and at different times.

Backbone didn't remove events from the application model, it extended them.  
Looking back at this decision it seems like adding oil to an already roaring fire.  
But we have to remember the historical context, simply adding a new data model was enough change, the JS community would have been
sceptical about introducing an alien paradigm to their applications.

So Backbone did the next best thing, it made sure all the code that interacted with a given subtree lived in one file, a View.
And all the events that operated on that view were declared in the same place at the top of the file.

```js
var OrganizedView = Backbone.View.extend({
  events: {
    'click button': 'onSubmit'
    'input .name': 'onInput'
  }
  
  onSubmit: function(e){}
  onInput: function(e){}
})
```

This is truly the most important change Backbone brought to the application model.  Interestingly enough Backone.View accounts for the smallest percentage of source code in the framework.

There is a lot more to Backbone than it's Views, but I will argue that the rest of Backbone is no longer relevant in the current JS landscape.

Simplicity vs Structure
-----------------------

Before Lodash, we had Underscore.  And Underscore was not anywhere near as mainstream as the library that made use of it, Backbone.
Backbone's Collection methods became a marketing tactic for utility oriented development.
These collection methods convinced us we didn't need to write custom logic for managing our data.  
We could use existing functions like `difference`, `sort`, `where` etc.

Backbone was secretly introducing us to functional programming.  But in order to avoid creating panic, we pretended these utilities
were methods instead of pure functions.  This meant that when we wanted to use new functions, we had to `extend` the base collection.

A simpler approach would have just been to use underscore directly and keep all our collections as arrays of plain objects.
When you want to implement new functionality, you don't need to introduce inheritance (and all the complexity that entails).

But at this point in history, we were afraid of elegance because working with jQuery had scared us away from simple solutions to simple problems.  Structure seemed more valuable than any other axis.  Simplicity was scary.

```js
// --Method based--
var c = new Backbone.Collection([ { name: 'Backbone' }, { name: 'Mithril'} ])

c.pluck('name') 
//=> [ 'Backbone', 'Mithril' ]

// --Functional--
var a = [ { name: 'Backbone' }, { name: 'Mithril'} ]
_.pluck(a, 'name') 
//=> [ 'Backbone', 'Mithril' ]
```

Sever Communication
-------------------

Another reason we used Collections and Models in Backbone was to add structure to our server calls.
Backbone strongly encouraged us to implement RESTful API's.  It promised us that it would take care of synchronization
as long as our API followed best practices.

Backbone provided methods like `sync`, `save` & `fetch`, that would automatically construct the relevant XHR query based on
metadata stored on Collection.

It became quite common to want to modify or manipulate the request or response though.  Backbone provided events that we could
hook into to perform modifications.  Backbone even recommended overriding sync either at the Collection level or at the global
level.  In the end, one often wondered whether we were hacking against Backbone in the right way, or the wrong way?


```js
Backbone._sync = Backbone.sync
Backbone.sync = _.wrap(Backbone._sync, function(fn, args){
  // What am I doing ???
  return fn(args) // I guess? 
})
```
![](https://media.giphy.com/media/C7olQswvzSwAE/giphy.gif)

Backbone encouraged play, but didn't offer guidance when doing so.  Backbone knew it wasn't going to handle the needs 
of every application out there, so it tried to encourage reading it's source, and providing as many hooks as possible.
But the sea of documentation and hooks just created an illusion of structure without any clear benefits.

You had more code than you needed, and you were required to constantly refer to the documentation to see exactly how these XHR methods behaved for different HTTP methods and what the difference was when being dispatched from a model or from a collection.

The XHR API was a mess, we didn't have the Fetch API or even A+ Promises! 
Backbone seemed to make things easier.  But all we probably needed was a nice utility function for dealing with network requests.
Low level enough that we didn't need hooks, but still concise and without boilerplate (mithril provides exactly that).

A lot of the gains we felt we were getting were probably by making our server's API less chaotic, not by using Backbone's API per se.

Routing
-------

The Router in Backbone is simple as it could be given the point in time in which it was created.
You provide a hash of urls with pattern matching for variables within in that URL.  The first pattern that matches will trigger
a callback.  The nicest part about this is how similar it is to the event declaration code in a Backbone View.

```js
var Facebook = Backbone.Router.extend({
  routes: {
    '/:user': 'onProfile',
    '/messages/': 'onMessages',
    '/settings/:setting': 'onSettings',
    '/settings': 'onSettings',
    '/': 'onNewsFeed'
  },
  
  onProfile: function(){
    // fetch necessary data
    // instantiate or trigger new view to render
  },
  
  onMessages: function(){
    // fetch necessary data
    // instantiate or trigger new view to render
  }
  onSettings: function(){
    // fetch necessary data
    // instantiate or trigger new view to render
  }
  onNewsFeed: function(){
    // fetch necessary data
    // instantiate or trigger new view to render
  }
})
```

Every callback does the same thing though.  It would be a lot easier if the route hash instead instantiated the new View.

```js
var Facebook = Backbone.Router.extend({
  routes: {
    '/:user': ProfileView,
    '/messages/': MessagesView,
    '/settings/:setting': SettingsView,
    '/settings': SettingsView,
    '/': NewsFeedView
  }
})
```

I'm sure the Backbone team thought of this, and I'm sure the reason they didn't go with it was because of [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns).  Backbone was trying to bring the Model View Controller architecture
from the server to the client.  This was a pretty controversial stance at the time.  The Backbone team, wisely, did not deviate much from the patterns used on the server side.  One of the core tenets of MVC advocates is, separation of business logic and state from
the view layer.  The view should not manage state, it should only represent it.

This makes a lot of sense when you think about the domain of server side applications.  Your model layer may be reused by command line tools, OS level gui's, the browser and on and on.  Keeping as much of the business logic out of the view as possible theoretically ensures reuse of 90% of your application's code.

But we're not writing our app on the server.  We're in a browser.  And there is only one way to interact with our business logic, *via a view*.  Separating state management into the Routing, Collection and Model layer only adds complexity.  Let's imagine a View oriented archictecture in Backbone.  No Models, No Router callbacks.

```js
// 1. There is only 1 router, so why bother creating a class?
// 2. When the route matches, initialize the View
//    Automatically calls View.remove from the previous route
Backbone.Router({
  '/:user': ProfileView,
  '/messages/': MessagesView,
  '/settings/:setting': SettingsView,
  '/settings': SettingsView,
  '/': NewsFeedView
})

var NewsFeedView = Backbone.View.extend({

  news: [],
  className: 'news-feed',
  
  initialize: (){
    
    this.render() //Render Loading
    
    fetch('api.facebook.com/newsfeed')
      .then( r => r.json() )
      .then( r => this.news = r )
      // Render server data
      .then( this.render )
   
  },
  
  render: (){
    this.el.innerHTML = 
      this.news.length == 0
      ? 'Loading ...' 
      : this.news.map(
          n => '<div class="news-content">'+ n.content + '</div>'
        )
        .join('')
  }
})
```

The above Router is completely made up, it is an illustration of how much simpler Routing can be if we just accept that the View
knows what data it needs and when.

In the View, I've fetched the data we needed and rendered twice.  The first time we just tell the user we are loading,
the second time we map over the response and create HTML from the data.

The way I've written the render function is not idiomatic Backbone.  I could very well be replacing part of the view
that does not need to be replaced.  But, it is a lot easier to see the way the view will render by simply returning a new dom every time.

> It would be nice if there was a system that could automatically only apply the changes efficiently...

Let's take this further.  Imagine all our different Views, they would all be doing the same thing, render with the intitial state,
fetch the necessary data, and then render again.  When any event occurs, render again.

What if we established a contract with our router, we could expose a `view` method that returns a HTML string, and it could automatically apply the changes for us.  Our view becomes...

```js
var NewsFeedView = Backbone.View.extend({

  news: [],
  className: 'news-feed',
  
  initialize: function(){
     fetch('api.facebook.com/newsfeed')
      .then( r => r.json() )
      .then( r => this.news = r )
  },
  
  view: function(){
    return this.news.length == 0
      ? 'Loading ...' 
      : this.news.map(
          n => '<div class="news-content">'+ n.content + '</div>'
        )
        .join('')
  }
})
```

Notice I'm now returning the generated content, not assigning it to the parent element.  This allows the library to decide when and how to apply the change, we simply state what the final result should look like.

There is still a lot of boilerplate though.  Why are we extending from Backbone.view?  Backbone.view has some builtin methods for removal, managing events and managing the containing element.  
We already decided the framework was going to handle removal and event management.  
What if we just returned our containing element directly, then we wouldn't need the base view, or inheritance.

```js
var NewsFeedView = {

  news: [],
  
  initialize:(){
    fetch('api.facebook.com/newsfeed')
      .then( r => r.json() )
      .then( r => this.news = r )
  },
  
  view: (){
    return '<div className="news-feed">' +
      this.news.length == 0
      ? 'Loading ...' 
      : this.news.map(
          n => '<div class="news-content">'+ n.content + '</div>'
        )
        .join('') +
    '</div>'
  }
})
```

Clearly we can't write complex views by concatenating together HTML strings.  But I think we've now reached a sufficient conceptual plane to bridge the gap between Backbone and Mithril.  We've removed inheritance, we've removed the model layer, the routing layer.
We're declaratively returning what our view should look like, and we're exposing two functions for our framework to hook into (`initialize` and `view`).

We've basically created a rudimentary version of mithril.  Let's complete the transformation.

![](http://m3.paperblog.com/i/9/93755/zoolander-2001-L-86Et_s.jpeg)

```js
var NewsFeedView = {
  
  controller: function(){
    this.news = m.request({ 
      method: 'GET', 
      url: 'api.facebook.com/newsfeed',
      initialValue: []
    )
  }
  
  view: function(){
    return m('div.news-feed', 
      this.news().length 
      ? 'Loading ...'
      : this.news().map(
        n => m('div.news-content', n.content)
      )
    )
  }
}

m.route(document.body, '/', {
  '/:user': ProfileView,
  '/messages/': MessagesView,
  '/settings/:setting': SettingsView,
  '/settings': SettingsView,
  '/': NewsFeedView
})

```

Behold, we've conceptually migrated from Backbone to Mithril.  Let me walk through the small changes needed to bridge the gap.

`m.request` is an XHR utility built into mithril.  It returns a getter/setter called a prop.  Because we are performing XHR via
m.request, mithril will automatically redraw our `view` when the request completes.  Because we have specified an `initialValue`
our view be able to render immediately even though the request hasn't completed.

m.request has an extremely flexible [API](http://lhorie.github.io/mithril/mithril.request.html) that removes the need for complex object relationship management.

> I personally just use the fetch API.  If you are intrigued, you can read about [how I use Mithril](http://james-forbes.com/?/posts/how-i-use-mithril)

You'll notice I'm *calling* `this.news()` that's because `news` is not an array anymore, its a `prop` that contains an `array`.
In order to get to the underlying data you just call it.  Props are a light weight replacement to Backbone.Model.get/Backbone.Model.set, where every attribute has it's own get/set functionality.  

Calling a prop doesn't trigger any events, but it allows us to use the prop as an event callback directly.

> I've written extensively about props [here](http://james-forbes.com/?/posts/power-of-m-prop).

You'll also notice I've changed the name of `initialize` to `controller`.  This is just an alias to satisfy mithril's component API.
 
We are also using the `m` function to generate our DOM elements.  `m` is the most important part of mithril.  We'll walk through how it works, but for now, just think of it as a way to avoid mangling HTML strings.

There is one key step I've glossed over until now.  How do we bind events to the HTML within our view.  I've explained that the framework will redraw when events occur, but not how to bind them ourselves.

We just declare the event on the element itself.

```js
m('button', { onclick: this.onClick }, 'Click Me!')
```

When you click on that button, mithril will call your callback, and then redraw afterwards.

Here is an example of saving input from the user.

```js
var Component = {

  controller: function(){
    this.name = m.prop('')
  }

  view: (controller) => [
    m('p', 'Hi '+ controller.name())
    m('input[type=text]', {
      oninput: function(e){
        var value = (e.currentTarget || this).value;
        // save the input's value to our name prop
        controller.name(value)
    }
  })
]
```

Hopefully this is familiar, it's a lot like adding an event listener to HTML.  We get the native DOM event passed to us.
But most of the time we don't actually want to inspect the event manually.
Luckily mithril has a utility that intelligently grabs the desired property off of the event in a browser indepedent manner.

```js
m('input[type=text]', { oninput: m.withAttr('value', controller.name) }
```

Now remember, our `name` is a function.  And when we call it with a value, it will be saved internally.
This function `m.withAttr` will pass `event.currentTarget.value` to our prop whenever they input text into that element.

You could do the same thing with a checkbox:

```js
m('input[type=checkbox]', { 
  checked: controller.checked(), 
  onchange: m.witAttr('checked', controller.checked) 
})
```

Mithril will redraw our view afterwards so it will automatically be rendered in our paragraph.

```js
m('p', 'Hi '+ controller.name())
```

> Mithril redraws for us because we declared the events via mithril's templating system.  But we can redraw whenever we want by calling `m.redraw()`.  And don't worry, calling `m.redraw` twice will only trigger one redraw on the next animation frame.

Now let's imagine we wanted to reload the news feed in our previous example.  We just need a button that will trigger fetching the API.

```js
var NewsFeedView = {
  
  controller: function(){
    this.news = this.load()
  }
  
  load: function(){
    return m.request({ 
      method: 'GET', 
      url: 'api.facebook.com/newsfeed',
      initialValue: []
    )
  },
  
  view: function(ctrl){
    return m('div.news-feed', 
      this.news().length 
      ? 'Loading ...'
      : this.news().map(
        n => m('div.news-content', n.content)
      ),
      m('button',{ onclick: _ => ctrl.load().then(ctrl.news) }, 'Load New Stories')
    )
  }
}
```

We just moved our request into it's own function, and then we call that function from the click handler.  You could approach this in a million different ways - but it's extremely straightforward.  

You'll notice most of this code isn't framework specific, it should feel a lot like talking to HTML elements directly.  We've got a nice utility for making network requests and generating the DOM, but really it's just a new layer on top of a DOM API we all know well.  

We use CSS selector syntax to generate elements, we use standard event callbacks on the virtual element, the same way we would in HTML, and the rest of the application is just ceremony and boilerplate we don't need to worry about.

Trustworthy simplicity
----------------------

![](http://1520unreached.com/wp-content/uploads/2016/01/183-center_for_ants.jpg)

You may be concerned that all this simplicity will lead to slower applications, or that mithril won't be able to handle real world applications.  But, to be clear, if your Backbone app is fast, it is because you made it fast.  Backbone doesn't have a rendering system, so it is completely up to you to render in the most efficient way possible.

But here's the thing, mithril is faster than your custom application rendering logic.  The entire point of mithril is to be small and fast.
It has been optimized and benchmarked tirelessly.  Mithril is one of the fastest virtual dom algorithms out there (~7x faster than React).

And even if you don't believe me - if you need to opt out of the auto redrawing API, there are many ways to do so.  You can interact with the elements directly via mithril's config function.  You can also return `{ subtree: 'retain' }` in your view to completely avoid the redraw of that subtree.

But these are optimizations you will not need unless you are dealing with thousands of elements that are rapidly changing constantly.
Even then, mithril's opt out API is nicer than any other framework.  And you can use virtual dom for the rest of your application.

Mithril (and virtual doms in general) make extremely complex view code trivial, things like occlusion culling, conditional list rendering, dynamic styles, are all declarative and easy to read/edit.  You will have less bugs, and a faster app.

I encourage you to experiment with it yourself (and turn on paint rectangles in your dev tools).  You'll be pleasantly suprised.
If you have any performance issues, jump into the [gitter](https://gitter.im/lhorie/mithril.js).

A lot of our instincts about app development in JS are not specific to a particular framework.  What separates mithril from the pack is its focus on Javascript's semantics and characteristics, instead of framework domain specific languages and techniques.
If you know how to write fast JS, you already know how to use mithril.

And if you are running a project, you can now search for JS devs instead of developers focused on a particular framework.  They will be better programmers than the framework specific devs, and their solutions will be easier to reuse if you ever move to another framework.

Backbone, a product of its time
-------------------------------

![](http://pics1.pof.com/dating/1128/49/24/4ad33bfe6-c89e-4088-af5c-bc7162a4e1d6.2.jpg)

Backbone did introduce a lot of important concepts to the JS community.  Things that seemed radical at the time are now second nature.
We all use some deviation of Lodash/Underscore/Ramda.  We all know Single Page Applications are superior to server side rendering.
"Web apps" as a term is no longer something people scoff at.

We know MVC is important (even if Backbone's interpretation was a little heavy handed), and most of us have moved on from using JQuery altogether.

Yes, underscore templates were the wrong approach, but they share a lot in common with something like JSX or hyperscript.  Perhaps client side templates paved the way for virtual dom.  Who knows.  [I experimented with JS templating 2 years ago](https://github.com/JAForbes/temple) because of ideas sparked by working with Backbone.  It's funny how similar those experiments look to hyperscript today.

We also all agree RESTful API's are better than remote method calls or arbitrarily named endpoints with custom semantics.

Ultimately, Backbone's legacy was always going to be philosophical: "If you want to get something done, get in the code and fix it yourself".  "Instead of skilling up as an Angular developer, or a React developer, become a better JS developer.  Read the source code, adapt it to your needs".

Often though customizing Backbone meant creating your own fork and patching methods.  And then when you had to update Backbone, somehow patch it without breaking your app.  Not pretty.

Just because Backbone's inheritance and event model did not support it's own philosophies, does not make the sentiment any less worthy.

Turns out mithril encourages similar practices, and these practices are in harmony with mithril's utility oriented design.
Mithril developers tend to see it is as more of a library than a framework, a utility belt for building applications without being prescriptive.  You can opt out of any aspect of mithril, it's routing, props, whatever.  And you never need to look at mithril's source code to achieve this.  Just use your own functions, it is that simple.

By walking through the differences in design, we've walked through a little bit of Javascript history.  From the wild west of JQuery, to fast, declarative, functional mithril.

I wonder what comes next?
