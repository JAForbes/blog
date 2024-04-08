# Why we need static stream graphs

Signals are all the rage at the moment.  It also has just come to my attention that there is now a TC39 language proposal to add signals to JS natively.

I really do understand the interest and excitement but after much research into this field (and functional reactive patterns generally) I have personally come to the conclusion that signals are a local maxima but ultimately a dead end for our long term development.

This probably seems heretical considering every framework under the sun is adopting S.js signals and seeing massive performance gains.  What makes matters worse is that I cannot show you a counter proposal, I cannot show you anything concrete and my reasoning is completely based on theoretical conclusions.  But I believe strongly our industry is about to spend a good decade or so on a bad idea and so hopefully I can convince a few of you to embrace this other possible future and move in that direction instead.

## UIs are Streaming DAGs

I personally watch a lot of conference tech talks.  But this talk is the most important video for the future of UI architecture design that I have ever seen.  Unfortunately because clojure/lisp is used a lot of people have been distracted by that and missed the forest for the trees.

Please watch the whole thing [here](https://www.hytradboi.com/2022/uis-are-streaming-dags), but as you watch, just replace the lisp syntax with JSX or hyperscript in your head.  The syntax isn't super important.

But I am going to assume you didn't watch it so I'll quickly summarise the argument it makes.

The idea is if we can statically analyze where data is referenced in our applications, we can build a dependency graph that models which parts of our UI needs to re-render (or which effects need to re-run).

Think of this graph as a big tree, where the nodes on the tree are your effects, your components, your JSX elements, your data stores, your network calls.  And the relationship between each of those nodes is total.  So you can trace a network call down the tree to the specific parts of the view that reference data from that network call.  And similar you can query in reverse, for a given view fragment, what effects and network calls need to run in order for that fragment to resolve?

This graph is constructed from your source code, but that graph can be compiled or converted into any execution model you like.  It can be converted into a static HTML document, a hydrating client/server model with streaming updates, a completely client side SPA with component renders or as a native app.  All of that sounds pretty uninteresting because we've accomplished these things already in different ways.

This is a single technical solution that solves for all these technical outputs.  Whereas in the current cutting edge stacks we have today we identify our dependency graph at runtime and each technical output requires a bespoke technical solution.

With a complete dependency graph we can treat tuning of performance of applications in the same we tune the performance of databases.  We can see which data relates to which other data.  We can analyze the usage patterns of those dependencies.  We can create histograms that change their rendering architecture on demand based on real time input.  We can create incremental materialiazed views.  We can have indexes.  And this can all be part of one powerful but ultimately simple system.

But it also means we can send data before the UI even asks for it.  I quote from the talk:

> Let's be clear about the network traffic.  The client sends nothing to the server.  The client and the server are like a sports team:  they agree on the play in advance.  The client knows where the ball is going to come, and the server throws the ball to where the client is going to be.  The only network traffic is a single message.

A system like this would allow us to work in a highly abstract way but have our UIs cross compile into hyper optimized code that can run on devices with lower specs.  Our applications would run faster and use less energy.  Data would arrive in parallel, before we even ask for it because the server knwos exactly what the client needs before the client asks.
"

But more than that, we'd have incredibly powerful developer tools. We could introspect and query our application in ways that make an IDE's "Refactor" or "Jump to Reference" seem archaic.  We could *query* the DAG, query our application and make automated refactors to improve legacy code.

In our current cutting edge stacks we can't have any of this because we build the dependency graph implicitly and at runtime.  This introduces ambiguities that make certain optimization impossible.

One of those optimizations has been named: resumability.

## Resumability

So what is resumability?

Resumability means a server can initialize a component and the client can resume that component.  This means any state / or effects that ran on the server do not have to be re-run on the client to get back in sync with the servers state.  They just arrive with the markup with their state pre-seeded.

The benefits are huge.  A large app can send a huge payload of HTML (which the browser is exceptionally fast at rendering).  It can render that HTML but still be immediately interactive because we do not have to wait for the entire component graph to re-init and hydrate from the server.  No components need to "init" on the client side, instead only the logic needed to patch the state is sent from the server.  This logic is bound to the existing pre-seeded state.

For frameworks like React, or Solid, or mithril this is really hard to do because components form closures all the time.  State is referenced from event handlers, hooks, etc that can not be externally seeded.

But for Solid in particular the problem is worse because Signals are a dynamic graph.  You need to execute that graph in order to know the shape of it.  This isn't true of traditional observable frameworks where you set up the graph explicitly by passing dependent streams in as arguments or relying on method chaining.  In theory that can all be statically analyzed within reason.  But for S.js we have to run a computation to know what the dependencies of that computation are.

The dependencies of a computation may not even be in the same function call as the computation, it could be several levels deep in the call stack.  And the dispatch of that call stack can rely on conditional logic that depends on the current value of other dependencies.

In order to statically analyze the dependency graph you need to have a system that understands the complete possibility space of the JS/Typescript language.  You would need to execute your code to build that graph.

But its not just resumability.  Let's talk about stores.

## Stores

It is quite common in web app frameworks to have some kind of state wrapper.  This wrapper lets the framework know when state has changed so it can determine if it needs to re-render.  But the moment you introduce a wrapper you need to decide on the reactive granularity that you need.  If you wrap the entire state tree then your app will respond to all changes when you may only want to respond to specific changes in specific ways.

If you nest these wrapper objects you run into really strange and confusing usage scenarios but also complex serialization and deserialization.

Different frameworks have different solutions for this problem, but a few have landed on using JS proxies to prevent having to wrap the state.  Instead you interact with a proxy that has access to the real state.  This proxy can automatically create the appropriate granular wrappers dynamically based on usage.

This solves the immediate problem, but now you will run into various corner cases involving proxies.  Equality can get messy, object spread will break the proxy reference.

If we look at Solid's store API for a moment we can have something more concrete to compare against:

```typescript
const [todos, setTodos] = createStore([

  { id: 1, title: "Thing I have to do", done: false },

  { id: 2, title: "Learn a New Framework", done: false },

]);
```

`todos` is a proxy we can reference in the view or in effects, and signals will be registered dynamically based on usage so those computations and renders will re-evaluate as expected.

E.g. if we have an effect and we reference the title property of the first todo, if that title changes that effect will re-run.

```typescript
createEffect(() => {
    // this will re-run whenever that todo changes
    console.log(todos[0].title)
})
```

But what if we create a reference more dynamically:

```typescript
let someId = createSignal(2)
createEffect(() => {
    console.log(todos.find( x => x.id === someId() )?.title)
})
```

This simple code sample will register a few dependencies, some expected, some surprising.  First we're refering the `someId` signal, so if that id changes our effect will re-run.

Secondly we're referencing the `id` of every single iteration of `todos` so at worst case, this effect is going to re-run if `id` changes on *any* `todo`.

And we need to delete all prior listeners and re-create them every time the effect runs.  So if the `todos` list is long, we're very inefficiently binding and unbinding listeners frequently.

The important thing to realise here is, we're relying on JS to be a pseudo relational query language, but none of this is cacheable.  We do not get any of the performance benefits we get with a genuine query language.   The reactive relations are completely dynamic and (in order to maintain identity integrity) must be destroyed and recreated from scratch on each emit.

Yes JS engines are fast.  But if we are re-orienting all our frameworks down this path we need to accept we can never cache our reactive relations.  And we need to accept that we must be responsible and careful in our use of stores to avoid these sorts of naive registration cycles.

Imagine instead if we skipped proxies and instead add persistent queries that can be re-used and cached indefinitely.

```typescript
let someId = createSignal(2)
let $ = createStore([ ... ])
createEffect(() => {
    let title = $`
        select title
        where x.id = ${someId}
    `

    console.log(title)
})
```

Here we can cache that query and its dependency list permanently.  We can also aggresively optimize when that query emits and how many listeners are required to trigger that effect to re-run.

We can also use the exact same API for writes:

```typescript
let title = $`
    select title
    where x.id = ${someId}
`

title.update( x => x + '!')
```

As opposed to solid's store API which has a separate API for querying writes and reads:

```typescript
setTodos( x => x.id == someId(), x => x + '!')
```

If we have a dedicated query langauge for state, we can aggresively cache, but also trivially statically analyze because the store query language can be far simpler than the entire JS language that the proxy is mimicking.  The exact form of that query language is something we will need to design over time.  But an important thing to know is that with such a query language we still cannot cache anything if the underlying reactive primative is a signal, because signal computations cannot be cached.  That isn't something that can be fixed, the moment you change that mechanism you are no longer dealing with a signal API.

But if the underlying reactive API was any traditional stream library, then that reactive dependency tree can be created one time and reused for the lifetime of that query.

We cannot build a DAG that understands our store/state access patterns if we use signals.  It isn't possible.

## The JS framework compiler problem

I've been ragging on Solid a bit so far, but its not because I think Solid is bad, its exactly because it appears to be so enticing at first glance that I felt the need to write this.  Despite everything I am saying, short term I think Solid.js is a great bet.  And if you are starting to use it now for some new app that is fine.  I am not so much talking to users of the framework but more language and framework authors.  It is a huge pivot to start using signals, and once that pivot is complete then you've now made your framework ineligible for these future performance optimizations.  Maybe that is okay, maybe that is a valid trade off.  It isn't a trade off that I have seen discussed anywhere, I just see "Signals go brrrr".

Svelte was the one framework that seemed to be pushing things in the right direction, but recently Svelte has pivoted towards signals.  I completely understand why.  Any compiler that tries to statically analyze and optimize JS is setting themselves up for failure.  JS is an incredibly difficult language to reliably statically analyze.  And if you pivot to runtime dependency tracking (ala signals), then a lot of hard problems disappear immediately and you can focus on more important things.

But if we instead have a small, simple language for state/store access then the rest can be easy breezy dynamic javascript.  We only need to know what state is referenced and where in order to build the DAG.  So instead of pivoting to signals I would recommend coming up with a Svelte state/store query DSL that you must use in order to reference state in effects or within the view.  By forcing state access to use an easy to parse query language, we effectively wrap state access in a membrane that 