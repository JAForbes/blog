---
title: How to talk to a computer
subtitle: You can save a lot of time by working in the REPL
created: 2016-09-11
featured: false
archived: false
tags:
  - ops
  - FP
  - programming
  - dates
---

How to work within the REPL
---------------------------

Like most worthwhile things in programming, the REPL is a useful, powerful tool - with a terrible name.
But once the unfamiliarity wears off, the name becomes endearing.

> REPL means Read - Eval - Print - Loop, which is exactly how a REPL operates!

We write programs with the intention of running them.  The traditional usage is writing some code, saving it to a file
and executing it against some binary.  If it's a compiled language that binary will emit some executable file, and if it is a
strongly typed language, you'll get some errors when attempting to compile if your types do not line up.

These steps can be considered friction; unnecessary separation between writing and executing; human and computer.

The REPL on the otherhand blurs the line between writing and executing.  Instead of preparing all statements and expressions ahead of time in order to get a final computation, the repl waits for your input after each evaluation.
It's more like a conversation with the computer, where you are an active participant.

By reducing latency between program and programmer we can often iterate on our design, find, and solve problems more readily.

But I've seen many programmers struggle with the conversation.  How does one talk to the computer in a practical manner?
It is such a radically different workflow that doing anything non-trivial in the terminal can seem frivolous.

Just now, I was working on something non-trivial within the browser repl.  And I thought this was a perfect opportunity to demonstrate the principles applied throughout the conversation.

> I encourage you to open your browser console while reading this article.  To open your REPL in most browsers you can hit the F12 key or Ctrl/Command + Shift + J

#### Timezones and User Input

Programming dates can be tricky.  Humans think of time in bitesize non-uniform abstractions.
These abstractions require constant conversion to do any kind of useful calculation.

