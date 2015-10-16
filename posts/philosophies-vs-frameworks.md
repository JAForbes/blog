Ship philosophies not frameworks
================================

I've recently been quite excited by the thought of creating _philosophies_ as opposed to _libraries_ or _frameworks_.  

There have recently been many libraries released that are not really heavy on source control, but have reams of documentation.
And I think that is a more sustainable approach to software.

CycleJS is a new approach to the Model View Controller pattern.  in CycleJS you build your application as a single function that accepts a stream of responses from the user, and you reply with a stream of requests for further input.
There is a brilliant talk on CycleJS, by the creator Andre Staltz called The User As A Function.

Perhaps the most interesting part about CycleJS is that it is a very small abstraction built on top of two other libraries.  CycleJS is more philosophy than source code.  It is a _way_ to combine other abstractions.

Mithril is another MVC framework that is light on source code and heavy on philosophy.  Mithril is only 12kb gzipped but it has countless articles of well written prose.  It's design is like a martial art.  It provides minimal but powerful tools that transforms the immense struggle of developing user interface code into an effortless expression, perhaps even an artform.

Mithril has a small but passionate community that all seem to appreciate that Mithril is more practice than source code.  Many in the community support future releases removing features instead of adding them.  This approach seems bizarre until you stop thinking of a framework as a product and instead think of it as refinement of a concept.

I'm excited by this shift.  Instead of deploying source code, we are deploying abstractions, concepts.
The source code is just a road to take us to an idea.

Ramda is a collection of utility functions that focuses on clarity, simplicity and maximum composition.  The library itself has grown substantially, but the real Ramda isn't source code at all, it's a philosophy.  The philosophy is to make building blocks that only do one thing in one way, but make it simple to combine these blocks to create new functionality.

Ramda is also heavily inspired by languages like Haskell and perhaps this informs the academic, dense and unapproachable nature of the documentation. But really, the core philosophy is simplicity and composition.  Often I find myself writing in a Ramda _way_ without having actually imported their code.  

I think each of the libraries will have a long and successful life - ideas are almost impossible to extinguish.  I hope that over time we move away from the monolithic poorly documented compounds, and instead, share our ideas, and prose with a little bit of source on the side.

Ship philosophies not frameworks.
