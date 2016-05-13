The Perfect API
---------------

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

Type Signatures
> Throughout the post I will be annotating types as `Array 4`. This could be read as:

> "an `Array` that contains the value `4`".

> `Task 'hello'` would be read as

> "a `Task` that contains the value `'hello'`"

> `Task Array 4` would be read as

> "A `Task` that contains an `Array` that contains the value `4`"

> Function signatures use the `->`

> A function that accepts a string and returns a number would be annoted

> `string -> number`

> And a Task containing a function that accepts an Array
> containing a number that returns a Maybe containing a string would look like

> `Task (Array number -> Maybe string)`

> It is much easier writing those signatures than actually saying them in verbose English

Let us begin the frivolities!

#### Creation:

`Type.of`

```js
var flyd = require('flyd')
var Task = require('data.task')

// A stream of values
var stream = flyd.stream().of(2)
//=> Stream 2

// An asynchronous value
// like a Promise but better
var task = Task.of(2)
//=> Task 2

// A humble array
var list = Array.of(2)
//=> Array 2
```


In this API, we will not use constructors because they are not useable in all situations.
Instead we will use a function named `of` that will return a new instance of a given type.
Whether it is a stream, or a task, or anything else we could possibly imagine.

No matter the situation or data type we have a consistent way to instantiate.

#### Transformation:

`Type::map`

```js
var double = x => x * 2

stream.map(double)
//=> Stream 4

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


#### Combining values

`lift( type )`

```js
var R = require('ramda')

var add = R.lift(R.add)

add(Array.of(2),Array.of(3)) //=> Array 5

// Tasks are lazy and async, these computations won't happen until the task is forked
add( task.of(2), task.of(3) )
    .fork(
        console.error
        ,console.log
    )

//=> Task 5
// ( logs 5 to the console)

add( stream.of(2), stream.of(3) )
//=> Stream 5

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

```js
var S = require('sanctuary')
var Maybe = S.Maybe
```

Maybe is completely interoperable with the existing API

```js
// (3 + 5) ^ 2
add(
    Maybe.of(3)
    ,Maybe.of(5)
)
.map(n => n * n)

//=> Just 64
```

As you can see, we create using `of`, and transform using `map`.  We can also use our lifted `add` function.
We did not need to implement a new `add` function for the new data type.

Sanctuary provides a method called `encase` that will return a Maybe that contains the success or failure state.
Future operations on failed states are ignored, while successful states carry on as usual.

```js
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

//=> Nothing

```

In the above code, our dangerous code throws an Error, sanctuary then returns a `Nothing` type.
This means there was a failure somewhere along the way.

The map after the dangerous code would never have been invoked.
`Nothing::map` will never perform an the operation, it just returns a new `Nothing`


Let's make use of our Maybe container code by performing a risky operation: dynamically calling a method on an object.

```js
//calls a function on an object
function method(
    methodName
    ,target
    ,input
){
    return target
        [methodName]
        (input)
}


// S.encase just converts
// an unsafe function
// into a safe function
// S.encase3 is for functions
// that take 3 arguments
S.encase3(method)

// call our safe function
('toFixed', 4, 2)

// prepend the output with a $
.map( R.concat('$') )

//=> Maybe "$4.00"
```


Everything works well.
We called the method 4.toFixed(2) which formats the number to have 2 decimal points.
We then prepend the result with a dollar sign `"$"` using `Maybe::map`.


Let's try introducing a subtle error.

```js
// Make our function safe
S.encase3(method)

// Invoke it with bad inputs
( 'toFixed', "4", 2)

// Attempt to transform
// the output
.map( R.concat('$') )

```

The string `"4"` does not have a method `toFixed()` on it.
Normally we'd get an `Error` with a message like.
"Undefined is not a function".  Hopefully we'd have caught the error.

But in the case of our `Maybe`, no error is thrown, we get a `Nothing` instead.

Notice we are attempting to perform an operation after the error would have occurred.
But this is completely fine, Nothing.map doesn't do anything,
it is safe to assume you have a value and write your code as if errors do not exist.

You could probably imagine how convenient it would be to not have to write error checks throughout your code and instead simply handle the Nothing type.  You can also probably imagine encoding additional information about the failure within in the Nothing.  Such a thing exists, it's called an `Either`.

Let's try `encaseEither` which is just like a `Maybe`, but gives us some context on why there was a failure.

```js
S.encaseEither3(
    // If there is an error
    // grab the message property
    // from the error
    R.prop('message')

    // the unsafe function
    // that will soon
    // return an Either
    ,method
)

// Pass in some terrible input
( undefined, null, null )

// Attempt to transform
// the output
// (Won't happen though)
.map( R.concat('$') )

// => Left "Cannot read..."
```

The `Left`'s value is the error message.  If the type was `Right` it would have been a success.

> I personally think the `Left` and `Right` naming is pretty poor.
It translates to a tuple where the first index is the error and the second index is the successful value.
>
    // Left (failure)
    ["Error message", undefined]
>
    // Right (success)
    [undefined, "Some value"]

> A lot of functional programming's terminology is tied up in history, and the names are an homage to that history.
`Left` just means error, and `Right` just means success.

We can handle errors trivially using this API.  Errors are just data with different datatypes.


#### combination

`Type::ap`

So, how does `R.lift` work, really?  What secrets lie beneath?

lift simply calls the `ap` method on a given type.
Colloquially, `ap` teaches a function how to interact with a given container type.

In order to demonstrate ap, let's create our own container type.  I'm just going to call it `Type`.
Our type does creates a wrapper around a value that allows us to use the API we've been exploring.


```js
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

```js
Type.of(2)
//=> Type 2
```

We can transform a type:

```js
Type.of(2).map( double )

//=> Type 4
```

And we can combine types:

```js
// recall: add has been lifted
add( Type.of(2), Type.of(4) )
//=> Type 6
```

Now let's imagine we didn't have ramda in our codebase.
How would we combine types together without using `R.lift`

That is where `ap` comes in.

First we teach a function how to interact with our type,
by storing that function in a container just like any other value.
( Functions are values too ya know! )

```js
var square = Type.of(
    a => a * a
)

//=> Type (number -> number)
```

Then we can apply that contained function to a contained value.

```js
square.ap( Type.of(3) )

//=> Type 9
```

All ap is doing is calling map on a received type, with itself as the transform function.

```js
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

We do not need to implement a lot of the amazing functionality ourselves.  And we do not need to constantly
wrap and unwrap values as we would if we were using a library like Lodash ( at the time of writing )

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