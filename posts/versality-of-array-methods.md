The versatility of Array methods
================================

**Using array methods to replace conditionals, null checks and exception handling.**

Javascript arrays have some pretty useful helper methods.  Usually we think of them as a handicapped Lodash or Ramda.  Sure `map` and `reduce` is nice, but what about `_.uniq` or `_.difference` or `_.groupBy`.

But Javascript has just enough primatives to get by without pulling in additional libraries. And in es6 with arrow functions we can define new and interesting visitor functions without expending too much effort.

But what I'd like to focus on in this post, is seeing these existing Array methods in a new light, as a replacement for if statements.

#### Dessert First

By the end of this article you are going to be able to convert this code:

```js
var results = []
for( var i = 0; i < list.length; i++ ){

  var a = list[i]
  var b = a && a.someProperty && a.someProperty.someSubProperty
  try {
    var c = JSON.parse(b).value
    if( c % 2 == 0){
      results.push( c )
    }
  } catch ( e ){}
}
```

Into this code:

```js
const f = 
  pipe(
    flatMap(
      pipe(
        get('someProperty') 
        ,flatMap('someSubProperty') 
        ,flatMap(parseJSON)
      )
    )
    ,filter( isEven )
  )
  
const results = f(list)
```

We are going to replace a lot of tedious spaghetti code with small isolated functions that build upon functionality already present in Javascript Array methods.

> For demonstration purposes only we will be adding methods to built in prototypes.  Fear not.  Think of it as a polyfill for ES2050.

