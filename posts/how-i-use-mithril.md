How I use Mithril
=================

*A series of patterns that have naturally emerged*

Mithril is a tiny library for writing interactive web applications.
It's so small it may seem difficult to know where to start.

I've previously written about [`m.prop`](?/posts/power-of-m-prop) and how cleanly
it solves a lot of common problems I've experienced in other frameworks like Backbone.

In this post I'd like to cover how I structure components and share data throughout the app.

Mithril gives us a lot of flexibility when defining components.  I don't write components using the traditional Mithril API.
The code examples will not be indicative of my usage, until the end of the post.  
I am going to gradually introduce my approach so we can stay focused on each layer.

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
var Example = {
  controller: function(){
    var count = m.prop(0)
    var checked = m.prop(false)
    
    return { count, checked }
  }
  
  view: function(state){
    return m('div', [
      m('input[type=number]', { 
        onchange: m.withAttr('value', state.count) 
      })
      ,m('p', 'The number is: '+ state.count() )
      ,m('input[type=checkbox]', { 
        checked: state.checked() 
        , onchange: m.withAttr('checked', state.checked) 
      })
    ])
  }
}
```

> When I started with mithril I had separate namespaces for the model and the view-model.
I don't do that anymore.  Dividing our data into separate namespaces for its origin and intent is noise.
And often the line between view state and model state can blur over time.
Though, I do think the concept of a view model is valuable.

Closure components
------------------

The traditional mithril component API is a struct with a
`controller` constructor function, and a `view` function
that accepts the `controller` as its first argument.

I think this is a great low level API, it is flexible and it allows
for a variety of component patterns to work and still feel native.

I write my component as a function that returns a view function.
All the model state lives within the closure.

This isn't just because closures are cool, and `this` is lame.
It's because decoupling the `view` from the `controller` is only useful
if you reuse base views across components.  But in practice, that doesn't happen often.

Using a closure also reduces library specific machinery.  I don't need to rely on the somewhat
magical behaviour that mithril passes the controller instance to the view function.
I can just reach the state directly using standard javascript practice.

You'll notice our view also no longer needs to prefix each prop with `state`.
So the view itself is a lot less ceremonial.

```js
function Example(){

  var count = m.prop(0)
  var checked = m.prop(false)

  return function view(){
    return m('div', [
      m('input[type=number]', { 
        onchange: m.withAttr('value', count) 
      })
      ,m('p', 'The number is: '+ count() )
      ,m('input[type=checkbox]', { 
        checked: checked() 
        , onchange: m.withAttr('checked', checked) 
      })
    ])
  }
}
```

Of course, if this Component doesn't obey the traditional mithril API, how do we mount it, or render it?

A simple utility.

```js
function component(f){
   return { controller: f, view: function(view){ return view() } }
}
```

We can then plugin to the normal mithril machinery.  
Here I'm injecting our component into a parent component in 3 different ways.

```js

function ParentComponent(){
  
  var example = Example()
  
  return function(){
    return m('div', 
      
      // { controller: Example, view: function(view){ return view() } }
      component(Example)
      
      // view()
      ,example()
      
      // Allow passing in parameterized data
      ,m.component(component(Example), { data: [1,2,3] })
    )
  }
}
```

The above just shows what's possible.  I tend to export the traditional API as a module.
And then other devs do not need to know that I used a closure component behind the scenes.

```js
//file: components/example.js
export default component(Example)
```

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
