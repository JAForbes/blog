---
title: Intro to Streams
subtitle: Imagine if JS had a keyword for reactive variables
created: 2017-11-04
featured: true
archived: false
---

Streams go by many names and representations.  You might hear terms like Observables, Facts, Channels, Behaviours (and even Iterators / Generators).  From conversations I've had with many developers, it seems the fundamental power in the abstraction is often replaced with an obsession with the particular implementation instead of the reason for the implementation.

In this post, we are going to rectify that.  I don't want to address the specific problems I see in the larger discourse surrounding streams - but I am going to request that you approach this post with a clean slate.  If you have experience with a stream library and its particular pedagogy and vocabulary - please put that to one side for the duration of this post.

By the end of this post, you will be able to:

- See how streams elegantly manage complex state synchronization. 
- See how these concepts apply in innumerable common contexts.  
- Understand how streams prevent us from introducing a large swath of common bugs.  
- Be able to do this without having to learn dozens of new concepts and jargon.

The problem with names
----------------------

Before we seek to understand streams, we must understand the problem that they solve.

```js
var age = 2
```

The above is a variable declaration and assignment statement.  We're creating a name for a location in memory, and then we're storing a value in that location.

I'm free to put a new value in that memory location.  For example this is valid.

```js
var age = 2

age = 3
```

The above snippet uses the same name to represent multiple values and demonstrates that for even very simple programs - we may never know what value a variable could contain at any point in time.  So when you see this snippet:

```js
console.log( age )
```

You cannot know what will be logged.  Because code is free to change what is contained in that memory location at any time.

`var age;` should scare you.  Reading that, all we have is a name without any indication of its future value or who can write to it.  The potential states for that variable are hard to fully comprehend.

Think about most bugs you've recently tried to fix.  Almost always, the core problem is a mismatch between an expected state and an actual state.  When we encounter these bugs we traverse our codebases and callstacks to try and understand where, how and why a value was changed.

Hopefully you can see that descriptive names or comments cannot prevent these bugs.  Unless the names for your variables are `anyPotentialValue` or `unknown` then your name is not representative of the reference's potential for change over time.

We've got lots of tools to defend against this problem.  Lexical scoping, modules, assertions, watch expressions - even type systems.  All these tools are useful and valuable, but they don't fix the core problem.  We are naming memory locations not relationships; we have a modelling problem.

If we can model our systems as relationships then the aforementioned tools only become more useful.

But what are relationships?  How do we change our conceptual framework from assignation to memory locations; to something less brittle?

```js
var a = 4

var b = a * 2
```

It would be reasonable to assume that `b` will always be updated to be double the value of `a`.  But there is zero guarantee that is true.  So now we've got 2 problems:

1. Our memory location could contain any possible value
2. The relationships we define at initialization have zero guarantee of being retained.

Some languages advocate for encapsulation to solve the problem.  Instead of modifying and accessing values directly, we can modify or access via getters and setters.  

```js
var o = {
	_a: 4
	
	set a(x){
		o._a = x
	}

	get a(){
		return _a
	}

	set b(x){
		o._a = x / 2
	}

	get b(){
		return o.a * 2
	}
}
```

Even if you don't think proxies are problematic, this approach is still extremely verbose and imprecise.  It is difficult to understand how `a` or `b` interact in our business logic because the relationships are distributed across various methods.  This is a very simple program and it's already quite difficult to follow.


The problem with `const`
-----------------------

Javascript recently introduced a new way to interact with memory locations:  `const`.

`const` prevents us from putting new references into the same memory location after initialization.

```js
const a = 2

a = 4 // Type Error!

const b; // Type Error!
```

Now we've got what some languages would call a _binding_.  Our name is bound to a particular reference permanently.  And this is great!  It's an important feature.  But `const` has a fatal flaw: our names are bound to memory references, not values and certainly not relationships.

Javascript will let us modify the internal state of an object as long as one retains the same reference.

```js
const o = { a: 1 }

o.a = 2 
// Same object = no type error

o = { a: 2 } 
// Different object = type error!
```

`const` doesn't provide much safety or guarantees for most code we write.  It's better than nothing, but it doesn't solve the problem.  The only way to solve our modelling problem is to bind names to relationships.


Relationships
-------------

All programs do is tell a computer how to behave.  Imperative programming is writing a series of instructions for the computer to perform.  The behaviour is emergent from those specific steps.  This can have benefits (like performance).  But this style of programming is extremely brittle.  Representing business logic as a series of instructions a computer understands is non trivial.  Business models are rarely defined in terms of assignments to memory locations and nested loops; they are usually defined as relationships.

These relationships could be formulas: e.g. a customer's discount is based on the age of their account and the particular plan they are on.  These kinds of relationships are easily modelled in a program like Microsoft Excel, or in a relational database but until very recently we haven't modelled business logic in this way in software products themselves.

