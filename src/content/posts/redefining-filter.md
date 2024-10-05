---
title: Redefining Filter
featured: false
archived: false
created: 2017-01-25
---

Have you ever written code like this before?

```js
var list = []
for(var i = 0; i < somethingElse.length; i++ ){
  if( someCondition ){
     list.push( somethingElse[i] )
  }
}
```

I've seen this pattern come up in a lot of code I review.  We can replace this custom logic with a standard template: `filter`

```js
var list = somethingElse.filter( () => someCondition )
```

For some readers this might be familiar territory.  You may have already internalized that you can replace this particular pattern with filter.  But let's disect it so we can use filter in more interesting ways in a moment.

`filter` is an abstraction over 2 things.

1. List iteration
2. Conditional aggregation of a new list

If we can provide something to iterate over, and a condition to check on each item, `filter` can do the scaffolding of the for loop.  And more importantly `filter` can implement the internals how it sees fit.  We could internally optimize `filter` based on context the caller is not aware of.

Iteration is perhaps the wrong way to think of it.  A better word would be traversal.  Because who says `filter` needs to interally process the list in order?  As long as we get the expected output it doesn't matter and it isn't part of the contract.
And for that matter, who says `filter` has to work on only Lists?  Couldn't we have filter for objects too?

```js
;({ a: 1, b:2, c:3 }).filter( x => x > 2 ) 
//=> { c: 3 }
```

So let's revise our analysis to be a little more general:

1. Traversal of an object of a given type
2. Conditional aggregation of an object of the given type

To demonstrate this, let's add a `filter` method to the Number prototype.

```js
Number.prototype.map = function(f){
  const answer = 
    [this]
    .filter( v => !isNaN(v) )
    .map(f)
    // return NaN if there's no other value
    .concat(NaN)
  
  return answer[0]
}
Number.prototype.filter = function(f){
  const answer = 
    [this]
    .filter( v => !isNaN(v) )
    .filter(f)
    // return NaN if there's no other value
    .concat(NaN)

  return answer[0]
}
```

Notice if the number is NaN we don't call our function `f` on it in either case.  This is just like `Array.prototype.filter` which ignores empty lists.  Also notice we only return our value if `f(this)` returns `true` which is also exactly like filtering a List, we only retain values that pass the predicate `f`.

So despite operating on a completely different type, the semantics are very similar.

Here's some imperative code that only performs operations on numbers that are divisible by 2

```js
if( i % 2 == 0 ){
  i = i / 2
}
```

And here's our version with `filter` and `map`

```js
3..filter( i => i % 2 == 0 ).map( i => i / 2 ) 
//=> NaN

2..filter( i => i % 2 == 0 ).map( i => i / 2 )
// => 1
```

You may look at the above code and think its actually longer than the if statement.  That's true, but thats not a great metric for improving code.  What's significant about our second example is the complete isolation of every operation.  The `if` statement is a single unit of custom code.  The 2nd example is several clearly delineated steps.

We're also using a shared language for similar operations.  So when we add additional data structures we reuse the same semantics again and again.  Here's the above example wrapped in a list.

```js
var results = []
for( var i = 0; i < list.length; i++){
  if( list[i] % 2 == 0 ){
    results.push( list[i] / 2 )
  }
}
```

```js
[3,4,5].map( 
  i => i
    .filter( i => i % 2 == 0 )
    .map( i => i / 2 )
)
.filter( i => !isNaN(i))
//=> [2]
```

The top example has a wide variety of syntax, verbs and operations.  

- variable declaration
- for loop syntax
- parens
- brances
- function calls
- ++ operator
- semicolons
- assignment
- if syntax
- modulo operator
- equality operator
- dynamic property acces
- division operators
- static property access

The bottom example has signficantly less variety:

- parens
- arrow function declaration
- function calls
- modulo operator
- equality operator
- static property access

And again our conditionals are separate from our aggregation, so we can easily refactor our code without needing to consider lexical scope or the larger context of the algorithm.

```js
const isEven = i => i % 2 == 0
const halve = i => i / 2
const filter = f => x => x.filter(f)
const notNaN = v => !isNaN(b)
const map = f => x => x.map(f)
const pipe = (f, g) => x => g(f(x))

const f = 
  pipe(
    map(
      pipe(
        filter( isEven )
        ,map(halve)
      )
    )
    ,filter(notNaN)
  )

f(list)
```

Again, our sample is more code, but our code is simpler.  The function definitions are uniform, they do one thing in the same way again and again.  And our actual business logic is just function calls.

A language analysis of the above code sample:

- function declarations
- function calls

> Simpler doesn't mean "easier" it means there are less constituent parts.
>
> See [Simplicity Matters by Rich Hickey](https://www.youtube.com/watch?v=rI8tNMsozo0)

What's more, all the functions we just defined are standard functions that exist across languages, and are defined in many popular JS util libraries.  So from the get go we could use a library and avoid the function definition.

```js
const {pipe,map,filter,reject,multiply} = require('ramda')
const isEven = i => i % 2 == 0

const f = 
  pipe(
    map(
      pipe(
        filter( isEven )
        ,map( multiply(0.5) )
      )
    )
    ,reject(isNaN)
  )

f(list)
```

Redefining filtration
---------------------

Initially I defined `filter`'s responsibilities as:

1. List iteration
2. Conditional aggregation of a new List

Then we updated that definition to include any data type with any internal traversal strategy

1. Traversal of the type we received
2. Conditional aggregation of an object with the same type we received

But as we've just seen with `Number.prototype.filter`, there doesn't have to be traversal at all.
Our `Number.prototype.filter` simply prevented us from performing operations on certain types of data.
If its `NaN` we skip, if its not `NaN` we don't.  At the end we give back an answer, but we didn't traverse a list, or a tree, or any container.

Here's a new way of thinking about `filter`

1. Optionally performs computations based on an aspect of a given type
2. Returns the result of that computation

If a list is empty, we opt out of computations.  If a number is NaN we do the same.

Consider the above definition in tandem with this code:

```js
var r = x
if( someCheckOn(x) ){
  r = someThing
}
return r
```

Or a short circuting logical and `&&`

```js
x && doSomethingElse
```

I'm not advocating adding `map` and `filter` methods to `Number`.  I'm simply hoping to redefine `filter` as more than just a "list operation".  Instead we can think of `filter` as a formalization and abstraction of conditional logic.