Hooks and Streams
=================

[Dan Abramov](https://twitter.com/dan_abramov) wrote an excellent [blog post](https://overreacted.io) about making a declarative `setInterval` using React Hooks.

Check it out [here](https://overreacted.io/making-setinterval-declarative-with-react-hooks/). It's a great read.

I think Hooks are really cool, especially from a technical perspective.  But they are also a bit of a leaky abstraction.  If you know [the rules of hooks](https://reactjs.org/docs/hooks-rules.html) and understand why they exist you'll likely be fine - but I hope to convince you there's a better, simpler solution.

Hooks received a lot of criticism when first announced.  I didn't want to weigh in on that initial deluge because I think a lot of it was unjustified.  But now that the dust has settled and most people generally think Hooks are a good idea, I wanted to explain an alternative approach with all the same advantages and none of the caveats.

Unfortunately [simple is not easy](https://www.youtube.com/watch?v=oytL881p-nQ).  To get to the point where we can explain this simple alternative, we'll need to: walk through some SPA history; explore some alternative component interfaces; introduce a very small API surface for streams; and then we can compare and contrast with Dan's blog post.  I am confident it is worth your time, but if at any point you feel you need to take a break - please do so.

Hooks usage is beholden to a set of [rules](https://reactjs.org/docs/hooks-rules.html) because it's ultimately a very clever illusion.  Hooks make it seem like you're accessing persistent state entirely within the scope of a function call - but that's not really possible without some other background mechanics.  In React's case, they infer which state belongs to which function call by counting invocations.  It's more nuanced and complicated than that, but ultimately it's still inference.

By the end of this post I'll have hopefully demonstrated to you that inference isn't required.  But before we can even discuss alternatives we need to see Hooks with fresh eyes and within their historic context.

> 💡 SPA is short for Single Page App.  It refers to applications that do not require a page refresh to navigate to another page in a web application.  I'm using that specific terminology because SPA's have a very unique and interesting history that is separate from UI programming generally.  Statically linked HTML files and 100% server rendered pages are a very different problem domain.  React _can_ be used in these other contexts, but I'm not speaking to that subset of usage.

#### A short history revision

##### The V in MVC

Within the context of React, components were originally modelled after classes.  You'd create a class via `React.createClass`, and because each rendered component was the instance of a class, it had state.  You could control this local component state via `this.setState(newState)`. Having local component state allowed you to keep track of input values, validation, and anything you wanted.  This paradigm wasn't new at the time, but it wasn't exactly commonplace either.

Prior to component oriented design, React was marketed as the "View in Model View Controller" or the "V in MVC" for short.  MVC was the prevailing software architecture for GUI's at the time and the two most popular existing alternatives to React were MVC frameworks: Backbone.js and Angular.js.  These two frameworks could not be more different but were still working within the same MVC paradigm because at the time it was seen as a structural requirement for an application of any non-trivial scope.  React's big selling point was declarative views; this was a huge deal in a world where existing best practices dictated mutating pages via jQuery expressions in response to events firing.

Just getting the community to accept this small change in thinking was a massive undertaking.  So it's not surprising React didn't push much further for quite a while.  MVC was common in object oriented languages like Java, C# and Ruby.  Writing applications client side in JS was relatively new, so we adopted best practices from existing serverside contexts.  It made complete sense that React wouldn't deviate too far from that OO context, but over time it became clear React had a lot more in common with functional programming paradigms.  The FP community embraced React within their own ecosystems, and FP interpretations of React's declarative views would eventually have major influences upstream.

After React started advocating for component oriented design, many other component oriented frameworks emerged.  These frameworks often collapsed the MVC layers into a single component layer, which felt simpler.  Component oriented design held a lot of promise, but it didn't take long for this pattern to show its limitations on actual projects:  Having state inside components made it difficult for two components to share information reliably. It was seen as bad practice to let another component directly modify another component's state, and so the alternative solution was callback-passing where the parent component would pass a function to the child component which would allow the child to signal to the parent that the state should be updated to a new value.

##### Events and Callbacks

Cross-component communication is common for any non trivial app.  In MVC, events were commonly used: one component would emit an event and another component would listen for that event and react to it.  As a community we'd collectively learnt that event oriented architectures eventually lead to the same problems as allowing another component to mutate your state.  It becomes difficult to debug why a change occurred and what ultimately triggered it.

At least when passing callbacks down there was a clear hierarchy and control flow.  If only it weren't so onerous to manually define all these setters to perform very basic behavior composition.

Ultimatey passing callbacks didn't scale and using events was out of the question (though some persisted).  Amongst this chaos, several projects in the functional programming community were working on their own solutions and advocating for their own alternatives.  Probably the most influential was the Elm Architecture, which popularised the idea of stateless views, with a state model that folded a scan of streams into a new state.

This pattern was later incorporated into the React ecosystem as Dan Abramov's [Redux](https://redux.js.org/introduction/getting-started).

##### Redux - Close But No Cigar

Redux allowed large teams to use React without relying on unscalable component callbacks or event architectures.  Because Redux applications were unidirectional (state only travels down, actions only travel up) there was not as much need for component state.  The simpler control flow seemed to solve all the problems with events and provided much needed structure that was at least repeatable and scalable on larger teams.  But Redux introduced 2 new problems.

Firstly, it was extremely verbose.  Redux was an interpretation of a functional programming pattern that relies heavily on union types and pattern matching, which was translated to JS via sprawling switch statements.  Several libraries tried to solve this by generating every possible aspect of Redux from a smaller DSL (without going back to the source to find out this problem was already solved via union types).  This wasn't anyone's fault mind you - the JS community wasn't ready for sum types back then (I think it will still be a while before they're mainstream in JS - maybe after [`match`](https://github.com/tc39/proposal-pattern-matching) lands).

The other problem with Redux was performance.  Dispatching an action meant the central store would need to be recalculated and then a new state patch would be passed down to every component.  This spawned a bunch of new patterns, like prop memoization and granular redraws of subtrees.  But now we're diffing not just the virtual dom but also the props, and diffing props naively could lead to more issues as reference equality won't detect mutations.

On and on the story goes.  From here we see solutions like Immutable.JS which was greatly inspired by Clojure's persistent data structures.  The promise was you could efficiently detect if a change had occurred by relying on reference equality by never mutating state and instead patching only the segments that had changed.

If we zoom out for a moment we can see a general arc.  We need to react to changes in state (so the UI is updated), but we don't want to react to changes that aren't relevant (so the UI isn't slow).  Ultimately event architectures, component callbacks, prop diffing, redux actions, it's all attempting to solve the same problem.

But all these solutions rely on inference.  We try to infer what changed by comparing the previous value to the new value.  And that approach has its limits.

There's a data structure that does exactly what we need, without relying on inference - it's called a stream.

##### Pure Functional Components should have been closures.

Unfortunately, even with a mastery of streams, React's high level API means that we still end up depending on classes or hooks.

The value proposition of hooks is effectively the same as having a closure - so why not just have a closure?

Because a closure is a function that returns a function, and in React functions are components:

```js
function Hello({ name }){
  return <p>Hello {name}</p>
}
```

We can't return a function because when React sees a function in a call to `React.createElement` it assumes the result of calling the function will be JSX. It needs to execute that function every time it encounters it.

If instead the design were like this, we could have intermediate state in a component without relying on hooks/classes/redux etc.:

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
    <button onClick={ () => count++ }>Increment</button>
    <button onClick={ () => count-- }>Increment</button>
  </>
}
```

##### Is setState necessary?

But another problem - React would not render after that `onClick` fired.  React only renders a component when it detects the state has changed, but we're not giving React an opportunity to know `count` changes.  [Not all frameworks have this restriction](https://mithril.js.org/autoredraw.html#the-auto-redraw-system).  So let's assume instead, that all event listeners interally call `setState({})` in the backing component instance when a JSX bound event is fired.

> 💡 If that seems wasteful, think why would you ever bind an event listener if not to update some state that would immediately need to be rendered?

Adding this feature negates a lot of the needs for Hooks and in my mind justifies a semver major version change to React. 

Beyond `useState` hooks are advertised as a way to compose effects.  And this is where we finally get to streams: Streams are a composeable, customizable, time-independent data structure that does everything hooks do and more - without the compromise.

#### A declarative `useInterval`

I'm going to walk through writing a declarative `setInterval` just like Dan's hooks example.  But my version will be using streams for effect composition and data sharing.  Central to the entire exercise is closure components - which React doesn't have (but should!).  I'm going to assume you've read Dan's blog as we'll be bouncing off his work as prior art.

Because of the aforementioned caveats, I'm going to use Mithril - which is very similar to React but allows closure components, and automatically renders after event callbacks fire.

But don't worry, before we start we'll do a quick introduction / refresher to Mithril, Closure Components and Mithril Streams.

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

```js
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

We don't need refs to access the dom: the dom node is on `vnode.dom`. This component API design means the framework rarely gets in the way when you need to convert some non-declarative side-effectful work into a declarative component interface.  Mithril is transparent and extensible.

#### Streams

Mithril has a stream module importable as `import('mithril/stream')` it's a super lightweight reactive data store. This is the API.

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
// by mapping over it (just like any other
// stream)
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

Here's a complete example - I recommend checking out the live version and then we'll break it down step by step.

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
    view: () => 
      <div>
        <p>Count: {count()}</p>
        <label>
          Delay: 
          <input
            type="number"
            value={delay()}
            oninput={e => delay(e.target.value)}
          />
        </label>
      </div>
  }
}

m.mount(document.body, App)
```

[Live Example](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4A9GIAEAAX4APSVgA6aIXGKT1AJxjZJAXkX5tu5WhVgArquIR6ky3BgBJYVoBuGKAApgAExgoDABPVgBKYBVJSTUNCD8DTWIdbG8wqJj6dUlbagBrRJNU9LRojICg4PwsDAAHbwzoipCDAD5JSNLo7upYDC1XRg8vb3i0ku7usadiQZhhn1y8iklm4JW1sInu1gzt8sCQ-CY-arqGrui0tpi+gbdPHzGtsq79rp1iSy1SpZVd8xoKw2OylACCtXqEQysVWh2ChWSpm8ACYAKwABm2sLo1g0hiKWG8WIyMKyGiWiUcLgeI2AcMqknCpK6SzO9Wu+nauIY3kyeOuAGpJABGSRbRrdMl49neLD4HR+LQYADu20mGU+31KnUm9B0WFo7hgiEknPaa2OaD83mSlhgYQokvcEBgKtN5skkuiAB4-BB3K1vd0fbVWgBhWh403AHnENKsH1iMPB31BABGgSDl0m3QAIvDTamQxA0LVLMRi5NiMFajB9EoQGhLFhM1pG1Xuo97fp-PCE53ovRS+XiL2YDc1t4YPhiP0AOYwYj4bsOgG53NibMb31iDNZ4NJ-2BjIAgEqeWGgV+WjUFsifDp2h+daSCG1MKUGi0LC1aDzPB0wwTNyCoJxYGoWwsjwABORB0TYDgmy4PB8GoOABG-YRmB4NgAF0qCgUs8gQFBOBwPAsAgYhCC0aAv2+cgeBIYhajgRAJGsWo8nnNCfzEKiaLoqBpBFfAxIANgE6jaOgfB+C-Gs6zwOBqDo2pRHYcjuBAQTZKgABaQkGK0JiQBYtiOLELieL4rBpKE6AjKRbBpBRfAMQ8sRCXkzClJ01T1M0vDWCAA)

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

A function that takes stream(s) as input and returns a new stream has a fancy name: a stream _combinator_.  Because we're combining streams together to form a new stream.  You can probably imagine writing your own combinators in the same way you can compose hooks.  But the difference is we're not relying on an ambient global state tracker that is tied to a framework, we're just using a very simple data structure that can be used anywhere, in any framework, in any context.

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
// This is a paragraph tag that renders the current count.
// When the view renders we read the current delay 
// if it changes, mithril will patch the DOM. 
// When the user changes the number, we pass it to 
// the `delay` stream. The `delay` stream is passed 
// to the `useInterval` function, which will update 
// the `setInterval` and in turn update our `count`.
<div>
    <p>Count: {count()}</p>
    <label>
        Delay: 
        <input
            type="number"
            value={delay()}
            oninput={e => delay(e.target.value)}
        />
    </label>
</div>
```

Note our view layer is completely decoupled from `useInterval` - it doesn't know it exists, it doesn't need to - we simply read the outputs and write to the inputs.

This is a great aspect of streams: you can define relationships in an external context but share the inputs and outputs with other contexts.  To prove this, let's make our delay input, our count paragraph and our interval model logic all different functions.

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

// Not a component, just a function
// that takes a stream as input and returns
// some virtual dom
const input = ({ delay }) => 
  <input
    type="number"
    value={delay()}
    oninput={e => delay(e.target.value)}
  />
  
// Again, just a function
// that takes a stream as input and returns
// some virtual dom
const paragraph = ({ count }) => 
  <p>Count: {count()}</p>
  
// Also... a function
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
    , view: () => 
      <div>
        {paragraph({ count })}
        <label>Delay: {input({ delay })}</label>
      </div>
  }
}

m.mount(document.body, App)
```

[Live Example](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4A9ACoABAAF+ADylYpEsQB00QuMSnaATjGxSAvEvz7DWDRrABXTcQj0ptuDACSwvQDcMUABTAACYwUBgAnqwAlMAaUlJxUlo6EEEmusQG2P5RiclSjtQA1ukW2blo8YkhYeH4WBgADv6J8TURJgB8UrGV8f3UsBh6now+fv6pORX9-VNuxKMw4wGFRRRS7eEbW1Ez-ayJ+9WhEfhMQfVNLX3xOV1JQyNevgFTe1V9x30GxLZ6lTWGkOaA0YjEUgAcrQdBgkrQsI16CINrxXLCpHYHE5QWhwQVCBgdMQMEV4FI4WVlBg4FIIGhGrZYWg0r9-mg4GCIXAETApN4IHo-n5NgiNPl6YydKZAptTuEpNEHokADySpmtArhRowYxqEBoWxYABGy31mtetl1wXlORBs3o6uIxmAfOM3S2-hg+BJegA5jBiPhLTAovapGJOokuVIAIJ+jD01HoimY+zURz0GPEQnE0nkymZSwU2lOiksqRsgGcvHc3n8wXCqCiqyaejaKSNYYYP16JqEdKyuj2HRK90JPoqxqdADCtBHiB6w4YdpVYmn0drcagPPwe9TWIzOJjxqZBIgtKrHN09apNfyWFoNUHUQevXi+S26Sw5iL2QATAArAADPs+TLtKZhUv4oGbh+7bEhAxTpK4HgvBMwByrUirfPEaxXM09zjhB-jwiO9wANRSAAjFIeyap88EjgR-g-gYQR9gA7vsV49GRDA7PKirAtYbYcjosaNI0L5vnkCF8VsGwQYq35PqEORwZWgbsj0mr0AYj7eDAi5ER68rnCy-iZFa+zxBsAowJxJmvuODFSCqQQQN4Ua3LMPRdn2vb9kO84MDh4Z+e5YSmlAnQACLyouwBOrKX7RKwa7RaEPmRWunneYkIIghoP6PuRQS0NQRoiPgxpPtscZSVElA0AijTQMseDGhgMUtW4sBHu2eAAGzUYg1H-mwHAGlweD4NQcACK1wjMDwbAALpUFA9JFAgKCcDgeBYBAOZ6NALX-OQPAkMQjRwIg4L2I0RR+vNCJiMdp3QDI1H4L9w0fSdhBnVA+D8C1xDatwIBwNQZ2NKI7AHdDn3A9AAC0VIXXoV0gDdd0PWIT0vW9WCA19UCY3+WAyP++DAfTYhUmDS2QzqeCw-DiPrawQA)

---

#### Functions Compose

Recall that `useInterval` is a stream combinator: It takes streams as input and returns streams as output.  Well `model` is similar.  It's just a function that ignores (or takes no) input but returns a new stream.

So we've got one function being used to define the logic for another function.  That composition can repeat indefinitely.  You can refactor, share and combine stream behaviour as effortlessly as passing a stream to a function that returns new streams.

#### `ref`s & `useEffect`

Here's an excerpt from Dan's blog (seriously go read it if you haven't) about impedance mismatch between the imperative `setInterval` model and the declarative React model.

> A React component may be mounted for a while and go through many different states, but its render result describes all of them at once.
> ```js
>  // Describes every render
>  return <h1>{count}</h1>
> ```
>
> Hooks let us apply the same declarative approach to effects:
>
>  ```js 
>  // Describes every interval state
>  useInterval(() => {
>    setCount(count + 1);
>  }, isRunning ? delay : null);
> ```
>
> We don’t set the interval, but specify whether it is set and with what delay. Our Hook makes it happen. A continuous process is described in discrete terms.
>
> By contrast, setInterval does not describe a process in time — once you set the interval, you can’t change anything about it, except clearing it.
>
> That’s the mismatch between the React model and the setInterval API.

What Dan is describing is what in FP we call: a functor.

A Functor is defined with [two laws](https://github.com/fantasyland/fantasy-land#functor) - I'll leave that for [another post](https://james-forbes.com/#!/posts/the-perfect-api), but a solid intuiton on functor usage is: an interface to some state that isn't directly accessed, but can be transformed into a new functor of the same type by mapping over the state.

We can map over streams, we can map over lists, we can map over ... a lot of things.  But we don't tend to think of React components as something we map over.  But here's Dan again...

> A React component may be mounted for a while and go through many different states, but its render result describes all of them at once.

The exact same thing is true of mapping over a stream:

```js
const count = m.stream()

count.map(
  // This function describes all future states
  x => <p>Count {x} </p>
)
```

So are components equivalent to streams?  Not quite, components are a specialization for a particular domain.  They have callbacks and interfaces that are designed specifically for building UI and interacting with the browser's DOM.  But conceptually?  Yep!

- Components have initialization semantics (`stream(initialState)`).
- Components can retain local state (`stream()`)
- Components state can be transformed into new representations via lifecycle methods (`stream.map(...)`)
- Components can perform logic on teardown (`stream.end.map(...)`)

Think of a component as an object with some hidden state on it, and we visit and transform that state using lifecycle methods (e.g. `render`).  Conceptually, we're mapping over the component state to get back a new component.

Even when we mutate component state within a lifecycle method, our side effect is encapsulated within a transform function.  It's not pure, but it is an extremely similar model to a functor.

And that's a really helpful intuition to have, because it helps us see that we can often replace a component with a stream and vice versa.  

The benefit of using a stream is: it's extremely simple and precise (in a Rich Hickey sense).  The benefit of using a component is: it's specialised to UI domain work.

Knowing when and where these two tools are interchangeable is a similar intuition to know when a Hook and Component are interchangeable.  We should pick whichever tool we feel is best adapted to our given context, but we can only do that if we know about these alternative solutions. 

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

[Live Example](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4A9GIAEAAX4APSVgA6aFULjFJGgE4xskgLyL8OvctVowAVzTViEepKtwYASWHaAbhigAKYJIAJjBQGACekqwAlMAqkpJxkuqaEIGGWsS62L5RicmS9tQA1umm2blo8YnBoWH4WBgADr6J8TXhhgB8krGV8f3UsBja7oxePr6pORX9-RBgvkEhHQCEBkZoVlBQklE9rbOSUy7EozDjfoVFFEu1N+1hUTOHrAevfc-Vy3VMgfVNLT68RyXSSQxGHm8fimTyqH0SiV0xCs2kqVxU7xUEkkADlaJoMElaFhGvQRDdeM4CZJrLZ7PQsVJiIQMJpiBgivBJISylhuXAjmhGlYCWg0kiUWg4IytMSYJJPBBtMifEFiWp6BpBcLNEZ-LcOtFQYkADwQIUig7EMKNGAGJQgTZYABG5wdByhVjtwAeOXes3o5p1BgC8oM3V9MHw7O0AHMYMR8J6YHt-ZIxJ0EWhsQBBWMYc0Uqncmk2OwOCzY5msgocrk8zJmfnakXcsWSCWo6XZqRwOUKpUqnaBdW2TWaRrDDCx7RNQjpfV0GyaI3hhJ9E2NToAYVoy8QPSXDD9JrEW6zuagffwN5LtPLDJ7kmdreZEAFnalspwGSyWG7+RYLQNQLnsa69PE+QPOkWAmI22QAEwAKwAAzPPkR66sYvK+GheTjh2NhoOasYwXBf6+JkXqfH0+TMjASoACLfOkBywby9TnPGvjIA8NzaERJEALpRP8zQHMCvHfPxgloLGImggJaDEXJkgAPwGhEB6bNsBwVPhUpshAxTpM4biQhMAQPAe9FMSx0RZvEVxib4IJrphiweXsADUkgAIy7M8sz4cuLmwbogSzgA7s8n49ESy73NJhHKSRkQYioGqGZIOaNI0oGghBRLZVZyWYTJqWqawMHASEOSOR2CaSvsQKSPQuhAZ4MAHm5EbfPgvyUQJKYHDciowFFPVgd0EmSCagQQJ4matbMwCTrOM5zoue4MJEURpocc2hK6UDLYdszMbUB7AEGIr6tB0QHYcp7HSEZ3nSaL7EMQj7nf09CDMZRQhpIvUpSpsa+CsSkQyC+2zfE71-QEMMkSCGkAOQAAoYGZGOSAeGMAErwFYOD409synl9P1oEj-SngtS2zYk7yYmgsFAcuvgjtQZMiPgzrAWENy5Y0USUDQxKNNA5x4M6GAnZLLiwA+Up4AA7AALIgACcbAcI6XB4Pg1BwAIUvCMwPBsEJVBQOaRQICgnA4HgWAQMy2jQJLKLkDwJDEI0cCIBINiNEUsam8SYge170DSH5+BJwAbLHnuEN7UD4PwkvWraeBwNQ3uNKI7Cu9wIBx5n0AALS8r72j+yAgfB6HYjh5H0dYOn8dQPX8FYNICH4Cho9iBxudUPnldFyXZdCawQA)

You could solve this problem so many ways with streams.  We could actually change this behaviour without editing `useInterval` at all.  But I'll leave that as an exercise for the reader.

#### A final personal note

Something I've found while working with streams for UI development for the past 5 or 6 years is that I reach for components less often, because streams are simpler and more composable than components.  So I tend to rely on view functions and streams for most UI work.  I tend to have one big top level component for every route that defines some streams, and then everything else is just functions.  There's occasions where I use components - sometimes that interface can be preferable - especially when you need to interact directly with the DOM and do cleanup afterwards.  My estimate is, I reach for components 5-10% of the time, and that's worked really well for me.

That may seem a little strange considering how often we're told to use components.  But my view on them is: they're a complicated interface and that leads to complicated code.  Use them when that complexity is warranted, otherwise pick the simplest tool for the job.

When hooks were announced, my honest initial reaction was, that solves real problems, but they are problems I don't have.  I have closures for local state and I have composable transforms and effects via streams.  I personally think streams are a stronger, more precise abstraction.  I prefer to work with them, but hooks are still an intriguing worthwhile solution to the same problem domain.  It's worth experimenting with both and making up your own mind.

Having said that, I've always contended that hooks would never have been invented if React had closures because necessity is the mother of invention, and with closures, there's no _necessity_.

To illustrate my point, I recommend reading this section of Dan's post: [Refs to the rescue](https://overreacted.io/making-setinterval-declarative-with-react-hooks/#refs-to-the-rescue) and then think about how that entire scenario only occurred because the view context was transient and stateless.  If there was a closure there, you'd just define the hook in the closure context and make use of it in the view, there'd be no invocation counting or need for refs.

There'll be questions on twitter/stackoverflow etc about why someone's Hook state is transient, or why a ref being mutated didn't cause the Hook to reinitialize.  There will be issues raised on internal and public bug trackers because the intuition required for the use of refs wasn't internalised.  And ultimately, the refs solution, is only required because React does not have closure components. 

There's this trend of diffing values to determine intent, we diff the DOM, we diff props, we diff refs: It gets the job done, but because it never completely solves the problem unambiguously, it's inelegant.  Closures and streams let us stop inferring what changed and instead _know_ what changed.  There is a little bit to learn initially, but once you've learned how streams work you'll find there's no rules or compromises. Streams are the perfect data structure: for reacting to data changes without ambiguity; for cross component communication and for decoupled side effect control flow.  Maybe most importantly they are [simple](https://www.youtube.com/watch?v=oytL881p-nQ) (not easy).

Hooks are deeply fascinating, and they are definitely an improvement over prior solutions, but I personally don't think it's worth the trade-offs.  I heartily recommend experimenting with streams in your framework of choice.  But if streams do not work for you, then I recommend using Hooks over all the other alternatives we've seen in this ecosystem - they are a giant leap.

Mithril's stream module is completely decoupled from Mithril itself.  But if you'd like to use a stream library that is a bit more removed from any given framework, check out [flyd](https://github.com/paldepind/flyd).  

As for other stream libraries: there are many great options out there but they might require a little more time to get up to speed.  The central reason those frameworks are more involved is because of a distinction between Subjects and Objects, which is a distinction I don't make nor find useful when doing UI programming - but that's a blog post for another day!

Thank you so much for reading - I hope it was interesting and useful to you.

If you've got any questions about streams or mithril.js - I recommend jumping in the gitter at https://gitter.im/mithriljs/mithril.js - the community is extremely responsive, friendly and helpful.

I've also written an [Intro to Streams](https://james-forbes.com/#!/posts/intro-to-streams) post that is library agnostic and attempts to convey a helpful mindset when working with side effects and transforms.

You can also reach me via twitter [here](https://twitter.com/jmsfbs).

---

Many thanks again to [Barney Carroll](https://barneycarroll.com/) for donning the editor hat for this post.  I'm extremely grateful for his insights and time.