That's partly because our languages haven't facilitated solving problems in this way efficiently.  But for decades there have been proponents of an alternative programming style called Functional Reactive Programming.  And very recently this style has become mainstream, even in languages where you'd least expect it like C# and Java.

We needn't concern ourselves with FRP in particular except to note that this style is decades old and used by most enterprise businesses every day.  It's mainstream and hidden in plain sight: spreadsheets.

Sources and Relations
---------------------

Spreadsheets are incredibly powerful.  They are declarative and have proven to be invaluable for encoding complex business models for decades all around the world.  But spreadsheets have other problems which prevent us from using them to write stable, secure software.  Maybe one day that will change, but we can still take advantage of the power of spreadsheets in our programming languages today via libraries.

I do not want to endorse or focus on a particular library in this particular post.  So for demonstration only, I'm going to introduce 3 pretend keywords to the language.  These keywords can be reproduced as functions in a library, but I believe having a pretend language will be beneficial for learning.

#### Keywords:

- `source`: represents an entry point to a relationship: In Excel this would simply be a cell with data in it instead of a formula.
- `relation` will always have the value defined by its relationship to the source: In Excel this would be represented as a formula.
- `update` lets us change the value of the source, in turn, refreshing all relations. In Excel this would be represented by simply typing a new value into a cell.

```js
source a
relation b = a * 2

update a = 4
console.log( b ) 
// logs: 8

update a = 10
console.log( b ) 
// logs: 20
```

We can define relations from sources and from other existing relations.

```js
source a
source b
relation c = a * 2
relation d = b / 2

relation e = c * d

update a = 2, b = 4

console.log( c, d ,e )
// logs 4, 2, 8
```

We cannot overwrite a `relation` with a value directly, we can only update the `source`:

```js
relation c = a * 2

c = 4 // type error!
```

This allows us to write programs with guarantees.  A name is bound to a relationship that is maintained.  Think of the tests, and logs you no longer need to write.  We are binding names to behaviour, and that behaviour is defined in terms of relationships that hold permanently.

Practical Example
-----------------

This is all pretty abstract.  Maths is well and good.  But it turns out any business model can be represented relationally.  So let's dive into a real world example.

Imagine we're working at a video streaming service.  We've got a bunch of visual cues that depend on the progress through the video duration.

A video's first 60 seconds may be an introduction, or a recap, but not the episode content itself.  So we may want to show a cue to skip the introduction.

When an episode is about to end, we want to show the user we're about to start the next episode and give them ample opportunity to prevent that.

And when an episode is the last in the series, we may want to show a recommendation for another show with the option to view a trailer.

All these examples depend on relationships to other data.  And these relationships are reusuable across shows, they're also composeable.  We can define complex relationships in terms of other relationships.

For example, if we know the video duration, and the current playback position, we can define a relationship which is the percentage completed through the video.

From that percentage we could define a UI widget that presents that percentage as a partially filled bar.

We may then take that bar, and compose it into a larger widget that shows our current view progress across several recently watched shows.


So we're able to compose simple relationships into complex relationships.  And from these relationships our behaviour emerges by simply changing source data over time.

```js
source duration
source currentPosition

relation percentageComplete = 
	(currentPosition / duration) * 100

relation completionUI = 
	'<div style="width: '+percentageComplete+'%;"></div>'


update 
	duration = 
		30 * 60 * 60 * 1000
	, currentPosition = 
		15 * 60 * 60 * 1000

console.log( completionUI )
// logs: "<div style="width: 50%;"></div>"
```

Hopefully you can imagine how this scales to very involved programs and how it ensures state says in sync.

From Relationships to Streams
-----------------------------

Continuous relationships are the dream.  They are the goal.  But in order to implement them in practice we need to build them on top of discrete events.  

In practice, updating the video's progress state would trigger an event that updates the `percentageComplete` relation, which in turn would emit an event which would update the `completionUI`.

Streams are the mechanism for implementing relationships.  Technically, streams faciliate writing other type of programs, but whenever possible we should think of streams as merely a facilitator for composeable relationships.  

It surprised me at first how much of our programs can be written relationally.  We can push the discrete, imperative, mutative world to the absolute edges of our systems; and at the same time, gain huge wins in performance by only computing the bare minimum updates due to the nature of streams.

Hopefully this post has conveyed the value in that approach.

In a future post I'd like to demonstrate a particular library.  But first I wanted to cleanse our collective palates of the common event focused discourse when talking about streams, observables and so on.

Thank you for your time.  And happy streaming!  

> Many thanks to Fred Daoud (https://github.com/foxdonut) and Barney Carroll (https://github.com/barneycarroll) for their help refining this piece.