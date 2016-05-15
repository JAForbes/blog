Currying vs Hurrying
====================

For the sake of this discussion, all functions are now aeroplanes.

```js
function Aeroplane(){

}
```

And each Aeroplane can take many passengers

```js
function Aeroplane(
  passenger1
  , passenger2
  , passenger3
){
  return "Taking off! With: "
    + ([]).slice.apply(
        arguments
      ).join(', ')
}
```

To make an Aeroplane take off, you supply a list of passengers.

```js
Aeroplane(
  'Pilot'
  , 'Snake'
  , 'Snake'
  , 'Snake'
)
//=> "Taking off!
//=> With Pilot, Snake,
//=> Snake, Snake"
```

Let's say this Aeroplane was in a _Hurry_ and no-one boarded except the Pilot.

```js
Aeroplane( 'Pilot' )
//=> "Taking off!
//  With Pilot"
```

This plane had to take off without any passengers because it had to stay on a deadline to pick up other passengers.
This Aeroplane was in a _Hurry_.

But what if the plane could wait for the other passengers to arrive.  We call that a _Curried_ Aeroplane.  Which seems bizarre, but the explanation is delicious.

The Patient Aeroplane
---------------------

In plane language: A patient Aeroplane doesn't take off until everyone has arrived.  And when you tell it to Take Off it will not listen
to you.


We can save our current list of passengers in a variable if we want.

```js
pilotSeated =
  Aeroplane( 'Pilot' )
```

We could tell `pilotSeated` to take off as many times as we want, but it will never take off until 2 more passengers are seated on board.

```js
pilotSeated() //=> pilotSeated

pilotSeated(
  'Snake'
  , 'Snake'
)
//=> "Taking off!
//  With Pilot, Snake, Snake"
```

Because everyone on board of the plane is waiting so patiently for the other passengers, the Airline gives everyone on board a free hot curry to tide them over (which seems pretty nice of the Airline but is actually just a clever public relations trick ).

The last passenger to board the plane unfortunately misses out on the curry, because they take off straight away.


---

Some ivory tower functional programmers might tell you that Currying has nothing to do with the food Curry but was instead named after [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry) who was a famous person who did lots of important things.

That may or may not be true.

Currying is totally a thing!
----------------------------

If you want to use currying in real life you can grab the curry function from [Lodash](https://lodash.com/docs#curry)

Or if you want all passengers on all aeroplanes to patiently enjoy their delicious curry, you can try out [Ramda](http://ramda.github.io/ramdocs/docs/) which is like Lodash but in less of a _Hurry_.