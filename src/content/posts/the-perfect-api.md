---
title: The Perfect API
created: 2016-05-13
archived: false
featured: true
---

Imagine for a second that everything had the same interface.  Everything.

That interface would need to support asynchronous and lazy values, so it clearly needs to use functions.

The interface would need to handle errors, but because they may come lazily, they will also require functions.

We'd need a way to transform values (functions).
And a way to combine separate values together to create new values (functions).

If this API is going to handle every situation, its surface area can't be used conditionally.
E.g. we don't use certain parts for certain problem domains.
Every part must be useful for every problem domain.

It sounds like some kind of magical fantasy land - surely such a thing is not possible.
But let's try and create one anyway just to underscore how impractical we are.

So our perfect API needs to support:

- Creation
- Transformation
- Synchronous and Async computation
- Error handling
- Combining values



External Libraries:

> Through out this post I'm going to pull in arbitrary libraries to demonstrate interoperability.
Don't feel as if you need to know about any of these libraries - in fact what I really seek to demonstrate, is that by sharing the same API you really can follow along without knowing the ins and outs, or specifics.

Warning Haskell Programers!

> For the duration of this post I am going to use a simplified type annotation system that focuses on tracking the types *and* values to simulate a typed repl so non-functional programmers can track transformations more easily.
Please forgive my incorrect usage.  This article is optimizing for a different audience :)

Type Signatures

> Throughout the post I will be annotating types as `Array(4)`. This could be read as:

> "an `Array` that contains the value `4`".

> `Task('hello')` would be read as

> "a `Task` that contains the value `'hello'`"

> `Task Array(4)` would be read as

> "A `Task` that contains an `Array` that contains the value `4`"

> Function signatures use the `->`

> A function that accepts a string and returns a number would be annotated

> `string -> number`

> When a function can accept a generic type, the letters `a` through `z` are used.

> The below signature says this function accepts one type, and returns another type:

> `a -> b`


> This function takes 2 types and returns the same type as the second argument:

> `a -> b -> b`

> This signature says an array can contain any specific type:

> `Array a`

> Where `a` could be a `number` or a `string` (or any other type).  

> This is a lot like generics in languages like C# or Java, except a lot more powerful and expressive.

> Important to note that `a` and `b` *might* be the same type, but they are not required to be.

> And a `Task` containing a function that accepts an `Array`
> containing a `number` that returns a `Maybe` containing a string would look like

> `Task (Array number -> Maybe string)`

> It is much easier writing those signatures than actually saying them in verbose English

Let us begin the frivolities!

#### Creation:

`Type.of`

```javascript
var flyd = require('flyd')
var Task = require('data.task')

// A stream of values
var stream = flyd.stream().of(2)
//=> Stream(2)

// An asynchronous value
// like a Promise but better
var task = Task.of(2)
//=> Task(2)

// A humble array
var list = Array.of(2)
//=> Array(2)
```


In this API, we will not use constructors because they are not useable in all situations.
Instead we will use a function named `of` that will return a new instance of a given type.
Whether it is a stream, or a task, or anything else we could possibly imagine.

No matter the situation or data type we have a consistent way to instantiate.

#### Transformation:

`Type::map`

```javascript

// number -> number
var double = x => x * 2

stream.map(double)
//=> Stream(4)

task.map(double)
//=> Task 4

list.map(double)
//=> Array 4
```

In this API we can transform values by mapping a function over them.

- In the case of a stream, this map will occur whenever new values arrive.
- In the case of a Task, it will transform the value when the task asynchronously resolves (like a Promise).
- And in the case of a list, the transformation happens immediately.

Note that `map` always returns a new instance of the same type.  It never modifies the source.
Our values must always live in containers of a given type.
This allows the specific inner workings to occur while exposing a shared API

> In Functional Programming a type that has the function `map` is referred to as a Functor.  
For the duration of this post I'll stay away from these sorts of terms and instead say Mappable.
I think the hardest part about learning these systems is learning the terminology.  
But its pretty straight forward to learn those terms when you have a solid understanding of the underlying mechanics.

#### Combining values

`lift( type )`

