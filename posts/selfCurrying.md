Self Curried Functions
======================

Manually specifying the behaviour of your function given the nature of its received arguments.

```js
distance = function distance(a, b){
  if(!a) return distance
  if(!b) return distance.bind(null, a)
  var dx = b.x - a.x
  var dy = b.y - a.y

  return Math.sqrt( dx * dx + dy * dy )
}

[{x:0, y: 4}].map( distance({x:3, y:0}) ) //=> [5]

distance({x:3, y:0}, {x:0, y: 4}) //=> 5

distance() //=> function distance(){ ... }
```

A more traditional approach to currying could be written equivalently as:

```js
distance = _.curry(function distance(a, b){
  var dx = b.x - a.x
  var dy = b.y - a.y

  return Math.sqrt( dx * dx + dy * dy )
})
```

###Pros / Cons

The more traditional approach keeps the function intent separate from the currying implmentation.  This is definitely an advantage in most contexts.  But the self currying approach has its own advantages.

####Pros: 

- Explict behaviour
- Easier to debug
- No dependencies on external libraries
- Custom behaviour depending on arguments passed

####Cons:

- Less robust.
- Possibly suprising behaviour
- Reduced clarity
 
###Custom currying behaviour

At first glance, custom currying behaviour could seem like an idea that lacks a practical application.  
However, a practical use case could be returning a distance of `Infinity` when no arguments are received.

```js
distance = function distance(a, b){
  //if(!a) return distance
  if(!a) return Infinity
  
  if(!b) return distance.bind(null, a)
  var dx = b.x - a.x
  var dy = b.y - a.y

  return Math.sqrt( dx * dx + dy * dy )
}
```

Now the distance function has a similar behaviour to `_.min() //=> Infinity`.  This may violate the principle of least suprise though.

###Conclusion

At the end of the day this may just be a neat party trick, or useful when rapidly prototyping.  Hopefully in sharing it, this technique could be useful to someone.  It may even shed some light on what currying is, and how it works.

Thanks for reading.
