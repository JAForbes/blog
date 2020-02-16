Hooks and Streams
=================

[Dan Abramov](https://twitter.com/dan_abramov) wrote an excellent post on his [blog](https://overreacted.io) about making a declarative `setInterval`using React Hooks.

Check it out [here](https://overreacted.io/making-setinterval-declarative-with-react-hooks/). It's a great read.

I think Hooks are really cool, especially from a technical perspective.  But they are also a leaky abstration?  If you know [the rules of hooks](https://reactjs.org/docs/hooks-rules.html) and understand why they exist you'll likely be fine, but I hope to convince you there's a better solution to the same underlying problems.

Hooks received a lot of criticism when first announced, and I didn't want to weigh in on that initial deluge because I think a lot of it was unjustified.  But now that the dust has settled and most people think Hooks are a good idea I want to explain an alternative approach with all the same advantages and none of the [caveats](https://reactjs.org/docs/hooks-rules.html), but with only 1 requirement you need to learn about streams.

Hooks usage is beholden to a set of [rules](https://reactjs.org/docs/hooks-rules.html) because it's ultimately a very clever illusion.  Hooks make it seem like your accessing persistent state within a function call - but that's not really possible without some other background mechanics.  In React's case, they infer which state belongs to which function call by counting invocations.  It's more nuanced and complicated than that, but ultimately it's still inferance.

Before explaining the alternative, let's imagine why you'd need or want this behaviour?  Because it turns out to be super useful.

#### A short history revision

Within the context of React, components were originally modelled after classes.  You'd create a class via `React.createClass`, because each rendered component was the instance of a class, it had state.  You could control this local component state via `this.setState(newState)`. Having local component state allowed you to keep track of input values, validation, anything you wanted.  This paradigm wasn't new at the time, but it wasn't exactly commonplace either.  The React team began evangelizing component-oriented design as "Thinking in React".

After React exploded onto the scene, a lot of other frameworks were born, inspired by React's component oriented design.  But it didn't take long for this pattern to show its limitations on actual projects:  Having state inside components made it difficult for two components to share information reliably. It was seen as bad practice to let another component directly modify another components state, and so the alternative solution was callback-passing: The parent component would pass a function to the child component which would allow the child component to signal to the parent component that the state should be updated to a new value.

For any non trivial app, there ends up being a lot of cross-component communication.  In the past, the common solution was relying on events, but we'd collectively learnt that wasn't a good general solution either: Event oriented UI architectures very quickly led to the same problems as allowing another component to mutate your state; it was very difficult to debug why a change occurred and what ultimately triggered it.

So passing callbacks didn't scale, using events was out of the question (though some did try).  Amongst this chaos, several projects in the functional programming community were working on their own solutions and advocating for their own alternatives.  Probably the most influential was the Elm Architecture, which popularised the idea of stateless views, with a state model that folded a scan of streams into a new state.

This pattern ended up becoming incorporated by Dan Abramov into the React ecosystem as [Redux](https://redux.js.org/introduction/getting-started).

Redux allowed large teams to use React without relying on unscalable component callbacks or event architectures.  Because Redux applications were unidirectional (state only travels down, actions only travel up) there wasn't much need for component state anymore.  But Redux introduced 2 new problems.  

Firstly, it was extremely verbose.  Redux was an interpretation of an FP pattern that relies heavily on union types and pattern matching, which was translated to JS via sprawling switch statements.  Several libraries tried to solve this by generating every possible aspect of Redux from a smaller DSL (without going back to the source to find out this problem was already solved via union types).  This wasn't anyone's fault mind you - the JS community wasn't ready for sum types back then (I think it will still be a while before they're mainstream in JS - maybe after [`match`](https://github.com/tc39/proposal-pattern-matching) lands).

The other problem with Redux was performance.  Dispatching an action meant the central store would need to be recalculated and then a new state patch would be passed down to every component.  This spawned a bunch of new patterns, like prop memoization and granular redraws of subtrees.  But now we're diffing not just the virtual dom but also the props, and diffing props naively could lead to more issues as reference equality won't detect mutations.

On and on the story goes.  From here we see solutions like Immutable.JS which was greatly inspired by Clojure's persistent data structures.  The promise was you could efficeintly detect if a change had occurred by relying on reference equality by never mutating state and instead patching only the segments that had changed.

If we zoom out for a moment we can see a general arc.  We need to react to changes in state (so the UI is updated), but we don't want to react to changes that aren't relevant (so the UI isn't slow).  Ultimately event architectures, component callbacks, prop diffing, redux actions, it's all attempting to solve the same problem.

But all these solutions rely on inference.  We try to infer what changed by comparing the previous value to the new value.  And that approach has its limits.

There's a data structure that does exactly what we need, without relying on inference - it's called a stream.

#### A brief aside: Pure Functional Components

Unfortunately, even with a mastery of streams, React's high level API means that we still end up depending on classes or hooks.

The value proposition of hooks is effectively the same as having a closure - so why not just have a closure?

Because a closure is a function that returns a function, and in React functions are components:

```js
function Hello({ name }){
  return <p>Hello {name}</p>
}
```

We can't return a function because when React sees a function in a call to `React.createElement` it assumes the result of calling the function will be JSX. It needs to execute that function every time it encounters it.

If instead the design were like this, we could have intermediate state in a component without relying on hooks/classes/redux etc.

```js
// What if components were functions
// that returned a view function?
function Hello({ name }){
  return () => <p>Hello {name}</p>
}
```

`() =>` is all React would have needed to have component state within a function without hooks or classes.  Let's imagine for a moment how much simpler state manangement would have been if React had closure components:

```js
function Counter({ name }){
  let count = 0
  return () => <>
    <p>Count {count}</p>
    <button onClick{ () => count++ }>Increment</button>
    <button onClick{ () => count-- }>Increment</button>
  </>
}
```

But uh-oh - another problem - React would not render after that `onClick` fired.  React only renders a component when it detects the state has changed, but we're not giving React an opportunity to know `count` changes.  [Not all frameworks have this restriction](https://mithril.js.org/autoredraw.html#the-auto-redraw-system).  So let's assume instead, that all event listeners interally call `setState({})` in the backing component instance when a JSX bound event is fired.

> 💡 If that seems wasteful, think why would you ever bind an event listener if not to update some state that would immediately need to be rendered? Exactly.

Adding this feature negates a lot of the needs for Hooks and in my mind justifies a semver major version change to React. 

Beyond `useState` hooks are advertised as a way to compose effects.  And this is where we finally get to streams: Streams are a composeable, customizable, time-independent data structure that does everything hooks do and more - without the compromise.

#### A declarative `useInterval`

I'm going to walk through writing a declarative `setInterval` just like Dan's hooks example.  But my version will be using streams for effect composition and data sharing.  Central to the entire exercise is closure components - which React doesn't have (but should!).  I'm going to assume you've read Dan's blog as we'll be bouncing off his work as prior art.

Because of the aforementioned caveats, I'm going to use Mithril - which is very similar to React but allows closure components, and automatically renders after event callbacks fire.

But don't worry, before we starting we'll do a quick introduction / refresher to Mithril, Closure Components and Mithril Streams.

#### Refresher / Introduction

In Mithril, we have a concept of a `vnode`.  It's a well-documented structure that represents the virtual dom node - it's literally the data representation of a component or a hyperscript expression.  A `vnode` might look like this:

```js
// vnode = virtual dom node
{ tag: 'input'
, oninput: [Function]
, value: 'hello'
, attrs: { style: { color: 'red'}, disabled: true }
, oncreate: [Function]
, onupdate: [Function]
, onremove: [Function]
, dom: [HTMLInputElement] // appears after first render
}
```

The above is the resulting data structure from an expression like this:

```js
m('input[disabled]', 
  { style: { color: 'red' }
  , oncreate
  , oupdate
  , onremove
  , oninput 
})
```

Or in JSX this:

```jsx
<input 
  disabled 
  style={{ color: 'red' }}
  oncreate={oncreate}
  onupdate={onupdate}
  onremove={onremove}
  oninput={oninput}
/>
```

You'll notice the vnode has lifecycle methods right there in the view. This is a hugely useful feature, it means we can respond to the changes in an individual dom node without defining a component.

Components have a very similar data representation and one form of component is a function that returns some lifecycle methods. The simplest may look like this:

```js
function MyComponent({ attrs }){
  return {
    view: () => m('p', 'hello '+attrs.name)
  }
}

// mounted like so:
m(MyComponent, { name: 'Mithril' })

// or like so
<MyComponent name="mithril" />
```

The above is called a Closure Component.  There are other forms of component in Mithril, but this is my favourite: it's idiomatic to reach for a Closure Component whenever you need state (instead of a class).

A really clever aspect of Mithril is that the `vnode` is passed in to _every_ lifecycle method - So if you need access to your own component representation - to do something really fancy - it's always available:

```js
function MyComponent(vnode){
  console.log(vnode) // { attrs, children, tag, view, ...etc }
  return {
    view: vnode => m('p', 'hello ' + vnode.attrs.name),
    oncreate: vnode => {},
    onupdate: vnode => {},
    onbeforeremove: vnode => {},
    onremove: vnode => {}
  }
}
```

So we don't need `ref`s to access the dom: the dom node is on `vnode.dom`. This component API design means the framework rarely gets in the way when you need to convert some non-declarative side-effectful work into a declarative component interface.  Mithril is very transparent and extensible.

#### Streams

Mithril has a stream module importable as `import('mithril/stream')` it's a very lightweight reactive data store. This is the API.

```js
import stream from 'mithril/stream'

// 0 is our initial value
const count = stream(0) 

// respond to changes
const double = count.map( x => x * 2 )

count() // read last value
// => 0

count(2) // write new value
count() //read new value
// => 2
double() // read inferred value
// => 4
```

Spend a minute or two internalizing that.  We can get and set a value, and we can create new streams that respond to values changing.

You can also finalize a stream which will end the current stream and any dependencies.  This is really helpful for clean up:

```js

// Every stream has a .end stream.  
// You can be notified when a stream ends
// by mapping over it, just like any other
// stream
count.end.map(
  () => console.log('Stop counting')
)

// To end a stream, pass `true` to the end stream.

count.end(true)
// logs: Stop Counting

// Now that our stream is ended
// `double` will not update

double()
// => 4

count(100)

double()
// => 4
```

Turns out streams are super useful for sending messages and sharing data across component boundaries.  They solve the same problems as React Hooks, React Context, prop callbacks, Redux and... well really a lot.

#### `useInterval`

When Dan writes about making `useInterval` declarative, we can now see how we'd do something very similar using component lifecycle hooks, closures and streams.

First I'm going to define it using just the stream primitives you've learned so far: get `stream()`, set `stream(newVal)` and map `stream.map(x => f(x))`.

Here's a complete example - you check out the live version and then we'll break it down step by step.

```js
const stream = m.stream

function useInterval({delay}){
  const id = stream()
  const tick = stream()
  
  delay.map(
    delay => {
      clearInterval(id())
      id(setInterval(tick, delay, delay))
    }
  )
  
  delay.end.map(
    () => clearInterval(id())  
  )
  
  return tick
}

function App(){
  const delay = stream(250)
  const count = stream(0)
  
  const tick = useInterval({ delay })
  
  tick.map(() => count( count() + 1 ))
      
  count.map(m.redraw)
      
  return {
    onremove: () => delay.end(true),
    view: () => {
      return [
        m('p', 'Count: ' + count() )
        ,m('label'
          ,'Delay: '
          ,m('input', {
            type: 'number'
            ,value: delay()
            ,oninput: e => delay(e.target.value)
          })
        )
      ]
    }
  }
}

m.mount(document.body, App)
```

[Live Example](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4hcYgAIJAJxjZJAXklZ8s+VgA6abWACuaasQj1JAVTgwAksJkA3DFAAUwSRmLEZcSawCUwbUlJQMlxKQgAEyVpTw0nXxCQ9084fAiYKAwAT3wsDAAHJxCg9MyspQA+SUinS2IbRntHJ2SvfHoAFQhqAGsKSVLs3wS0IJGgkLliPRlRgNGgyTsIGAB3REl4ysk0PSgoCmLJejksWjsYDa3FKupYDBkGmCbnaoit8Z9tVm1dAyMTKMAIL5Qr+EJhAYZbLRVTqbBOACMAAZUZ9IXQDFJlHDYgjkZ8IbQsbkCk5VHIIjIMKtCQspjM5kdlmsrr5tsgjkcggB6HmSACyxIYxxmULuD3cEAu1VsDigoVoWHy9BE3MkfMk+QwcG8EFGxJkULKMTkCgwaCiGFCjigACMML11VgnBZrHLHP15osfcbsocFr6Nfy9PkIu4YKKjZiRfCsMdRjALjJysYnYHfZ1uj02dsY8QnIqsVsANSSRGST4+vzq9WagBKTHSRsNRZFxFokmIhEjcGociY6v6LoA5PkR-0RwBhYXEDYjyRl-MfI4AXRCPzQm+0qjOxYitGoehwDHwdtoESy-RB+V8lBAllgAPoCB4ADZEAAmNgcECYHB4Pg1C6veQiMMwPBsKuVBQPqPSvqgf5cHgWAQN2MjQPeMzkDwJDEPkcCIHyBj5D0ADmQFKjyqHodAAACiL4Ixb7UWhhAYVA+D8PexBZPk3APv2ED5KI7CcABPA0ex0AALRxlhMg4SAeEEURPIkeRlFYKxtFQHJeJYHRn74MiJk8nGXECCAvH8XgfYYSJUGsEAA)

---

The first thing we'll look at is the function `useInterval`.  It's just a function that takes a stream as input and returns a stream as output.  There's no tricks or caveats, it's that simple.

```js
function useInterval({
  // delay is a stream that holds
  // the current delay `useInterval` should use
  // in the call to `setInterval`
  delay
}){
  // `setInterval` returns an identifier that can be used
  // in a call to `clearInterval`
  // we store it in a stream so we can know when it changes
  const id = stream()
  
  // This is the stream we'll return to the caller
  // they can map over it or compose it with other streams
  const tick = stream()
  
  // Whenever the delay changes
  // delay.map will fire.
  // we can then clear the old interval
  // and bind a new interval
  delay.map(
    delay => {
      // get the current id()
      // and pass it to clearInterval to remove the old
      // setInterval
      clearInterval(id())
      
      // Bind a new setInterval that will
      // call our tick stream every [delay]ms
      // The third arg passes the delay into the tick stream
      id(setInterval(tick, delay, delay))
    }
  )
  
  // When the delay stream is cleaned up
  // we'll clear the interval too
  // This will probably happen when the caller
  // component unmounts
  delay.end.map(
    () => clearInterval(id())  
  )
  
  // Pass the tick stream to the caller
  // so they can know when the setInterval fired
  return tick
}
```

A function that takes a stream as input and returns a new stream has a fancy name: a combinator.  Because we're combining streams together to form a new stream.  You can probably imagine writing your own combinators in the same way you write hooks.  But the difference is we're not relying on an ambient global state tracker that is tied to a framework, we're just using a very simple data structure that can be used anywhere, in any framework, in any context.

Next we'll look at the usage code in `App`.

```js
// This stream stores the current value
// of our delay.
// We can get the current value like so
//
//    delay()
//    250
//
const delay = stream(250)

// This stream will keep track of
// the counter that we will increment
// when the delay fires.
// It doesn't need to be a stream
// but because it is, we can be notified
// when the count changes which is nice for debugging
const count = stream(0)
  
// This is where we create our tick stream
const tick = useInterval({ delay })
  
// now we can map over it, and respond to changes
// anytime tick emits, we'll update the count value
tick.map(() => count( count() + 1 ))
      
// And when the count changes, we can render
// so the view updates
count.map(m.redraw)   
```

Note all our 'model layer' stuff sits in the closure: it is logically grouped.  In the view we can access these streams directly and read and write to them.  We can also share them with other components, which sidesteps all the problems from the History Revision section elegantly.

Now for the view code:

```js
return [
  // This is a paragraph tag that renders the current count.
  m('p', 'Count: ' + count() )
  
  // This is a number input that allows us to edit the delay.
  , m('label'
    ,'Delay: '
    ,m('input', {
      type: 'number'
      // When the view renders we read the current delay
      // if it changes, mithril will patch the DOM
      // if it doesn't, it won't.
      ,value: delay() 
      // When the user changes the number, we pass it to 
      // the `delay` stream.
      // The `delay` stream is passed to the `useInterval`
      // function, which will update the `setInterval`
      // and in turn update our `count`.
      ,oninput: e => delay(e.target.value)
    })
  )
]
```

Note our view layer is completely decoupled from `useInterval` - it doesn't know it exists, it doesn't need to - we simply read the outputs and write to the inputs.

This is a great aspect of streams: you can define relationships in an external context but share the inputs and outputs with other contexts.  To prove this, let's make our delay input, our count paragraph and our interval model logic different functions.

```js
// Not a component, just a function
// that takes a stream as input and returns
// some virtual dom
const input = ({ delay }) => 
  m('input', {
      type: 'number'
      ,value: delay()
      ,oninput: e => delay(e.target.value)
  })
  
// Again, just a function
// that takes a stream as input and returns
// some virtual dom
const paragraph = ({ count }) => 
  m('p', 'Count: ' + count() )
  
// Also a function
// but this returns some streams
const model = () => {
  const delay = m.stream(250)
  const count = m.stream(0)
  
  const tick = useInterval({ delay })
  
  tick.map(() => count( count() + 1 ))
      
  count.map(m.redraw)

  return { count, delay }
}

const App = () => {
  const { delay, count } = model()
  
  return {
    onremove: () => delay.end(true)
    , view: () => [
      paragraph({ count })
      , m('label', 'Delay: ', input({ delay }) )
    ]
  }
}
```

[Live Example](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4hcYgAIJAJxjZJAXklZ8s+VgA6abdrABXNNWIR6k-XBgBJYTIBuGKAApgAExhQMAT1YBKYNqSkoGS4lIQrkrSxHLYTr4hYZIm1ADWUepxCWhBIe6eXvhYGAAOTiFB+d5KAHySATlBTdSwGDI2jPaOThHx2U1NvZbEHTBdzimpFJJVXtOzvv1NrCFLeR7e+EyuRaXljUHxtaGt7bYOzr2LuY1rjXLE+jI5k9orOmgA9J+SAHK0UgwoVoWBK9BE014FkBkgMRhM9G032ShAwUmIGFS8EkQMyWBxcEkEDQJX0gLQkQeTzQcCRPzgIJgkjsEBkj0cMxB2iSxNJUmULhmGy8kj8xxCWCcAHJeWSpdMGgMgsQvCUYIhJFK0PosAAjMZSipNCgXfTqoUFeJGoIUeiy4gapmKOqzJwwfAYmQAcxgxHwppgSz8ITpkgAgl6MMTIdCcbDDMZTB9kcRUejMdjcTENASiSSyTiKZIqc9aV96Yzmaz2VBOVojPQJJISm0MF6ZKVCFFBXRDFIxc7go1JVKSvLNQBhWh9jVSyQAamBfaOd2RYagDPwW7jcMTiPLkl1BdTEEJJZp0kreLLSSwtHy3d8x0VwJpUlmUVUeKcACYAKwAAxLEkvYMJ+ajZnEQEho0SSTFEFjWOc3TABa1TBo0ISTLsZRHIOoHEE4S4MEci4AIySIs1pDkEBE4U4qhyK4HYAO5LOe9TEcQ8zCqKby6A2b7hiUJSPs+iSNlIqGzNMBGip+94eFamH3L61L1Ea9ByHedjmnhLrClsFJODEZpLDaVYwCxGr6ZIyDUS2Hbtp2PbTmBGFKpI0wjp4+pQPKUoACLCrOFD2oKH5iuZkgALohO87zaKod7Lq4tDUDqIj4Lq95zMJJS+JQNAgiU0BjHguoYH5RWWLAe40ngP5kYgAFsBwICYDgeD4NQcACMVwjMDwbAxVQUDEqkCAoJwXU8FgECpjI0BFU85A8CQxAlHAiDfIYJSpF6PUgp882LdAAACZH4FdABsJ0LYQS1QPg-BFSqap4HA1BLSUojsDN3AgKdj3QAAtHiK0yGtIAbVtO2fHtB1HVg91nVA4OQVg50-vgAG458eIvf172A19P1-TFrBAA)

---

#### Combinators Compose

Recall that `useInterval` is a stream combinator: It takes streams as input and returns streams as output.  Well `model` is a combinator too.  It's just a combinator that ignores (or takes no) input.

And so we've got a combinator being used to define the logic for another combinator.  That composition can repeat indefinitely.  You can refactor, share and combine stream behaviour as effortlessly as passing a stream to a function that returns new streams.

#### `ref`s & `useEffect`

Here's an excerpt from Dan's blog (seriously go read it) about impedance mismatch between the imperative `setInterval` model and the declarative React model.

> A React component may be mounted for a while and go through many different states, but its render result describes all of them at once.
> ```js
>  // Describes every render
>  return <h1>{count}</h1>
> ```
>
> Hooks let us apply the same declarative approach to effects:
>
>  ```js // Describes every interval state
>  useInterval(() => {
>    setCount(count + 1);
>  }, isRunning ? delay : null);
> ```
>
> We don’t set the interval, but specify whether it is set and with what delay. Our Hook makes it happen. A continuous process is described in discrete terms.
>
> By contrast, setInterval does not describe a process in time — once you set the interval, you can’t change anything about it > except clearing it.
>
> That’s the mismatch between the React model and the setInterval API.

What Dan is describing is what in FP we call: a functor.

A Functor is defined with [two laws](https://github.com/fantasyland/fantasy-land#functor) - I'll leave that for [another post](https://james-forbes.com/#!/posts/the-perfect-api), but a solid intution on functors is: an interface to some state that isn't directly accessed, but can be transformed into a new functor by mapping over the state.

We can map over streams, we can map over lists, we can map over ... a lot of things.  But we don't tend to think of React components as something we map over.  But here's Dan again...

> A React component may be mounted for a while and go through many different states, but its render result describes all of them at once.

The exact same thing is true of mapping over a stream:

```
const count = m.stream()

count.map(
  // This function describes all future states
  x => <p>Count {x} </p>
)
```

So are components equivalent to streams?  Not quite, components are a specialization for a particular domain.  They have callbacks and interfaces that are designed specifically for building UI and interacting with the browser's DOM.  But conceptually?  Yep!

- Components have initialization semantics (`scan`).
- Components can retain local state (`stream()`)
- Components state can be transformed into new representations via render (`stream.map(...)`)
- Components can perform logic on teardown (`stream.end.map(...)`)

#### A final goal

Dan's example stops the counter if the value of `delay` is `null`.  The logical change here is almost equivalent but it's a fun stretch goal so let's make the change.

```js

function useInterval({ delay }){
  const id = stream()
  const tick = stream()
  
  delay.map(
    delay => {
      clearInterval(id())
      // Only bind setInterval if delay is null
      if( delay !== null ) {
        id(setInterval(tick, delay, delay))
      }
    }
  )
  
  delay.end.map(
    () => clearInterval(id())  
  )
  
  return tick
}
```

And then let's change the `delay` stream we pass in to be null if some other `running` stream is `false`.

```js
const theirDelay = 
  m.stream.merge([delay, running]).map(
    ([delay, running]) => running ? delay : null
  )

const tick = useInterval({ delay: theirDelay })
```

`stream.merge` just takes a list of streams and gives us a new stream which is a list of values.  The new stream emits when any of the input streams change.

[Live Example](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4hcYgAIJAJxjZJAXklZ8s+VgA6abdrABXNNWIR6k-XBgBJYTIBuGKAApgkgCYwoGAJ6TWASmBtSUlgyXEpCDclaWI5bCd-MIjJE2oAaxj1BKS0ELCPL298LAwABycwkMKfJQA+SSC8kJbqWAwZG0Z7RycoxNyWlogwJ3dPWoBCRWU0fSgoSX9GqqHJfstiLpge5zT0inGiw5rvf0G11lWr5ouCieKmNxLyyuaQxPrw9s7bB2d+ud8rcwmE5MR9DI8vttDdtAB6eGSABytCkGHCtCwZXoIkOvAs6MkBiMJnoCKRxEIGCkxAw6Xgkgx2SwTLg6zQZX06LQ0XBkLQcAp0ixMEkdggMghjncWO0KQgnO5MRcR1qAS+YSwTgA5IqucQdYcmmtUt4yjBEJIdXMsAAjHY61YhCj-fSWtXeRLOyQUej67lWsWKBqnJwwfB0mQAcxgxHwbpgFwCoLQiMkAEFoxhFfjCUziYZjKYdGnKdTafTGcy4ho2RyDUzeZJ+VChWWRThxZLpYs3HKjPQJJIyh0MNGZOVCCrXHRDFINSHQs1tTqykbrQBhWjzq06yQAakx88+dw7GagcFo+BvBZJxfJHbtyqpEHZrcFnbFLPbKSwtEKFVliXE1MUFKRThiVQWScAAmABWAAGC4UjnBgoLUWsEmQ5IhykGRDDQRVowwmC4ndM8QhSKkYElAARB4YlWaCsNUHAYxgJxkFOQ4CLQIi0GjABdfwXgqH0uJ4ltCOIkSvj4gSSIAfk9SQrTmBZVlyXDwNSCAMhiCxrD+XpXFOK0aPoxiU2aMJ9jEpxPiXNDiDGFzPiPABGJYLiGXD5wc1Q5DcScAHcLg-RpjwYE4Hl4mTBL8WFdEHXSMzKMogK+UCUjMuLouIeL+OIvwoIAzxvVs5pItAkJ6Dkf87A9JzQwefAniccik1WQ4JRgUKrRayRkB9UdJwnKdVRcvxfJaQ5Vy8B0oCNHUGKKPcKADVy8qKGalh9ebdWfYhiHoJ13jWQ4fRCVx6DafT0kG4CGgU4inEmV7BIGJKLqGIrFM+FSdQABQwIz9z3AAleB9Bwc7TVm4EhiEsIbjhNA2J3BgnH7ahYZEfA7QA7xDnSsp-EoGgsTKaAdjwO0MCWynLFgB9BTwAAWAB2RBEIAWnggBmXm2A4EBMBwPB8GoOABCp4RmB4NghKoKBFXSBAUE4SWeCwCAqRkaBKchcgeBIYgyjgRBEUMMp0mjaWsXhPWDegAABTz8E9gA2Z39cIQ2oHwfhKeIc1uBAOBqENspRHYbWI5dgPoD5lljZkU2QHNy3rfhW37cdrA-ddqBU9Yt3YPwRCq-hFlg7lsOLTwKOY7joTWCAA)

You could solve this problem so many ways with streams.  We could actually change this behaviour without editing `useInterval` at all.  But I'll leave that as an exercise for the reader.

#### A personal note

Something I've found while working with streams for UI development for the past 5 or 6 years is that I reach for components less often, because streams are simpler and more composable than components.  So I tend to rely on view functions and streams for most UI work.  I tend to have one big top level component for every route that defines some streams, and then everything else is just functions.  There's occasions where I use components - sometimes that interface can be preferable - especially when you need to interact directly with the DOM and do cleanup afterwards.

So when hooks were announced, my honest initial reaction was, that solves real problems, but they are problems I don't have.  I have closures for local state and I have composable transforms and effects via streams.  I personally think streams are a stronger, more precise abstraction.  I prefer to work with them, but hooks are still an intriguing worthwhile solution to the same problem domain.  It's worth experimenting with both and making up your own mind.

Having said that, I've always contended that hooks would never have been invented if React had closures because necessity is the mother of invention, and with closures, there's no _necessity_.

To illustrate my point, I recommend reading this section of Dan's post: (Refs to the rescue)[https://overreacted.io/making-setinterval-declarative-with-react-hooks/#refs-to-the-rescue] and then think about how that entire scenario only occurred because the view context was transient and stateless.  If there was a closure there, you'd just define the hook in the closure context and make use of it in the view, there'd be no invocation counting or need for refs.

There's this trend of diffing values to determine intent, we diff the DOM, we diff props, we diff refs: It gets the job done, but because it never completely solves the problem unambiguously, it's inelegant.  Closures and streams let us stop inferring what changed and instead _know_ what changed.  There is a little bit to learn initially, but once you've learned how streams work you'll find there's no rules or compromises. Streams are the perfect data structure for reacting to data changes without ambiguity, and even better - they are fun!

Hooks are deeply fascinating, and they are definitely an improvement over prior solutions, but I personally don't think it's worth the trade-offs.  I heartily recommend experimenting with streams in your framework of choice.

Mithril's stream module is completely decoupled from Mithril itself.  But if you'd like to use a stream library that is a bit more removed from any given framework, check out [flyd](https://github.com/paldepind/flyd).  

As for other stream libraries, xstream / Rx.JS / most.js are all great but might require a little more time to get up to speed and I personally don't know if it's worth the time investment.  The central reason those frameworks are more involved is because of a distinction between Subjects and Objects, which is a distinction I don't make nor find useful when doing UI programming - but that's a blog post for another day!

Thanks so much for reading - I hope it was interesting and useful to you.

If you've got any questions about streams or mithril.js - I recommend jumping in the gitter at https://gitter.im/mithriljs/mithril.js - the community is extremely responsive, friendly and helpful.

You can also reach me via twitter [here](https://twitter.com/jmsfbs).