Dates also mean different things depending on where you are on the globe.  Most phyisicists agree that [spacetime](https://en.wikipedia.org/wiki/Spacetime) exists, and therefore time exists outside our own abstractions.

But minutes, hours, days, months and years are human constructs.  And (while meaningful to us meat bags) they are inefficient for computers to store and process, and the conversion between different units can be error prone for us programmers.

Programmers have come up with many approaches to solve this problem.  Usually the answer is standardized formats that are convenient to process.

Greenwich Mean Time (GMT) and Coordinate Universal Time (UTC) are the basis for most other international date formats.   Both standards are interchangeable but the latter is the standard used and maintained by the scientific community.  

The part of UTC we are interested in is storing dates in a Universal Timezone.  That timezone, arbitrarily is Greenwich England.  From there we count backwards or forwards around the globe to localize a date.

The Unix Epoch is the number of seconds since Midnight, January 1st, 1970 at Greenwich, England.  Any date in history can be represented as either a negative or positive number in this format.  Adding and subtracting dates in this format is trivial, it is just a number.  And by agreeing on a universal time zone we can always add or subtract the relevant timezone offset to render a local date to the user on the given system.

The ISO 8601 format is a standard method for representing dates as text.  The unix epoch, written in ISO 8601 looks like this:

```
1970-01-01T00:00:00:00.000Z
```

And we can truncate that at any juncture, it will still be an ISO String.  So this is an ISO formatted date with day precision

```
1970-01-01
```


The `Z` stands for the Zero timezone.

> You might have heard the military talk about "Zulu" time.  This is just the phoenetic alphabet employed in combination with UTC.

With these standard formats in our toolbelt we can engage in conversation with our REPL.

#### Talking to Javascript's Date object

The date constructor accepts a unix timestamp as input when parsing dates.  
Let's see if we can generate the Date object 30 years in the future from the epoch: 2000-01-01T00:00:00:00.000Z

First we'll need the number of seconds in a day:

```js
24 * 60 * 60 
  + 'seconds in a day' 
//=> "86400 seconds in a day"
```

`86400` seconds in a day.  So now we just need to multiply that by the number of days in a year, and then multiply that by 30 to get our date.

```js
var DAY_SECONDS = 86400
var YEAR_DAYS = 365

DAY_SECONDS 
  * YEAR_DAYS 
  * 30
//=> 946080000
```

Now that we have the number of seconds since the unix epoch, we can pass it to the Javascript Date constructor to test our assumption.
We want to get the date January 1st 2000, Midnight

```js
var DAY_SECONDS = 86400
var YEAR_DAYS = 365

var SECONDS_30_YEARS = 
  DAY_SECONDS 
  * YEAR_DAYS 
  * 30

new Date(
  SECONDS_30_YEARS
)
.toISOString()
//=> "1970-01-11T22:48:00.000"
```

November 1970? That isn't even close.  We've barely travelled into the future at all, instead of travelling 30 years, we've travelled 10 months.
How embarrassing.

Let's read the documentation for the Date constructor, and get to the bottom of this:

> Integer value representing the number of milliseconds since 1 January 1970 00:00:00 UTC (Unix Epoch; but consider that most Unix time stamp functions count in seconds).

[Mozilla Developer Network](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date)

So, Javascript has a special version of the Unix Epoch, it counts in milliseconds instead of seconds.

All we need to do, is multiply our existing assumption by 1000 and we should zoom forth 30 years in the future.

```js
var DAY_SECONDS = 
  86400
  
var YEAR_DAYS = 
  365

var SECONDS_30_YEARS = 
  DAY_SECONDS 
  * YEAR_DAYS * 30

var MILLIS_30_YEARS
  SECONDS_30_YEARS 
  * 1000

new Date(
  MILLIS_30_YEARS
)
.toISOString()
//=> "1999-12-25T00:00:00.000Z"
```

> These excerpts are always the complete example, you can copy+paste the extract and it will evaluate to the same result that is rendered here.  Keeping our REPL as stateless as possible will make life easier later, so we will never rely on ambient variable and function definitions.

1999? That is *much* better, but still not the answer we were looking for.

Let's see how far off we were from the expected value.

```js
var DAY_SECONDS = 
  86400

var YEAR_DAYS = 
  365

var SECONDS_30_YEARS = 
  DAY_SECONDS 
  * YEAR_DAYS * 30

var MILLIS_30_YEARS =
  SECONDS_30_YEARS 
  * 1000

;(
    new Date(
      '2000-01-01'
    )
    - new Date(
      MILLIS_30_YEARS
    )
)
  / DAY_SECONDS 
  / 1000
  + ' days'
//=> "7 days"
```

Our calculations were off by exactly 7 days.  
Ah yes! We've forgotten leap years.  So every 4 years we need to add an extra day.

We can simply divide 30 by 4 to get the number of extra leap days.  
We'll use `Math.floor` to simulate integer division so we have whole days only.

```js
Math.floor(
  30 / 4
) == 7
//=> true
```

Great!

Now we can confirm our hypothesis.

```js
var DAY_SECONDS = 
  86400
  
var YEAR_DAYS = 
  365

var SECONDS_30_YEARS = 
  DAY_SECONDS 
  * YEAR_DAYS 
  * 30
  + ( 
    Math.floor(
      30/4
    ) 
    * DAY_SECONDS 
  )

var MILLIS_30_YEARS =
  SECONDS_30_YEARS 
  * 1000
  
new Date(
  MILLIS_30_YEARS
)
.toISOString() 
  == "2000-01-01T00:00:00.000Z"
//=> true
```

#### Users and Dates

So even in performing such a simple task we've uncovered 2 items of confusion.

1. Javascript's Unix Epochs are measured in milliseconds, not the standard seconds.
2. When adding dates together we need to account for Leap Years

Reflect on the conversation we had with the computer so far.

```
Us: A day is 24 * 60 * 60

Computer: Yeah that is 86400 seconds

Us: Ok great, so a year in seconds is 
365 * 86400 and 30 years as seconds 
is 365 * 86400 * 30

Computer: Seems right, that is 
946080000 by the way.

Us: Let's prove our hypothesis by
parsing our number to `new Date(...)`

Computer: Hmmm turns out that number
computes to be only 10 months

Us: Oh! The documentation says 
Javascript takes milliseconds 
instead of seconds so we need to
multiply by 1000 first

Computer: Much better, but not 
exactly 30 years in the future.

Us: Leap years!
Computer: BINGO!
```

I've anthropomorphised the computer a little for flavour, but the relationship is: we make statements, and the computer tells us whether or not they are accurate.  But the computer doesn't actually know what is and isn't a right answer.  So we need to frame our statements as assertions.

e.g.

```
2 + 2 == 4
//=> true
```

By framing our statement as a boolean expression we enable the computer to actually determine if our statement is correct.


#### Multiple results

The REPL only ever gives us 1 answer.  The final expression evaluation.  So how do we test multiple conditions, we could use `console.log` but we can also take advantage of simple data structures.

I like to test multiple results via an array expression.

```js

;[
  'James'.toUpper() 
    == 'JAMES'
  ,'JAMES'.toLower()
    == 'james'
  ,'james'.split('')
    .map( 
      s => 
        s.charCodeAt() 
    )
    .map(
      String
        .fromCharCode 
    )
    .join('')
    == 'james'
] //= [true, true, false]
```

We can take advantage of javascript's array functions `some` and `every` to see if `some` of our tests pass, or `every` one of our results is true.

```js
var tests = [
  'james'.split('')
    .map( 
      s => s.charCodeAt() 
    )
    .map( 
      String
        .fromCharCode 
    )
    .join('')
    .length == 5
    
  ,'james'.split('')
    .map( 
      s => 
        s.charCodeAt() 
    )
    .map( 
      s => 
        String
          .fromCharCode(
            s
          ) 
    )
    .join('')
    .length == 5
]

tests 
//=> [false, true]

tests
.every(Boolean) 
//=> false

test
.some(Boolean) 
//=> true
```

> The initial test fails.  An exercise for the reader.

#### Two way date conversions

Recall that computers tend to store dates in a universal timezone for ease of comparisons and conversions.
Obviously we want our users to be able to work within their own time zone in a date format they are familiar with.

So in order to store user input we need to be able to convert a users local timezone input into a universal timezone output.
And when we render our stored universal timezones to the screen, we will want to convert them to the users local timezone.

The Javascript Date object has a function for obtaining the users timezone offset.

> Date::getTimezoneOffset()
> Returns the time-zone offset in minutes for the current locale.

[Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset)

It is interesting that the timezone offset is stored as minutes (as opposed to hours, seconds or milliseconds), and that the polarity of the offset is reversed.

> The time-zone offset is the difference, in minutes, between UTC and local time. Note that this means that the offset is positive if the local timezone is behind UTC and negative if it is ahead. For example, if your time zone is UTC+10 (Australian Eastern Standard Time), -600 will be returned. Daylight saving time prevents this value from being a constant even for a given locale.

Let's try this out in the console.  

> My timezone offset might be different to yours if you live in another part of the world.

```js
new Date()
  .getTimezoneOffset()
//=> -600
```

To avoid differences in timezones, we'll just hard code the Sydney, Australia timezone offset as a variable.


```js
var TZ_OFFSET = -600
var UNIX_EPOCH = 0

var d = new Date(UNIX_EPOCH) 

d.setMinutes(TZ_OFFSET)

d.getHours() == 24-10 
//=> false
```

`d.getHours()` will fail in most time zones here, because it is returning the number of hours in the local timezone.
Instead we want `d.getUTCHours()`, these subtle API mismatches are extremely hard to track down when you are testing a large project instead of conversing with your machine line by line.

```js
var TZ_OFFSET = -600
var UNIX_EPOCH = 0

var d = new Date(UNIX_EPOCH) 

d.setMinutes(TZ_OFFSET)

d.getUTCHours() == 24-10
//=> true
```

Because `setMinutes` mutates the date object, it is hard for us to accurately test our assertions.
We are assuming that `d.getUTCHours()` was initially returning `0` in order for the subsequent assertion to be valid.

In the future, when we want to write multiple transformations on the same date, we'd need to take into account previous transforms.
It would be much easier to keep track of these calculations if `setMinutes` gave us a new Date as a result, instead of modifying an existing one.

Let's write a `setMinutes` function that always returns a new Date().

```js
var setMinutes = 
  (offset,date) => 
    new Date(date)
      .setMinutes(
        offset
      )

var d = new Date()
setMinutes(1,d)
  .getMinutes() == 1
  
//=> TypeError: 
//=> ...getMinutes 
//=> is not a function
```

Unfortunately `setMinutes` returns a millisecond unix timestamp instead of a Date object, so calling a method on the result
resulted in a Type error.  

Here is a quick, albeit ugly solution.

```js
var setMinutes = 
  (offset,date) => 
    new Date(
      new Date(date)
        .setMinutes(offset)
    )

var d = new Date()
setMinutes(1,d)
  .getMinutes() == 1
//=> true
```

Our goal is to convert to and from local and universal dates.  So lets write some functions that do exactly that.

```js
var setMinutes = 
  offset => date => 
  new Date(
    new Date(date)
      .setMinutes(
        offset
      )
  )

var TZ_OFFSET = -600
var toLocal = 
  setMinutes(
    TZ_OFFSET
  )
  
var fromLocal = 
  setMinutes(
    -TZ_OFFSET
  )

var TZ_OFFSET_MINUTES = 
  -600
  
var TZ_OFFSET_HOURS = 
  TZ_OFFSET_MINUTES 
  / 60
  
var UNIX_EPOCH = 0

var d = 
  new Date(UNIX_EPOCH) 

;[
  d.getUTCHours() == 0
  ,toLocal(d).getUTCHours() 
    == (
      24 
      + TZ_OFFSET_HOURS
    ) % 24
  ,fromLocal(d).getUTCHours() 
    == -TZ_OFFSET_HOURS
]
  .every(Boolean)
  
//=> true
```

We are successfully converting to and from local and universal dates.


#### HTML Woes

The user entered dates are unlikely to be entered directly via the Javascript console (wouldn't that be nice!)
They are more likely to come from a HTML date input.

Our Universal dates will also probably be coming from a database.  And will probably be sent over the wire as a unix timestamp.

So lets simulate the complete cycle.  API call, Rendering, User Entry, Saving to the Database.  

We need to convert to and from local and universal timezones where appropriate.

We'll make our final tests a little more verbose to keep track of all the translations.

```js
var setMinutes = 
  offset => date => 
  new Date(
    new Date(date)
      .setMinutes(
        offset
      )
  )

var TZ_OFFSET = 
  -600
var toLocal = 
  setMinutes(TZ_OFFSET)
var fromLocal = 
  setMinutes(-TZ_OFFSET)

var FROM_API = 
  () => 
    new Date(0)
      .getTime()

  
var API_TO_HTML = 
  unixtime => 
    toLocal(unixtime)
      .toISOString()
      .slice(0,10)
  
var HTML_TO_JS_EVENT = 
  isoString => 
    fromLocal(
      new Date(
        isoString
      )
    )


;[
  
,(FROM_API() == 0 ?'✔':'✘')
+ ' Initial API value was UNIX Epoch'

,(API_TO_HTML( FROM_API() )
  == '1969-12-31' 
    ? '✔' : '✘')
 + ' Universal date was' 
 + ' converted before'
 + ' rendering to HTML' 

,(HTML_TO_JS_EVENT('1964-03-01')
  .getUTCHours() == 10 
  ? '✔' : '✘' )
+ ' Local rendered date was'
+ ' converted to universal'
+ ' date before being sent'
+ ' to the server'

,(HTML_TO_JS_EVENT(
  API_TO_HTML(
    HTML_TO_JS_EVENT(
      '1964-03-01'
    )
  )
  ).getUTCHours() == 10 
  ? '✔' : '✘' 
  ) + ' Round trip through' 
  + ' pipeline maintained' 
  + ' timezone offset integrity'

].join('\n')
// => 
// ✔ Initial API value was ...
// ✔ Universal date was conv...
// ✔ Local rendered date was ...
// ✔ Round trip through pipe ...
```

The HTML input expects an ISO formatted string that is 10 characters long (YYYY-MM-DD).  
Despite the fact that an ISO Universal string could actually fall on a different date than a user entered date in the rendered local format, the HTML will always maintain the same date.

As an example, if Australian's write their dates as `11/09/2016`, the date value will be stored on the input as the string `"2016-09-11"` even though 10 hours of the Australian day is a different date to Greenwich, England.

This makes sense because the date input has no notion of hours.  So it has no justification or legitimate measure for translation.

Which raises the question?  Why convert at all?  Why not just store the user entered date in much the same manner - ignoring hours and minutes.  Well you can, but you will be limiting the capability of your application.  For example, you will have trouble if you ever ask the user to specify a more specific time in future, or if other systems in your infrastructure or system should be activated at a specific local time offset from the user entered date, or if two users in different timezones are collaborating.

It's always better to play it safe, store your dates as UTC or as a unix timestamp.  Timezones are a user matter, leave it to the user interface to handle.

#### Bring it back home

We've now explored how to parse and transform local and universal dates in our given language.  We now need to translate this work back to our application.

This is actually trivial because of the particular way we've been interacting with the repl.

1. We always wrote stateless functions
2. We always evaluated our entire session from scratch each time (no ambient variables or functions)

We can literally move our code verbatim into functions and export them as modules.

```js
//date-conversions.js

var setMinutes = 
  offset => date => 
    new Date(
    new Date(date)
      .setMinutes(
        offset
      )
  )
  
var TZ_OFFSET = 
  new Date().getTimezoneOffset()

var toLocal = 
  setMinutes(
    TZ_OFFSET
  )
var fromLocal = 
  setMinutes(
    -TZ_OFFSET
  )

export default {
  setMinutes
  ,toLocal
  ,fromLocal
}
```

We can also convert our conversation into a simple automated test suite.

Let's convert our existing code to tape tests.

```js
//test.js

import {setMinutes} 
  from './date-conversions.js'

import test from 'tape'

var TZ_OFFSET = 
  -600
var toLocal = 
  setMinutes(
    TZ_OFFSET
  )
var fromLocal = 
  setMinutes(
    -TZ_OFFSET
  )

var FROM_API = 
  () => new Date(0)
    .getTime()

var API_TO_HTML = 
  unixtime => 
    toLocal(unixtime)
      .toISOString()
      .slice(0,10)
  
var HTML_TO_JS_EVENT = 
  isoString => 
    fromLocal(
      new Date(
        isoString
      )
    )

var tests = [
  
,[FROM_API()
  , 0
  ,' Initial API value was UNIX Epoch'
]

,[API_TO_HTML( FROM_API() )
  ,'1969-12-31' 
 + ' Universal date was' 
 + ' converted before'
 + ' rendering to HTML' 
]
,[HTML_TO_JS_EVENT('1964-03-01')
  .getUTCHours()
  ,10 
  ,' Local rendered date was'
  + ' converted to universal'
  + ' date before being sent'
  + ' to the server'
  ]

,[HTML_TO_JS_EVENT(
  API_TO_HTML(
    HTML_TO_JS_EVENT(
      '1964-03-01'
    )
  )
  ).getUTCHours() == 10 
  ,' Round trip through' 
  + ' pipeline maintained' 
  + ' timezone offset integrity'
  ]
]

test('Date conversions', t => {
  
  t.plan(tests.length)
  
  tests
    .forEach(
      (...args) => t.equal(...args)
    )
})
```

Now our larger application can benefit from the conversation we've just had with our machine.

#### Programming is fraught with danger

Some programmers write tests to verify some code is working as we write it.  Test Driven Development is all about defining your programs behaviour with some failing tests before writing the actual business logic.  The tests then (supposedly) serve as some pseudo documentation and give the developer an interactive, directed experience similar to a REPL.

When the tests pass, they can effectively know they've finished their work.

Other programmers achieve much the same thing with a type system.  By defining possible behaviours and application states via union and intersection types.  This has a similar flow, the program won't compile if invalid business logic is written.

Interacting with a REPL is just another tactic with similar benefits and trade offs.  The key advantage working in the REPL brings is not having to initially define your scope or problem domain.  In the past I've found myself frozen while trying to define tests or types because I am not 100% sure what my solution should be yet.

Having a casual chat with the computer is a nice way to begin that process, and translating later to other processes (when needed) is a breeze.

Using the REPL for serious work benefits from the discipline I've attempted to demontrate in this post.  

Stateless functions and avoiding ambient variable access mimics modular code you will eventually need to write.  And it is easier to read and iterate upon during your hopefully fruitful conversations.

So I encourage you to chew the fat with your new binary chomping comrade.  Enjoy!
