---
title: The versatility of Array methods
created: 2017-01-25
featured: false
archived: false
---

**Using array methods to replace conditionals, null checks and exception handling.**

Javascript arrays have some pretty useful helper methods.  Usually we think of them as a handicapped Lodash or Ramda.  Sure `map` and `reduce` is nice, but what about `_.uniq` or `_.difference` or `_.groupBy`.

But Javascript has just enough building blocks to get by without pulling in additional libraries. And in es6 with arrow functions we can define new and interesting visitor functions without expending too much effort.

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
        ,flatMap(get('someSubProperty')) 
        ,flatMap(parseJSON)
      )
    )
    ,filter( isEven )
  )
  
const results = f(list)
```

We are going to replace a lot of tedious spaghetti code with small isolated functions that build upon functionality already present in Javascript Array methods.

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
toLowerCase('{"A": 2}') //=> '{"a": 2}'
parseJSON('{"a": 2}') //=> { a: 2 }
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
- returning `null` can just break the next function
- not returning at all is much the same as returning `null`.
- returning false can overload the meaning of false.

What is a reasonable response to any of the `else` or `catch` cases?

As a thought experiment, lets create a rule that an empty list symbolizes failure, and a list of one entry symbolizes success.

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

Now that we get back a list, we can take advantage of the native behaviour of `map`.  It will never call a function on an empty list, and in our case an invalid output.

```js
parseJSON('{"A":1}').map( o => o.A / 2 ) //=> [0.5]
parseJSON("<A>1</A>").map( o => o.A / 2 ) //=> []
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

Notice we've only wrapped functions that could either return `undefined`/`null` or could throw an exception based on non `null` input.
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
const divide = a => b => a / b
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

Even if your not 100% sold on using Array methods to avoid `for` loops, `if` statements, exceptions, unwanted values and more.  I hope I've made the case that Array methods are versatile, and perhaps next time you have some complex logic involving possibly `null` values and functions that may throw exceptions, you might give a thought to the humble Javascript `Array`, the little object that could.

This article has been a covert introduction into the Maybe and Either Monad.  If you want to try out the real thing check out [Sanctuary](https://github.com/sanctuary-js/sanctuary)

I also recommend checking out [Railway Oriented Programming](https://vimeo.com/97344498) by Scott Wlaschin.  It's a helpful introduction to the conceptual framework and justifications for avoiding conditions and exceptions.

By relying on types that encapsulate decisions, branching, failure, success, we can write simpler code that is easier to edit and less likely to crash.

Thank you, for your time and happy coding!

---

Many thanks to [Barney Carroll](http://barneycarroll.com/) for transforming my mental sprawl into coherent, readable English.
