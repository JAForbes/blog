From Backbone to Mithril
========================

When I first started eyeing off mithril, I found it hard to imagine adpating my existing knowledge of JS app development 
to this new framework.  There is a great article [Leo Horie](github.com/lhorie) wrote comparing 
[mithril to other major JS Frameworks](http://lhorie.github.io/mithril/comparison.html) but it was written as if the reader had
already bought into mithril's philosophies.

The framework I had the most experience with before trying mithril, was Backbone.  So instead of saying why Mithril is better
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

Backbone provided methods like `sync` `save` `fetch`, that would automatically construct the relevant XHR query based on
metadata stored on Collection.

It became quite common to want to modify or manipulate the request or response though.  Backbone provided events that we could
hook into and perform modifications.  Backbone even recommended overriding sync either at the Collection level or at the global
level.  In the end, one often wondered were we hacking against Backbone in the right way, or the wrong way?
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
You provide a hash of url's with pattern matching for variables within in that URL.  The first pattern that matches will trigger
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

I'm sure the Backbone team thought of this, and I'm sure the reason they didn't go with it because of [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns).  Backbone was trying to bring the Model View Controller architecture
from the server to the client.  This was a pretty controversial stance at the time.  The Backbone team, wisely, did not deviate much from the patterns used on the server side.  One of the core tenets of MVC advocates is, separation of business logic and state from
the view layer.  The view should not know manage state, it should only represent it.

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
  
  initialize: function(){
    
    this.render() //Render Loading
    
    this.load()
      // Render server data
      .then( this.render )
   
  },
  
  load: function(){
    return fetch('api.facebook.com/newsfeed')
      .then( r => r.json() )
      .then( r => this.news = r )
  }
  
  render: function(){
    this.el.innerHTML = 
      news.length 
      ? 'Loading ...' 
      : news.map(
          n => '<div class="news-content">'+ news.content + '</div>'
        )
        .join('')
  }
})
```

The above Router is completely made up, it is an illustration of how much simpler Routing can be if we just accept that the View
knows what data it needs and when.

In the View, I've fetched the data we needed and rendered twice.  The first time we just tell the user we are loading,
the second time we map over the response and create HTML from the data.

The way I've written the render function is not very idiomatic Backbone.  I could very well be replacing part of the view
that do not need to be replaced.  But it is a lot easier to see the way the view will render by simply returning a new dom every time.

It would be nice if there was a system that could automatically only apply the changes efficiently...


