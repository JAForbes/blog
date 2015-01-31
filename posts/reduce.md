Reduce: the genome of algorithms.
=================================

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
var input = _.range(0,100)
var denominator = 3

for(var i = 0; i < input.length; i++){
  if(input[i] % denominator == 0){
    results.push(input[i])
  }
}

```

Reduce lets us forget about the `results` array and the counting variable `i`

```js
input.reduce(function(results,value){
  if(value % denominator == 0){
    results.push(value)
  }
  return results
},[])
```

Flexibility
-----------

Reduce is so flexible, you can define any iterator function in terms of it.

```js

map = function(collection,visitor){
  return collection.reduce(function(results,val){
    results.push( visitor(val) )
    return results;
  },[])
}

filter = function(collection,predicate){
  return collection.reduce(function(results,val){
    var result = predicate(val)
    if(predicate){
      results.push(result)
    }
    return results;
  },[])
}

unique = function(collection,predicate){
  var encountered = {}
  return collection.reduce(function(results,val){
    if(!encountered[val]){
      results.push(val)
    }
    encountered[val] = true
    return results;
  },[])
}
```

Control
-------

I hope this helped explain why Reduce is so powerful.  It is worth getting comfortable with the pattern.

Reduce gives you all the control necessary to implement any iteration algorithm, and allows you to skip a lot of ceremonial variable declarations.