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

However, I write my component as a function that returns a view function.
All the model state lives within the closure.

This isn't just because closures are cool, and `this` is lame.
It's because decoupling the `view` from the `controller` is only useful
if you reuse base views across components.  But in practice, that doesn't happen often.

Using a closure also reduces library specific machinery.  I don't need to rely on the somewhat
magical behaviour that mithril passes the controller instance to the view function.
I can just reach the state directly using a standard javascript lanaguage behaviour.

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

// es6
export default component(Example)

// commonjs

module.exports = component(Example)
```

Flyd Streams everywhere 
-----------------------

Flyd is a tiny library.  It lets you pass values to subscribers and set a new value at any time.
It goes with mithril like Peanut Butter and Jam - it's API is almost identical to `m.prop`.

#### A quick introduction to flyd

In flyd we get and set and values the same way that we use props.

```js
var a = stream(0)
a() //=> 0
a(1) 
a() //=> 1
```

But we can also subscribe to changes.  And create dependent streams using `map`

```js
var a = stream(0)
var b = a.map(multiply(2))

a(2)
b() //=> 4
```

It comes in handy in so many ways.  Let's take a look!


#### Replace prop's with streams.

*Everything still works*

```js
var f = require('flyd')

function Example(){

  var count = f.stream(0)
  var checked = f.stream(false)

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

Not very exciting, but worth stating.

#### Subviews

Below we subscribe to changes to our state streams (`count` and `checked`).  
We then declare view streams that will be regenerated whenever the state changes.

We are creating streams based on the value of our prop's.
They will always be up to date.  And when we execute our sub streams as functions,
we are not rerunning the view itself, it is cached.

It's a shame mithril doesn't know about this caching, so it will still do a diff 
against the DOM.  But for complex view calculations, you can ensure, you are only
generating that vdom when you need to.

It would also be quite simple to return `{ subtree: retain}` on subsequent calls to a stream.
Might be a nice experiment to try.

```js

var f = require('flyd')

function Example(){

  var count = f.stream(0)
  var checked = f.stream(false)

  var p = count.map(function(n){
    return m('p', 'The number is: '+ count)
  })
  
  var numberInput = count.map(function(n){
    return m('input[type=number]', { 
      onchange: m.withAttr('value', count)
      value: n
    })
  })
  
  var checkbox = checked.map(function(value){
    m('input[type=checkbox]', { 
      checked: value
      , onchange: m.withAttr('checked', checked) 
    })
  })

  var view = f.combine(function(){
    return m('div', [
      numberInput()
      ,p()
      ,checkbox()
    ])
  }, [ checkbox, numberInput, p])

  return view
}
```

In the above example, I probably wouldn't define those particular subviews as streams.
There is no real benefit.  But it is nice that our component is a declarative depedency tree.
It's simple to see what state triggers changes to a particular view.

But I do use this for complex situations like occlusion culling, where you need to calculate how many items
are on screen and their respective positions.  It's nice to know that calculcation is only happening when 
a dependency triggers it, and not on every redraw.

#### Cross component communication

```js
function SidebarManager(){

  var hidden = f.stream(false)
  var offset = hidden.map(function(hidden){
    return hidden ? 40 : 400
  })
  
  var sidebar = Sidebar({ hidden, offset })
  var content = ContentPane({ offset })
  
  return function(){
    return m('div', [
      sidebar()
      world.content()
    ])
  }
}

function Sidebar(world){
  var style = world.offset.map(function(x){
    return {
      left: -440+'px'
      transform: 'translateX('+x+'px)'
    }
  })
  
  var view = style.map(function(style){
    return m('div', { style },  ...)
  })
  
  return view
}

function ContentPane(world){
  var style = world.offset.map(function(x){
    return {
      transform: 'translateX('+x+'px)'
    }
  })
  
  var view = style.map(function(){
    return m('div', { style }, ... )
  })
  
  return view
}
```



Opt out of Mithril when appropriate
-----------------------------------

Mithril makes it astonishingly convenient to jump in and out of virtual dom and direct dom.
So if you *need* to just get in there and play with the dom directly, it's straightforward.

There is no shame in this!  If you want to `getComputedStyle` or access `parentNode` then all power to you.

In mithril it's as simple as using the `config` function.

```js
m('div', { config: 
  function(el, firstTime, context){
    if(firstTime){
      el.parentNode.style.backgroundColor = 'red'
    } else {
      //subsequent calls
    }
  } 
})
```

When I first saw that API, it scared me.  Often I just want access to element.

In plain old mithril, we could just use a prop as the config function, and because the `el` is the first argument, we'll store the element in the prop.

```js
//controller
var container = m.prop()

//view
m('div', { config: container })
```

And with flyd, we can actually do some work when that container arrives.

```js
var container = f.stream()

var computedStyle = container.map(getComputedStyle)

// log the computed style every redraw
computedStyle.map(
  console.log.bind(console, 'computedStyle: ')
)

//view
m('div', config: container)
```


Avoid Model Layer
-----------------

Models are closely coupled to views.  The sooner we admit this, the more trouble we save.
So let's define them in the same file, and in most cases, lets just define them within in the controller.
