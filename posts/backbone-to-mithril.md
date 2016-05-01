From Backbone to Mithril
========================

When I first started eyeing off mithril, I found it hard to imagine adpating my existing knowledge of JS app development 
to this new framework.  There is a great article [Leo Horie](github.com/lhorie) wrote comparing 
[mithril to other major JS Frameworks](http://lhorie.github.io/mithril/comparison.html) but it was written as if the reader had
already bought into mithril's philosophies.

The framework I had the most experience with before trying mithril, was Backbone.  So instead of saying why Mithril is better
than [Backbone](http://backbonejs.org/), I'm just going to show how to map Backbone's core ideas to Mithril, 
and leave the final judgement up to the reader.

A high-level application in Backbone
------------------------------------

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

This is truly the most important change Backbone brought to the application model.  This was the spinal cord that Backbone's name 
refers to.

Models and Collections
----------------------

Before Lodash, we had Underscore.  And Underscore was not anywhere near as mainstream as the library that made use of it, Backbone.
Backbone's Collection methods became a marketing tactic for utility oriented development.
These collection methods convinced us we didn't need to write custom logic for managing our data.  
We could use existing functions like `difference`, `sort`, `where` etc.

Backbone was secretly introducing us to functional programming.  But in order to avoid creating panic, we pretended these utilities
were methods instead of pure functions.  This meant that when we wanted to use new functions, we had to `extend` the base collection.

A simpler approach would have just been to use underscore directly and keep all our collections as arrays of plain objects.
When you want to implement new functionality, you don't need to introduce inheritance (and all the complexity that entails).