```javascript
var R = require('ramda')

// Mappable a -> Mappable a -> Mappable a
var add = R.lift(R.add)

// Array number -> Array number -> Array number
add(Array.of(2),Array.of(3)) //=> Array(5)


// Task number -> Task number -> Task number
add( task.of(2), task.of(3) )
//=> Task(5)

// Stream number -> Stream number -> Stream number
add( stream.of(2), stream.of(3) )
//=> Stream(5)

```

`lift` raises a given function into the context of our container type.
It teaches a function how to interact with a stream, or a task, or a list,
or any other contained value that supports this API.

In order for `lift` to work, a type needs to have a method called `ap`.
In the case of array's, there is no internal support, so Ramda fills in the gaps for us.

I will cover exactly how lift works momentarily.
But first, let's see how we can handle errors using this API.

#### Error handling

`Maybe` (Errors are just another datatype)

Maybe is a well known type in functional programming for elegantly handling unsafe and failure states.
We'll drop in a Maybe implementation from the sanctuary library.  We could also drop in folktale or a number
of other implementations.

Maybe will prevent unsafe computations from occurring.

```javascript
var S = require('sanctuary')
var Maybe = S.Maybe
```

Maybe is completely interoperable with the existing API

```javascript
// (3 + 5) ^ 2

// Maybe number -> Maybe number -> Maybe number
add(
    Maybe.of(3)
    ,Maybe.of(5)
)
.map(n => n * n)

//=> Maybe(64)
```

As you can see, we create using `of`, and transform using `map`.  We can also use our lifted `add` function.
We did not need to implement a new `add` function for the new data type.

Sanctuary provides a method called `encase` that will return a Maybe that contains the success or failure state.
Future operations on failed states are ignored, while successful states carry on as usual.

```javascript
function dangerous(value){
    throw new Error(
        "Danger! Danger!"
    )
}

//Make our function safe
S.encase(dangerous)

// pass a value into it
(1)

// Attempt to transform the output
// This never happens though
.map( n => n + 1 )

//=> Maybe number

```

In the above code, our dangerous code throws an Error.  Sanctuary will then recognize that an error has occurred and will no longer perform transformations on the Maybe.

The map after the dangerous code would never have been invoked.  So you can safely write your transformations without worrying about
null checks or catching errors.


Let's make use of our Maybe container code by performing a risky operation: parsing some json.

```javascript
//calls a function on an object
function parseJSON(json){
    return JSON.parse(json)
}

// Maybe string -> Maybe object
S.encase(parseJSON)

// call our safe function with valid JSON
('{"a": "hello" }')

// grab the property `a`
// Maybe {a:string} -> string
.map( obj => obj.a )

//=> Maybe("hello")
```


Everything works well.
We extracted the property `a` from a `Maybe {a:string}` by mapping over the `Maybe string` of the parsed JSON.


Let's try introducing a subtle error.

```javascript
// Make our function safe
S.encase(parseJSON)

// Invoke it with bad inputs
( "{'a': 'hello' }" )

// Attempt to grab the parsed property
.map( obj => obj.a )

```

The string we passed in used single quotes, and this means it is invalid JSON.

Normally we'd get an `Error` with a message like.
`"SyntaxError: Unexpected token"`.  Hopefully we'd have caught the error...

But in the case of our `Maybe`, no error is thrown.  
Our function just returns a Maybe that we can map over.

Notice we are attempting to perform an operation after the error would have occurred.
But this is completely fine, `Maybe.map` won't do anything because the `Maybe` is an Error state.
It is safe to assume you have a value and write your code as if errors do not exist.

You could probably imagine how convenient it would be to not have to write error checks 
throughout your code and instead simply handle the Maybe type.  

You can also probably imagine encoding additional information about the failure within in the Maybe.  
Such a thing exists, it's called an `Either`.

Let's try `encaseEither` which is just like a `Maybe`, 
but gives us some context on why there was a failure.

```javascript
S.encaseEither(
    // If there is an error
    // grab the message property
    // from the error
    error => error.message

    // the unsafe function
    // that will soon
    // return an Either
    ,parseJSON
)

// Pass in some invalid input
( "{'a': 'hello'}" )

// Attempt to transform
// the output
// (Won't happen though)
.map( obj => obj.a )

// => Either("Syntax Error: Unexpected token")
```