filter vs if + push
-------------------

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
var = list = somethingElse.filter( () => someCondition )
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
    .concat(NaN)
  
  return answer[0]
}
Number.prototype.filter = function(f){
  const answer = 
    [this]
    .filter( v => !isNaN(v) )
    .filter(f)
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

Again, our sample is more code, but our code is simpler.  The function definitions are uniform, they do 1 thing in the same way again and again.  And our actual business logic is just function calls.

A language analysis of the above code sample:

- function declarations
- function calls

> Simpler doesn't mean "easier" it means there are less constituent parts.
>
> See [Simplicity Matters by Rich Hickey](https://www.youtube.com/watch?v=rI8tNMsozo0)

What's more, all the functions we just defined are standard functions that exist across languages, and are defined in many popular JS util libraries.  So from the get go we could use a library and avoid the function definition.

```js
const {pipe,map,filter,reject,multiply} = require('ramda')
const isEven = i % 2 == 0

const f = 
  pipe(
    map(
      pipe(
        filter( isEven )
        ,map( mutilply(0.5) )
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

`filter` is a formalization and abstraction of conditional logic.

I'm not advocating adding `map` and `filter` methods to `Number`.  I'm simply hoping to redefine `filter` as more than just a "list operation".
Later in this post I'll show a more robust and repeatable way to achieve the same thing we've done in this section.

Operations that may not succeed
-------------------------------

```js
function divide(a, b){
  return a / b
}

function get(p, o){
  return o[p]
}

function parseJSON(str){
  return JSON.parse(str)
}

function toLowerCase(str){
  return str.toLowerCase()
}
```

Above we have some utility functions that seem fairly innocuous.  

```js
toLowerCase('{"A": 2}') //=> 'hello'
parseJSON('{"a": 2}') //=> { a: 1 }
get('a', { a: 2}) //=> a
divide(10, 2) //=> 5
```

But all these functions could potentially fail or yield unexpected output.

```js
toLowerCase(null) //=> TypeError: Cannot read property toLowerCase of null
parseJSON("{'a': 1 }") //=> SyntaxError: Unexpected token ' in JSON at position 1
get('a', { A: 2 }) //=> undefined
divide(10, 0) //=> Infinity
```

So we could make our functions more defensive:

```js
function toLowerCase(str){
  if( typeof str == 'string' ){
    return str.toLowerCase()
  } else {
    // what goes here?
  }
}
function parseJSON(str){
  try {
    return JSON.parse(str)
  } catch (e){
    // what goes here?
  }
}
function get(p, o){
  if( o != null ){
    return o[p]  
  } else {
    // what goes here?
  }
}
function divide(a,b){
  if( typeof a == 'number' && typeof b == 'number' && b !== 0){
    return a / b
  } else {
    // what goes here?
  }
}
```

Even though our simple functions now check values diligently for errors and catch potential exceptions we still have problems!

- We are not handling all possible error states
- Our code is surrounded by stuff that isn't the responsibility of that function
- We do not have a simple answer for what to return in the failure case

The last point is the most important.  What is the correct return type for the failure case?

- throwing exceptions causes more problems
- returning null can just break the next function
- not returning at all is much the same as returning null.  
- returning false can overload the meaning of false.

What is a reasonable response to any of the `else` or `catch` cases?

As a thought experiment, lets create a rule than an empty list symbolizes failure, and a list of one entry symbolizes success.

```js
[1] //success
[] //failure
```

Let's create a decorator function that absorbs exceptions and wraps the result in a list.

```js
function unsafeToMaybe(f){
  return function(x){
    try {
      return [f(x)]
    } catch (e) {
      return []
    }
  }
}
```

If we wrap `JSON.parse` in our `unsafeToMaybe` we can write code that can traverse the success case without worrying about the failure case.

```js
const parseJSON = unsafeToMaybe(JSON.parse)

parseJSON('{"A":1}') //=> [{A:1}]
parseJSON("<A>1</A>") //=> []
```

Now that we get back a list, we can tack advantage of the native behaviour of `map`.  It will never call a function on an empty list, and in our case an invalid output.

```js
parseJSON('{"A":1}').map( o => a.A / 2 ) //=> [0.5]
parseJSON("<A>1</A>").map( o => a.A / 2 ) //=> []
```

Let's extend our unsafeToMaybe to ignore `undefined` and `null` too.

```js
function unsafeToMaybe(f){
  return function(x){
    try {
      // no if statements here!
      return [f(x)].filter( v => v != null )
    } catch (e) {
      return []
    }
  }
}
```

Now let's make our original functions all return lists on a failure case.

```js
// we'll leave divide be as technically `Infinity` is a correct response
// but we'll curry it so we can easily call it when we're chaining
const divide = a => b => a / b

// we'll leave toLowerCase as is
// because we don't need to do null checks with our new system
function toLowerCase(str){
  return str.toLowerCase()
}

// We only need to wrap the unsafe part
const get = p => unsafeToMaybe( o => o[p] )

const parseJSON = unsafeToMaybe(JSON.parse)
```

Notice we've only wrapped functions that could either return undefined/null or could throw an exception based on non null input.
We are no longer checking if the inputs are valid: we can always safely assume they are from here on in.

```js
['{"A":2}'] 
  .map( toLowerCase ) //=> ['{"a":2}']
  .map( parseJSON ) //=> [[{ a: 2 }]]
  .map( v => v.map( w => w.map( get('a') ) )) //=> [[[2]]]
  .map( v => v.map( w => w.map( x => x.map(divide(100)) ))) //=> [[[[50]]]]
  
```

So we're gracefully handling error cases, but we've got a problem.  Everytime we call a function that could potentially fail we end up with an extra wrapper list.  There's an easy fix, we need a function that can transform our value and then unwrap 1 layer of list at the same time.  This function goes by many names, some call it `bind`, others call it `chain`, we'll call it `flatMap`.

```js
Array.prototype.flatMap = function(f){
  // We don't just grab `[0]` because 
  // Array's can hold more than one value.
  return this.map(f)
    .reduce( (p,n) => p.concat(n), [])
}

[3].flatMap( x => [x * 2] ) //=> [6]
```

With `flatMap` in play let's revisit our sample caller code.


```js

// valid json
['{"A":2}'] 
  .map( toLowerCase ) //=> ['{"a":2}']
  .flatMap( parseJSON ) //=> [{ a: 2 }]
  .flatMap( get('a') ) //=> [2]
  .map( divide(100) ) //=> [50]
  

// invalid json
["{'A':2}"] 
  .map( toLowerCase ) //=> ["{'a':2}"]
  .flatMap( parseJSON ) //=> []
  .flatMap( get('a') ) //=> []
  .map( divide(100) ) //=> []
  

// valid JSON with missing property 'a'
['{"B":2}'] 
  .map( toLowerCase ) //=> ['{"b":2}']
  .flatMap( parseJSON ) //=> [{ b: 2 }]
  .flatMap( get('a') ) //=> []
  .map( divide(100) ) //=> []

// valid JSON dividing by 0
['{"A":0}'] 
  .map( toLowerCase ) //=> ['{"a":0}']
  .flatMap( parseJSON ) //=> [{ a: 0 }]
  .flatMap( get('a') ) //=> [0]
  .map( divide(100) ) //=> [Infinity]

```

Take a long look at the above code.  In this new world we no longer see `undefined`, `null`, `SyntaxError` or any other warts.  And we aren't ending up with deeply nested lists of values.  We can also tell which functions will potentially fail because we call them with `flatMap` as opposed to `map`.

There's 2 niggling issues

- We're dividing by 0 and its considered valid
- We're mutating the prototype of the Array

Well we could technically solve the first issue by putting an if statement in divide that returns `null`, but that would break our rule of avoiding `if` and avoiding `null`.

There's a few strategies we can take for handling input that's invalid for our business logic but valid within the language (e.g. `Infinity` or `NaN`)

We'll visit them momentarily, but first let's stop hacking on the prototype.

```js
const flatMap = f => x => 
  x.map( f ).reduce( (p,n) => p.concat(n), [])
  
const map = f => x =>
  x.map(f)

const pipe = (...fs) =>
  x => fs.reduce( (x,f) => f(x), x)
  
const f = pipe(
  map( toLowerCase ) //=> ['{"a":2}']
  ,flatMap( parseJSON ) //=> [{ a: 2 }]
  ,flatMap( get('a') ) //=> [2]
  ,map( divide(100) ) //=> [50]
)

f(['{"A":2}'] ) //=> [50]

```

Strategies for handling invalid values for your business logic
--------------------------------------------------------------

```js
const = divide a => b => a / b
```
Mathematicians often have different answers what dividing by 0 yields.  It can vary from person to person or from field to field.
In a business environment we usually want to consider 0 as an invalid case, and in some languages dividing by 0 throws an Exception.  In JS it returns `Infinity`.  `Infinity` is a `Number` and doesn't throw Exceptions when we operate on it, but depending on your situation that may actually be a bad thing, because it can silently fail.

```js
( 2 / 0 ) // => Infinity
( 2 / 0 ) * 100 // => Infinity (No Exception, because Infinity is a valid number)
```

One solution is to handle the case ourselves:

```js
;[0]
  .filter( x => x != 0 )
  .map( divide(100) ) //=> []
  

;[2]
  .filter( x => x != 0 )
  .map( divide(100) ) //=> [50]
```

Another solution (popular in F#) is to create a new type that defines what is valid and what isn't.

```js
const NonZeroNumber = x => 
  x != 0 
  ? [x]
  : []
```

This may not be the way your used to seeing types defined, you may have expected a class with some inheritance, but this achieves exactly the same thing without exceptions, `Infinity` or `if` statements in our business logic.

```js
NonZeroNumber(2)
  .map( divide(100) ) //=> [50]
  
NonZeroNumber(0)
  .map( divide(100) ) //=> []
```

BONUS ROUND: Multiple parallel conditionals
-------------------------------------------

Have you ever seen logic like this before?

```js
if( a && b && c && d ){
  // do something
}
```

Or this logic:

```js
if( a || b || c || d ){
  // do something
}
```

Or maybe something like this:

```js
a = a || defaultValue
```

Or potentially:

```js
a = b && b.property && b.property.nestedProperty || defaultProperty
```

We can replace all of these patterns with Array methods like `some`, `every` and `find`


```js
if( a && b && c && d ){
  // do something
}
```

Becomes:

```js
[[a,b,c,d]]
  .filter( conditions => conditions.every(Boolean) )
  .map( doSomething )
```
---

```js
if( a || b || c || d ){
  // do something
}
```

Becomes:

```js
[[a,b,c,d]]
  .filter( conditions => conditions.some(Boolean) )
  .map( doSomething )
```
---

```js
a = a || defaultValue
```

Becomes

```js
a = [a,defaultValue].find(Boolean)
```

---

```js
a = b && b.property && b.property.nestedProperty || defaultProperty
```

With our `flatMap` and `get` function becomes:

```js
[b]
  .flatMap( get('property') )
  .flatMap( get('nestedProperty') )
  .concat( defaultProperty )
  .find( Boolean )
```

A simpler language
------------------

Even if your not 100% sold on using Array's to avoid `for` loops, `if` statements, exceptions, unwanted values and more.  I hope I've made the case that Array methods are versatile, and perhaps next time you have some complex logic involving possibly null values and functions that may throw exceptions, you might give a thought to the humble Javascript array, the little object that could.

This article has been a covert introduction into the Maybe and Either Monad.  If you want to try out the real thing check out [Sanctuary](https://github.com/sanctuary-js/sanctuary)

I also recommend checking out [Railway Oriented Programming - Scott Wlaschin](https://vimeo.com/97344498).  It's a helpful introduction to the framework and justification for avoiding conditions and exceptions.

By relying on types that encapsulate decisions, branching, failure, success, we can write simpler code that is easier to edit and less likely to crash.

Thank you, for your time and happy coding!

---

Many thanks to [Barney Carroll](http://barneycarroll.com/) for transforming my mental sprawl into coherent, readable English.