---
title: Currying vs Hurrying
created: 2014-11-12T11:18:49.210Z
featured: false
archived: false
---

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

```js
function Aeroplane(pilot, passenger1, passenger2, passenger3){
  let argList = ([]).slice.apply(arguments)
  if (argList.length < Aeroplane.length) {
    return (...args) => Aeroplane(...argList, ...args)
  }
  return 'Taking off with ' + argList.join(', ')
}
```

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

Update: An addendum
-------------------

Note, this is not how you'd curry functions in practice.  The function in this example self-curries.  You'd normally either manually define the function as a series of unary functions or use a utility to curry a regular multi argument function.

```js
// Manual currying
const Aeroplane = pilot => passenger1 => passenger2 => passenger3 =>
  'Taking off with: ' = [pilot, passenger1, passenger2, passenger3].join(', ')

AeroplaneCurried('Pilot')('Passenger 1')('Passenger 2')('Passenger 3')
// "Taking off with: Pilot, Passenger1, Passenger 2, Passenger 3"

// Auto currying
import { curry } from 'ramda'

function Aeroplane(pilot, passenger1, passenger2, passenger3){
  'Taking off with: ' = [pilot, passenger1, passenger2, passenger3].join(', ')
}

const AeroplaneCurried = curry(Aeroplane)

AeroplaneCurried()()('Pilot')()('Passenger 1', 'Passenger 2')()()('Passenger 3')
// "Taking off with: Pilot, Passenger1, Passenger 2, Passenger 3"
```

Prior to arrow functions being introduced to JS I tended to use auto currying, but these days I prefer explicitly manually curried functions.  This article was originally written in 2014 when arrow functions were not yet available in most JS contexts without explicit transplitation.

I've since moved away from using auto currying because I've found it can lead to surprising behaviour [when function definitions change but callsites don't](https://github.com/JAForbes/sum-type/issues/4).

Explicit/manual currying doesn't have this drawback.  But I find myself using manual currying less and less and instead using more [imperative code in sequestered code blocks](https://github.com/JAForbes/pr-release/blob/next/lib/index.js#L1559).

Part of the value of currying and partial application is to apply a similar set of work to a set of inputs.  Auto currying does not play well with the built in `Array::map` as it passes in `index` and `list` as 2nd and 3rd arguments.  And `Array` methods do not work so well with `async`/`await`.

These are not faults of currying, more a compatibility issue.  For my particular taste in JS; I find myself drawn towards using something as close as possible to the platform, even if I don't agree with the design decisions.  I have no qualms using that platform in my own way, but adding too many layers of abstraction requires a stronger foundation than JS can provide.

I'm also a strong advocate of the `|>` (pipeline operator) landing in JS in whatever form.  I feel like when (if) that lands it will likely not support unary functions out of the box.  We can pretend TC39 isn't TC39, but as someone who has done that for many years and been continually disappointed I advise against that.

Finally, I am one of those developers who really doesn't like logs and would prefer to step through in a debugger or use something like [honeycomb](https://honeycomb.io) on the server.  A lot of FP patterns do not work so well with the debugging tools.  You end up stepping through a lot of abstract functions (including `R.curry`) repeatedly, rarely seeing your own code because it was not explicitly invoked by your callsite but by a library.

So should you use currying, it really depends on your codebase.  I still use Ramda often, but I rarely use their auto currying.  I instead choose Ramda because the API design is less surprising and more principled than Lodash.

I'd like to say more on this topic as I think it can be easily misconstrued that I am saying these approaches have no value, but they do!  If you look at my imperative code you'll see it is scoped mutation, expression oriented.  When an obvious block of reusable functionality arises, I factor it out as functions.  If I can make those functions polymorphic I will.  I feel I am using FP principles every day, and most of them are greatly informed by lessons people like [Scott Sauyet](https://github.com/CrossEye) have taught me.

I'd like to write more on this in future.  And it seems strange to add such a long addendum to such an old post.  But it is something I've felt like saying for a while and this felt like an appropriate place to start.

The challenge is, to learn these valuable concepts you often come up against struggles that do subside, that are sourced from unfamiliarity.  It is hard to differentiate legitimate road blocks from temporary struggles with foreign concepts.  I don't see a simple solution to that problem, and I guess that is what makes programming so interesting.