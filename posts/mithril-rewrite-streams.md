Stream Misconceptions: 
----------------------

> I don't have real time data in my app, so do I need streams?

Streams are about streamlining real time user interactions as data.
While you could use it for web socket server data.  That is not the focus.

> Aren't promises enough?

Promises are not a suitable data structure / abstraction for handling user input
because Promises represent a single value, while user input is multiple (possibly infinite) 
values over time.

> I don't use m.prop currently?  Why would I use it now?

m.prop as it stands is useful for 2 things, passing references cleanly, and making event callbacks simpler.
It makes sense to avoid that extra layer of abstraction if you do not value the benefits that abstraction provides.

But now that props are streams, we can base our 

> Are observables just some sugar on top of the Observer pattern?

No.  Javascript has embraced the concept of (on/then/when).  We change some existing data when some event occurs.
Streams are about a piece of data *being* a function of some other data.  So instead of thinking in terms of time (when/then/on),
we can abstract over time entirely, and think in terms of transforms.

Exactly the same as Excel.  You do not create event listeners when you an Excel formula.

> Isn't Functional Programming Slower than a for loop?

"The effective programmer is keenly aware of the limited size of his own head." - Edsger W. Dijkstra

Yes.  It is.  But managing when to recalculate all the transforms in your code can become so complex, that your app will
become difficult to edit.  Codebases are not static.  You will constantly edit the same files over and over.
Streams allow you to only calculate when a dependent piece of data changes.  If you manage recalcs yourself, you will likely
waste cycles calculating things that do not need to be changes.  Your file will fill with boolean flags for marking when data is dirty.  Even identifying what the transforms are will become impossible, and therefore editing them is impossible.

Streams abstract over one thing: time.  Within a `map` you can write any transformation you would like.  You can write extremely 
imperative code if you prefer.  But at least it is clear what transformations are occuring.


Cross Component Communication
-----------------------------

Data Oriented Design
--------------------

- Mike Acton: "If you have a different dataset, you need a different algorithm"
- Abstractions are useful, but the wrong abstraction is harmful
- Choose Data structures most applicable to problem
- Virtual DOM is conceptually a transform stream
- Streams are the lowest level abstractiobn that makes sense
- Makes constant changes to your algorithm easier
- Immutability by default, mutability is simple when tuning performance
- Remove unnecessary model calculations from redraw (logicless view)
- Treat entire app as a series of transform streams reduced into a view

Mike Action: "The only purpose of *any* code is to transform data"

- Code is not anywhere near as important as the data
- Code is just a tool to transform data.
- Only write code that transforms the data in a meaningful way
- In order to do that you need to understand the data

CycleJS and the Elm Architecture
--------------------------------

Is vs When : Formula's vs Streams
---------------------------------

Currently our view code is conceptually focused on a single draw call/event combination.

- Draw a view
- Event triggers change to a prop
- Draw a different view by running many conditionals in your redraw (even for things that haven't changed since the previous call)

But if we can zoom out, and realise our app is about transforming data over many draw calls
We can remove a lot of logic from our views.

- Write data transformations first
- Draw a view
- Event triggers one of the transform streams
- Dependent streams triggered by parent stream changing
- Streams that do not need to be recalculated aren't
- Redraw multiple changes in the view via retrieval **not calculation**
- Data transforms are separate from view, easier to edit/refine
- Views have no ternaries in them, easier to edit/refine


React, "Reactive" and "Unidirectional Data Flow"
------------------------------------------------


Fantasy Land (Why you should care)
----------------------------------

- Recall picking the correct architecture is about choosing the right data structure for the problem.
- A consistent API for many different data structures makes switching easier/trivial.
- A consistent API means you spend less time checking documentation and more time coding
- Ramda + [Possible Lodash Support](https://github.com/lodash/lodash/issues/2406)
- Not about ignoring data, about choosing the best structure for your data.

Related Reading
---------------

[Unidirectional User Interface Architectures - André Staltz][http://staltz.com/unidirectional-user-interface-architectures.html]
[Data Oriented Design - Mike Acton][https://www.youtube.com/watch?v=rX0ItVEVjHc]
[Compression Oriented Programming - Casey Muratori][https://mollyrocket.com/casey/stream_0019.html]

