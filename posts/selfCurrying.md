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
