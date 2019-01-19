Refactoring with Arrays
-----------------------

Recently, I posted a snippet of code on Twitter, as I do, and accidentally angered one of the TC39 gods.

I was using a pattern for transforming data that I elaborated on [here](http://james-forbes.com/#!/posts/versatility-of-array-methods) and someone thought it was somewhat upsetting that I [didn't use a ternary](https://mobile.twitter.com/awbjs/status/1085557705371078657).

Putting aside how [no-one really enjoy's anyone else's ternary style](https://github.com/prettier/prettier/issues/737).  And putting aside that "readability" is completely subjective and based largely on familiarity.  There are practical reasons I default to placing a value into an array context when I don't trust the data I'm working with.

The posted example was an `x` that could be nullable, `undefined`, `Infinity`, `NaN`, `-Infinity`, `0`.  A lot of edge cases pop up when formatting numbers.  It's very rare all we ever want to do is run a simple `.toFixed`.  We might want to extract the sign, transform the decimal and the whole numbers separately.  Do we want to comma separate groupings of magnitude, summarise at certain points?  We may have varying responses for the edge cases.  Doesn't help if we accidentally divide by zero either!

I find placing unsafe data in a list of 1 is a great way to encourage safe transforms and inspection with a minimal diff.  It's easy to review, and easy to rollback.  And it remains _flat_.

Let's imagine how the original sample may evolve as requirements change.

```js
[x]
.filter( isFinite )
// Things we might add/remove over time
// .filter( x != 0 )
// .map( x => ({ sign: x > 0 ? 1 : -1, x }))
// .map( ({x, sign}) => 
//   ({ x, sign, dollars: Math.round(x), cents: x - Math.round(x) }) 
// )
// .map( groupByThounsands )
// .map( abbrevToSIUnits )
.map( x => x.toFixed(2) )
.concat('N/A/')
.shift()
```

Notice how flat the code remains, how easy it would be to see the addition and subtraction of patches.  It's also simple to extract lambdas out that only do one thing and/or [name them](https://twitter.com/getify/status/800424033707622400).

#### Real World Problems

So here's some code I'm looking at right this moment.  See it uses a ternary!  It's wonderful.  Except it's breaking.

```js
function getItem(key){
  return typeof localStorage != 'undefined'
    ? JSON.parse(localStorage.getItem(key) || 'null')
    : null
}
```

Turns out the item we are retrieving has a different structure but the exact same name.  I think the simplest solution in this case is to just use a different key.  But for reasons I won't go into, that's not very good UX in this context.  So we need to do a migration from the old structure to the new, if it exists.  If it is the new structure, we'll just use it.  And if it's some unknown or unforseen structure we should use a default.

That could quickly turn into some convoluted logic with nested `if` statements - and a lot of names for transient variables that ultimately make it seem more complex that it actually is.

The pattern we are going to apply is essentially: 

- `filter` replaces `if`. 
- `.concat(x).shift()` is `else` 
- `.map` is transformation.

We can expand on this approach with other array methods.  But this is the core of the pattern.

So let's apply this approach to refactoring.  The first step is to rewrite using an array with the equivalent logic.

I'd like to keep things verbose while refactoring and compress at the end.  As Sandi Metz says: Duplication is far cheaper than [the wrong abstraction](https://www.sandimetz.com/blog/2016/1/20/the-wrong-abstraction).  Refactoring early, or collapsing code into shared filters/maps may seem like quick wins but they may obstruct the correct abstraction from arriving.

Let's temporarily put immediate refactoring concerns to the side.


```js

function getItem(key){
  return [localStorage]
    .filter( x => x != null )
    .filter( x => key in x )
    .map( x => x[key] )
    .concat( 'null' )
    .slice(0,1)
    .map(JSON.parse)
    .shift()
}
```

Despite being longer than the original, this code is far easier to iterate upon within a repl due to it's flat and pure structure.  We can comment out lines and see the results at each interval.  We can really _play_ in a way that's much harder in other styles.


#### Safety

There are additional dangers we should be handling.  For example, what if the key exists in `localStorage`, but the value retrieved is not valid JSON?  This function will crash.  To guard against function's that may throw, we'll use `flatMap` and a helper function `safe`.

```js
const safe = f => x => {
  try {
    return [f(x)]
  } catch (e) {
    return []
  }
}

function getItem(key){
  return [localStorage]
    .filter( x => x != null )
    .filter( x => key in x )
    .map( x => x[key] )
    .concat( 'null' )
    .slice(0,1)
    .flatMap(safe(JSON.parse))
    .shift()
}
```

> If we weren't using `[]` here to indicate failure, it would be difficult to abstract the failure generically.  Inevitably we would litter try catches throughout the codebase.

Think of `flatMap` as a map and a filter at the same time.  Our list will be empty if the JSON couldn't be parsed, if it could, that's the result we get back.  Because `safe` handles _any_ input value for us, we can remove a lot of our prior checks and get the exact same functionality.

```js
const safe = f => x => {
  try {
    return [f(x)]
  } catch (e) {
    return []
  }
}

function getItem(key){
  return [localStorage]
    .filter( x => x != null )
    .map( x => x[key] )
    .flatMap(safe(JSON.parse))
    .concat(null)
    .shift()
}
```

`flatMap` is such a convenient operation in this context.  It expresses so much in such a standard simple way.  It might at first seem inconvenient to place data in a list for transformation, but it's these effortless opportunities to lean on the standard library that makes the justification worthwhile I think.

While we're iterating I would like the reader to imagine each code change as separate commits - imagine that diff.  The majority of the business logic is retained.  Because the operations are separated and atomic there's very little noise in the diff.  It's all relevant.

This isn't true at all in other styles, we might see unrelated lines in a diff because of a change in formatting, nesting, scoping, placement etc.  One could argue that unrelated change may lead to a diff that is less readable.

#### Determining Structures

Some background, this is some real world refactoring here.  The source of the error is migration from one library to another.  They are similar but have distinct structures.

We need to establish which shape the `localStorage` structure is and then convert it to the new structure if possible.  

There are 3 possibilities.

1. The new structure, we'll call `SST` because it uses [static-sum-type](https://gitlab.com/JAForbes/static-sum-type).
2. The old structure, we'll call that `SumType` because it uses [sum-type](https://github.com/JAForbes/sum-type)
3. It's not anything we recognize.  We'll return an empty array for that case.

We'll use some duck typing to establish to a reasonable level of confidence that we're dealing with a particular case.


```js
const safe = f => x => {
  try {
    return [f(x)]
  } catch (e) {
    return []
  }
}

const Schema = {
	name: 'Schema'
	, SST: value => ({ type: 'Schema', case: 'SST', value })
	, SumType: value => ({ type: 'Schema', case: 'SST', value })
	, isSST: x => [x.case, x.type].every( x => x != null )
	, isSumType: x => [x._case, x._name, x._keys].every( x => x != null )
	, infer: x => [x]
		.filter( x => x != null )
		.flatMap( x =>
			Schema.isSST(x)
				? [Schema.SST(x)]
			: Schema.isSumType(x)
				? [Schema.SumType(x)]
				: []
		)
  ,handle: S => ({
	  SST: x => x
		,SumType: x => (
      { case: x._case
		  , type: x._name
		  , values: x._keys
					.reduce( (p,n) => Object.assign(p, {[n]: x[n] }), {})
			}
		)
  })
}

function getItem(key){
  return [localStorage]
    .filter( x => x != null )
    .map( x => x[key] )
    .flatMap(safe(JSON.parse))
    .flatMap( Schema.infer )
    .map( Schema.handle )
    .concat(null)
    .shift()
}
```


Ok so that's a mouthful and it's very domain specific, but essentially it's converting from 1 documented structure, to another.  And if the value fits into neither case, we return `[]` which signifies we had no reasonable response.

The specific business logic of `infer` and `handle` isn't important.  What's important is, we're not using `boolean` at all as an interface.  If the data is valid, we return the data in a context that implies it's valid.  If the response is invalid, we return `[]`.  

We've solved the problem, but more importantly, we've escaped the boolean trap and created a logical reusuable structure to help us perform this migration in other areas of the codebase.  You should try this anytime you have a function that returns `true/false`, try returning `[input]` or `[]`.

It's likely if your boolean function returned true, you'd immediately want to use the input for some other operation.  This approach streamlines that workflow. 

#### Shifting away from unsafe code

Now what's left to do?  Well, `.concat(null).shift()` that's a bit of a smell isn't it?  We've got all this safety and then we give it up at the end by reverting to `null`, using a mutating method no less!

There's a reason though: the original caller code expects `null`, and we don't want to break the caller code.  But, all is not lost.  We can make a safe version of the function, and compose the old unsafe version out of the new safe version.  Eventually we can convert the larger codebase to use the safe version and deprecate the unsafe.

Here goes!

```js

const safe = f => x => {
	try {
	  return [f(x)]
	} catch (e) {
	  return []
	}
}

const Schema = {
	name: 'Schema'
	, SST: value => ({ type: 'Schema', case: 'SST', value })
	, SumType: value => ({ type: 'Schema', case: 'SST', value })
	, isSST: x => [x.case, x.type].every( x => x != null )
	, isSumType: x => [x._case, x._name, x._keys].every( x => x != null )
	, infer: x => [x]
		.filter( x => x != null )
		.flatMap( x =>
			Schema.isSST(x)
				? [Schema.SST(x)]
			: Schema.isSumType(x)
				? [Schema.SumType(x)]
				: []
		)
	,handle: S => ({
		SST: x => x
		,SumType: x => (
			{ case: x._case
			, type: x._name
			, values: x._keys
					.reduce( (p,n) => Object.assign(p, {[n]: x[n] }), {})
			}
		)
	})
}

const getItemSafe = key => o =>
	[o]
	.map( x => x[key] )
	.flatMap( safe(JSON.parse) )
	.flatMap( Schema.infer )
	.map( Schema.handle )

const getItem =
	key => [localStorage]
	.filter( x => x != null )
	.flatMap( getItemSafe(key) )
	.concat(null)
	.shift()

```

We've pulled `localStorage` out of `getItemSafe` because it made our function technically impure because accessing localStorage directly ties out otherwise generic function to a particular browser environment.

Now for the fun part.  I already have `safe` in my existing codebase.  And, that schema code anyway would need to be written irregardless of code style.  So what we're really dealing with is this snippet:

```js
const getItemSafe = o => key =>
  [o]
    .map( x => x[key] )
    .flatMap( safe(JSON.parse) )
    .flatMap( Schema.infer )
    .map( Schema.handle )
```

Seems pretty readable to me.

#### Conclusion and Reflection

Yes ternaries are nice, you use them I use them.  Infact I think we should use them more!  But arrays are really helpful when dealing with unsafe, unstructured data.  We have an _array_ of combinators at our disposal, and we get a nice fluent, flat, composeable interface that encourages purity, clarity and separation of concerns.

It might seem unreadable at first to some.  But so does a bunch of useful things at first (e.g. CSS Selectors).  But, I recommend taking some time experimenting with this approach, I can't ever see a time I'd use something else.

Unless of course, if TC39 ships the `|>` [pipeline operator](https://github.com/tc39/proposal-pipeline-operator).  😉

Thank you for your time.

If you have any thoughts or questions, please reach out on twitter [@james_a_forbes](https://twitter.com/james_a_forbes)

> I'd like to thank [@barneycarroll](https://twitter.com/barneycarroll) for aiding in the refinement of the original draft of this post.