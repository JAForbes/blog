How I use Mithril
=================

*A series of patterns that have naturally emerged*

Mithril is a tiny library for writing interactive web applications.
It's so small it may seem difficult to know where to start.

I've previously written about [`m.prop`](?/posts/power-of-m-prop) and how cleanly
it solves a lot of common problems I've experienced in other frameworks like Backbone.

In this post I'd like to cover how I structure components and share data throughout the app.

Never use `this`
----------------

This isn't just for javascript hipster reasons.  Using `this` introduces bugs,
data hiding issues, verbosity, and encourages the use of methods instead of functions.

Simply by using the revealing module pattern, we can see the majority of our app as
data processing and reuse functions across components.

Some people may see the revealing module pattern as a hack because they are used to thinking
of constructors and classes - but all a constructor is meant to do is return a state object,
so we are actually making it more explicit.

```js
//traditional mithril revealing module approach
var component = {
  controller: function(){
    var count = m.prop(0)
   
    return { count }
  }
  
  view: function(state){
    return m('div', [
      m('input[type=number]', { onchange: state.count })
      ,m('p', 'The number is: '+ state.count() )
    ])
  }
}
```

Closure components
------------------


Flyd Streams everywhere 
-----------------------

Flyd is a tiny library.  It lets you pass values to subscribers and set a new value at any time.
It plays well with mithril because it's API is almost identical to `m.prop`.

It comes in handy in so many ways.  Let's take a look!

Opt out of Mithril when appropriate
-----------------------------------

Mithril makes it astonishingly convenient to jump in and out of virtual dom and direct dom.
So if you *need* to just get in there and play with the dom directly, it's straightforward.


Avoid Model Layer
-----------------

Models are closely coupled to views.  The sooner we admit this, the more trouble we save.
So let's define them in the same file, and in most cases, lets just define them within in the controller.
