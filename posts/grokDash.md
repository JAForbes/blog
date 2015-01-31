Grokking Lodash
===============

Lodash and UnderscoreJS have become ubiquitous in Javascript projects ([and other languages too!](http://underscorejs.org/#links)).

But beyond, `map` and `filter` what wonders lie beneath the humble `_`?  I am here to shed some light on many of the functions found in Lodash.  And explain when they can be useful.

__If you feel very confident with Underscore's API, then this article may not be for you.  Perhaps you can help identify any mistakes and make suggestions.__

Real Problems
-------------

To demonstrate the usefulness of these libraries, I'll try to make each example's scenario as realistic as possible - to ease the transition from learning to practical use.


####`_.defer`: call a function, after all the other functions have finished being called.


```javascript
_.defer(function(){
  console.log(1)
})
console.log(2)

//> 2
//> 1  <--- 1 came _after_ 2 because it was deferred.

```

__The Scenario__: You are generating some HTML.  At the end of the function you must return a html string so other
processes in your app can make use of the HTML before being converted to a DOM element.

__The Problem__: You'd like to bind some events to the HTML when it is finally rendered, but the HTML will only become a DOM element after this function is called.

__The Solution__: Defer the call to bind the events

```javascript
function template(elements){
  var html = _.map(elements,function(el){
    var html = [
      '<a href="',el.href,'" >',
        '<p>',el.body,'</p>',
      '</a>'
    ].join('')

    //bind the click event to this element after this function is called.
    _.defer(function(){
      $(el.class).click(el.click)
    })

    return html;
  })

  return html.join('');
}

var elements = [
  {
    href="https://github.com",
    class: 'github',
    body: "Github: Social Coding" ,
    click: function(){ /*...*/ }
  },
  {
    href="https://google.com",
    class: 'google',
    body: "Google: A Search Engine",
    click: function(){ /*...*/ }
  }
]

template(elements)
//=> <a href="https://github.com"><p>Github: Social Coding</p></a> ...
```

There of course are less foreign ways to approach this problem.  A simple solution would be to find wherever the html is finally converted to an element, and then bind the events at that stage.

But at that stage -  how we will we know there are any events to be bound?  And where is that information stored?

By using `_.defer` our function can obey the API of returning a string.  It has all the information it needs to bind the events there.  So we have separated concerns, and the rest of our app doesn't need to worry about babysitting these elements.

#### `_.difference`: find out what has been added or removed


__The Scenario:__ You work at a blogging service, and you have to write the code that submits the user's tag edits to the server.

__The Problem:__ You can't simply replace the tags in the database with the new fields, as multiple devices, or multiple users could be editing the same tags at the same time.

__The Solution:__ If you send to the server which tags were added, and which were removed, the server can then accept multiple requests and resolve the actual list of tags.  This final list can then be written to the database.

```javascript
var before = ['interesting','funny','political']
var after  = ['interesting','satire','political']

diff = function(before,after){
  return {
    added: _.difference(after,before), //of the values in after, what isn't in before
    removed: _.difference(before,after) //of the values in before, what isn't in after
  }
}

diff(before,after)
//=> { added: ['satire'], removed: ['funny'] }

```

By not implementing the `difference` code yourself, the heart of your algorithm has automatically been documented and tested.
And by using the abstraction of `_.difference`, the code is easier to read.  We haven't bored the reader of our code with for loops, and temporary iteration variables.  We've declared we just want the _difference_ between the past and the present.

#### `_.intersection`: Find common elements in multiple arrays.


__The Scenario:__ You are now writing the server code that accepts a series of simultaneous tag edits, and turns them into a new final list of tags for the blog post.

__The Problem:__ You need to identify if there are any conflicts in the edits that have been submitted.

__The Solution:__ Use `_.intersection` to find if there are any common terms in the removed and added lists.

```javascript
//these are the edits requested by the clients
var edits = [
  {
    added: ['satire','political'],
    removed: ['funny']
  },
  {
    added: ['funny'],
    removed: ['satire']  //satire and funny are both added _and_ removed
  }
]

//get a list of all the added tags
var allAdded = _.flatten(
  _.pluck(edits,'added')
)
//get a list of all the removed tags
var allRemoved = _.flatten(
  _.pluck(edits,'removed')
)

//identify any common elements in removed and added
var conflicts = _.intersection(allAdded,allRemoved)

//if conflicts has a length > 0 - we have to throw an error.
if ( conflicts.length ){
  throw 'Conflicts found! [' + conflicts + '] were requested to be added and removed!'
}
```

A brief explanation of `_.pluck` and `_.flatten` as I haven't covered them yet:

We needed to compare every `added` value with every removed value.  We could have done that with a nested for loop, or `_.map`.
But the entire point of the for loop would be to access a value within each `edits` object.

A simpler approach with the same result is to use `_.pluck`

Here is `_.pluck` at work:
```
_.pluck([ { colour: 'blue' }, { colour: 'red', colour: 'green'}  ], 'color')
//=> ['blue','red','green']
```

So `_.pluck(edits,'removed')` retrieves the removed property from each `edits` object.  The value of each `removed` property is
an array.  So we would end up with an array of removes.

```
_.pluck(edits,'removed')
//=> [ ["satire","political"], ["funny"] ]
```

We want to plug these values into `_.intersection`, but we need to first convert the nested array into a flat array.

```
_.flatten(
  _.pluck(edits,'removed') //=> [ ["satire","political"], ["funny"] ]
)  //=> [ "satire", "political", "funny" ]
```

Then we have two flat arrays `allRemoved` and `allAdded`.  We can then find common values using `_.intersection`.

```
common = _.intersection(allAdded,allRemoved)
//=> [ 'satire', 'funny' ]
```

This example just demonstrates the identification of a conflict, and throws an error.  How a real app handles that situation after that identification could get very complicated indeed.

### `_.pick`: Pick the properties you want from an Object

__The Scenario:__ You're working at a Photo management website, and your photos are stored in a big object called `photos`, where the key is the unique identifier of that photo.  You have also have a collection of albums stored in another object, where the album's title is
the unique identifier.

One photo can appear in multiple albums (kind of like gmail), so each album has a `contents` property.  Which is either an array of photo ids, or a function which allows you to dynamically retrieve photos that match a predicate.

__The Problem:__ Your boss isn't so keen on this "dynamic" album idea thing, because it sounds too complicated.

__The Solution:__ Let `_.pick` do all the hard work, while you take the credit.

```javascript

photos = {
  1: { name: 'Statue of Liberty.jpg', location: 'New York' },
  2: { name: 'The Bronx.jpg', location: 'New York' },
  3: { name: 'Eifel Tower.jpg', location: 'France' },
  4: { name: 'Cafe in Nice.jpg', location: 'France' },
}

albums = {
   //Any photo taken in New York
  'New York': { contents: function( photo ){ return photo.location == 'New York'} },

  //photos[3] and photos[4]
  'France' : {  contents: [3,4] },
}

getContents = function(photos,album){

  //pick using either the keys or the function, lodash knows what to do
  return _.pick( photos, album.contents )

}

getContents(photos,albums['New York'])
//=>  [
//      { name: 'Statue of Liberty.jpg', location: 'New York' },
//      { name: 'The Bronx.jpg', location: 'New York' }
//    ]

getContents(photos,albums.France)
//=>  [
//      { name: 'Eifel Tower.jpg', location: 'France' },
//      { name: 'Cafe in Nice.jpg', location: 'France' }
//    ]
```