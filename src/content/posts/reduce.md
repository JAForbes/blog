---
title: "Reduce: the genome of algorithms."
created: 2015-01-19T06:27:37.705Z
featured: false
archived: true
---

First off!  Let me just say, I am not an expert at functional programming (or any kind of programming for that matter).  But perhaps my level of understanding will make this topic more interesting to those that are not ivory tower functional space wizards.

If you want to read someone who knows what they are talking about, you can do so [here](http://www.cs.nott.ac.uk/~gmh/fold.pdf)

A bold claim
------------

Programming has many methodologies and philosophies and space wizardry, but at the end of the day, all we are ever doing is editing the values of some data.

And if your data happens to be in an Array like data structure, you will only ever need one tool to perform these tasks.

That tool is `reduce`.

What is reduce.
--------------

Reduce is a function that lets you remove a lot of repetive fluff that occurs in nearly every algorithm.  There is usually some array of results, or final value we want to boil down to.  There is a loop, which lets us do something to that data every time.  And then there is the actual _something_ that we are doing.

Reduce lets you focus on the _something_ and not on the ceremony.

Examples
--------

Let's say we want to find all the numbers, in a list of numbers, that divide evenly by 3.  One approach may be to use a for loop.

```js
var results = []
var input = [0,1,2,3,4,5,6,7,8,9]
var denominator = 3

for(var i = 0; i < input.length; i++){
  var divisibleByThree = input[i] % denominator == 0

  if(divisibleByThree){
    results.push(input[i])
  }
}

results //=> [0,3,6,9]
```

Reduce lets us forget about the `results` array and the counting variable `i`

```js

var input = [0,1,2,3,4,5,6,7,8,9]
var denominator = 3

input.reduce(function(results,value){

  divisibleByThree = value % denominator == 0

  if(divisibleByThree){
    results.push(value)
  }
  return results

},[]) //=> [0,3,6,9]
```

An aside:
>This may not seem like a big win at first.  But it _really_ is.  Reduce gives us
all the control we need to implement any procedure.  But it doesn't give us control we don't need.

>`reduce` is a mathematical construct.  We are trying to reduce the input to values that divide evenly by three.

>How the computer chooses to iterate over an array, is not relevant in most cases.
In the for loop, we are manually creating the `results`, the counting variable `i`, the while condition, and the increment amount.
And by manually telling the computer how to iterate, we introduce _many_ possibilities of error.

>But, the real value of using `reduce` is not reducing error.
The real value in `reduce` is that it is the ultimate programming building block of algorithms.

>Any iteration algorithm can be constructed in terms of `reduce`. Reduce is the genome of algorithms

>That is what I am going to demonstrate in this post.


What the hell?
--------------

What is going on here?  Perhaps it seems a little unfamiliar and cumbersome.

To explain, let's first look at two other native JavaScript methods; `forEach` and `map`.

`forEach` is the functional cousin of the for loop.  And therefore, should be the most familiar.

`map` is just like `forEach` but it automatically constructs an array for us.  And we'll see how
useful that can be.

`reduce` is just like `map` and `forEach`, but it lets us determine, _where_, _what_ and _when_ we store.

Reduce will change how you think about programming and algorithms.  It allows you to write simpler maintainable code.

### Array::forEach

```js

//Array::forEach isn't responsible for storing your result set.
//We need to handle that ourselves, with this external variable `results`
var results = []

var input = [0,1,2,3,4,5,6,7,8,9]
var denominator = 3

input.forEach(function(value){

  divisibleByThree = value % denominator == 0
  if(divisibleByThree){

    //We've met our if condition
    //Now we can push the matching value into our results
    results.push(value)

  }

})

results //=> [0,3,6,9]
```

`forEach` is some sugar on top of a for loop.  It will call some function
as many times as there are items in your array.  And it will pass each
item in your array to that function.

But it doesn't know or care what we do inside our function.  So if we want to
store some results we need to make sure to set up those results before hand.

This doesn't seem like a big deal, but it is.  It means we can't easily use this function elsewhere.
The function we constructed relies on some external variable called `results`.

### Array::map

`map` solves this problem elegantly, by automatically adding the result of your function to an array.

`map` really shines when you are not filtering values, but transforming values.

```js

triple = function(val){
  return val * 3
}

input.map(triple) //=> [0,3,6,9,12,15,18,21,24,27]

```

But in our scenario, `map` leaves all these undefined values in our `results`.
And now we need to filter them out.

```js
input.map(function(value){

  divisibleByThree = value % denominator == 0
  if(divisibleByThree){

    //We've met our if condition
    //By simply returning it, it is added to our results
    return value

  }

}) //=> [0,undefined,undefined,3,undefined,undefined,6,undefined,undefined,9]
```

### Control


At this point `forEach` may seem like a good option.  But then we are right
back to writing functions that we can't reuse.

We need more control over the internals of our iteration.  But we don't want to
rely on external variables, because then we can't easily reuse our functions.

`reduce` gives us control of what values we store, when we store them, and where they are stored.


Here is the general format:

```js

whereTheyAreStored = []

//our storage variable is the first argument of our function
//the second argument is the current value of the array, just like map/forEach

input.reduce(function(whereTheyAreStored, value){

  //when to store
  if(condition) {
      //what we store
      whereTheyAreStored.push(value)
  }

  //return our storage so the next function can use it
  return whereTheyAreStored;

},whereTheyAreStored)

```

This may seem cumbersome at first (it did to me).  But from reduce you can create
new functions and decide specifically what responsibilities those functions
do and do not have.  `reduce` is the top level abstraction you need.

From there you can pair it back down.

Where were we?
--------------

We were trying to find all the values in a given array, that divide evenly by
three.  Let's take another look at the `reduce` example I gave at the top of this
post.

```js

var input = [0,1,2,3,4,5,6,7,8,9]
var denominator = 3

input.reduce(function(results,value){

  divisibleByThree = value % denominator == 0

  if(divisibleByThree){
    results.push(value)
  }
  return results

},[]) //=> [0,3,6,9]
```

The final argument of `reduce` is _where_ we will store our results.
We have given `reduce` an empty array.  But it could be any type.

Our array is then passed to our function as the first argument.  We have
named it `results`.

We then check if the number is `divisibleByThree`.  If so, we add it to the results.
But that alone isn't enough.  If we want the next iteration to have access to our results
we need to return it at the end of the process.

That is why we `return results`

Filtering
---------

What we are doing is a fairly common process.  We are filtering values.
And in our case, we always want an array as the output.  And we always want
to exclude values that do not meet our condition.

This is done so often, there is actually a native method that already does
this exact process: `Array::filter`.

To demonstrate the usefulness of `reduce`, we will now write our own filter
function on top of `reduce`.  Then we will use our filter function on our `input`

And it will be magical!

```js

filter = function(condition,input){
  return input.reduce(function(results,value){

    if(condition(value)){

      results.push(value)
    }
    return results
  },[])

}

```

`filter` takes two arguments, an input array, and a condition.  The condition
is a function that returns `true` or `false` depending on the given value.

Let's write our condition function:

```js
divisibleByThree = function(value){
  return value % 3 == 0;
}

divisibleByThree(4) //=> false

divisibleByThree(900) //=> true

```

Let's put them together.

```js
var input = [0,1,2,3,4,5,6,7,8,9]

filter(divisibleByThree,input) //=> [0,3,6,9]

```

The journey so far
------------------
You are still here!  We've come a long way.  But maybe we have come so far that
we have forgotten how this all began.

We have gone from for loops to filters.  We have equivalent functionality,
one expresses the problem in terms of counting variables and while conditions.

The other in almost mathematical precision.

To be fair, we will let the for loop use our condition function.  But by comparing
them, hopefully we can see how valuable `reduce` has been for us today.

```js
var results = []
var input = [0,1,2,3,4,5,6,7,8,9]

for(var i = 0; i < input.length; i++){

  var value = input[i]

  if(divisibleByThree(value)){
    results.push(value)
  }
}

//vs

filter(divisibleByThree, input)


```

It is not simply that the bottom version is easier to read.  The two big selling points
for writing code in the second style are:

1. Purity: no dependencies.
2. Composition: plug our functions together like lego!

### Purity
We can reuse our `divisiblyByThree` function anywhere.  It has no dependencies!

If we wanted to have an array of booleans we could use `map` instead of filter.

```js
input.map(divisibleByThree) //=> [true,false,false,true, ...]
```

### Composition

We can use the output of one function as the input to another function.
In my opinion, this is all we do in programming anyway.

```js
([0,1,2,3,4,5,6,9])
  .filter(divisibleByThree) //=> [0,3,6,9]
  .map(multiplyByTen)  //=> [0,30,60,90]
  .map(String) //=> ["0","30","60","90"]
  .join(" --- ") //=> "0 --- 30 --- 60 --- 90"


```

Imagine doing the above in a for loop.  And then deciding to change one of the steps
later.  Would it be as simple as commenting out a line?

Flexibility
-----------

`reduce` is so flexible, you can define any iterator function in terms of it.

If you would like to try out some of this reduce space wizardy, you could go to the [lodash docs](https://lodash.com/docs)
and try to write your own version of any of the Array functions using `reduce`.

A few good ones to try out: `unique`, `compact`, `flatten`.

You'll probably uncover a lot of common patterns, and understand your own code
more than ever before.

Control
-------

I hope this helped explain why Reduce is so powerful and why it is worth getting comfortable with.

`reduce` gives you all the control necessary to implement any iteration algorithm, and allows you to skip a lot of ceremonial variable declarations.

It allows you to build complex systems via simply plugging together lego brick functions like `divisiblyByThree`.  It also lets you write your
programs as pipes of transforming data.  They are easier to edit, understand and make programming better for everyone!