The `Either` can be 1 of 2 types: `Left` or `Right`.
`Left` is the error data and `Right` is the success value.
Because our JSON was invalid, our `Either` is `Left`, and any transformations won't occur.
But we can access the error message as it is stored within the data type.

> I personally think the `Left` and `Right` naming is pretty poor.
It translates to a tuple where the first index is the error and the second index is the successful value.
>
    // Left (failure)
    ["Error message", undefined]
>
    // Right (success)
    [undefined, "Some value"]

> A lot of functional programming's terminology is tied up in history, 
> and the names are an homage to that history.
`Left` just means error, and `Right` just means success.

We can handle errors trivially using this API.  Errors are just data with different datatypes.


#### combination

`Type::ap`

So, how does `R.lift` work, really?  What secrets lie beneath?

`lift` simply calls the `ap` method on a given type.
Colloquially, `ap` teaches a function how to interact with a given container type.

In order to demonstrate ap, let's create our own container type.  I'm just going to call it `Type`.
Our type creates a wrapper around a value that allows us to use the API we've been exploring.


```javascript
class Type {
  constructor (value){
      this.__value = value
  }
  static of(value){
      return new Type(value)
  }
  ap (type){
      return type.map(this.__value)
  }
  map (f){
      return Type.of(f(this.__value))
  }
}
```

We can instantiate a type:

```javascript
Type.of(2)
//=> Type(2)
```

We can transform a type:

```javascript
Type.of(2).map( double )

//=> Type(4)
```

And we can combine types:

```javascript
// recall: add has been lifted
add( Type.of(2), Type.of(4) )
//=> Type(6)
```

Now let's imagine we didn't have ramda in our codebase.
How would we combine types together without using `R.lift`

That is where `ap` comes in.

First we teach a function how to interact with our type,
by storing that function in a container just like any other value.
( Functions are values too ya know! )

```javascript
var square = Type.of(
    a => a * a
)

//=> Type (number -> number)
```

Then we can apply that contained function to a contained value.

```javascript
square.ap( Type.of(3) )

//=> Type(9)
```

`ap` calls `map` on a received type, with itself as the transform function.

```javascript
function ap(type){
  // recall our value
  // is a function
  // Type ( a -> a )
  var transformer = this.__value

  return type.map(transformer)
}
```

Ramda's `lift` function dispatches to the `ap` method on the given type.
It also handles some edge cases, like Array's and a few other JS types.

Now, that we have `ap` in place we can use a large part of the Ramda utilities
as if they were written specifically for our custom types!

We do not need to implement a lot of the amazing functionality ourselves.  
And we do not need to constantly wrap and unwrap values 
as we would if we were using a library like Lodash ( [at the time of writing][Lodash and Fantasy Land] )

So, that is our API.  It handles any situation, it's trivial to support,
and if we all support it we can jump straight into using new and exciting data types
that feel immediately familiar.

It turns out this magical API already exists.
It's called the [Fantasy Land](https://github.com/fantasyland/fantasy-land) Specification.

Many popular JS libraries support this spec,
and that allows you to write functions using Ramda that operate over any of these libraries'
types without having to alter your source code.

Here is a great introduction to Container types in the context of Fantasy Land:
https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch8.html

I haven't really covered just how powerful this small API can be,
because I just wanted to focus on how easy it is to learn and apply.
But this API is formiddable.  And the book I linked above will demonstrate this.

Often functional programming can be pretty dry and focus on theory instead of application.
That is why I've written this post without paying much attention to laws and theories.  I think if you
are interested in that stuff you can read the fine print yourself.

I hope that when you are next implementing a new data type you support Fantasy Land as well,
so we can use your amazing code without needing to learn a new API.

Thank you for reading.  I hope you're excited, now that we have the perfect API,
we can solve some *real* problems.

> If you would like to see Lodash support Fantasy Land please vote on this [thread][Lodash and Fantasy Land]

[Lodash and Fantasy Land]: https://github.com/lodash/lodash/issues/2406
