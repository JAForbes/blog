General Practicality of Ramda and Functional Techniques
-------------------------------------------------------

Ramda is a functional Javascript utility library.  It is extremely useful for reducing complexity of involved tasks by allowing
for composition of small functions into larger ones, and by encourage a flow of data instead of global state.

There are many demonstrations of Ramda, but most of them are very pie in the sky, and don't use actual data.  So this demonstration will ensure our data is real, we will scrape it from the internet.

At a later stage, I'd like to take the output data from this exercise, as input for another demonstration of Ramda's prowess at data processing.

Presidents from Wikipedia
--------------------------

We are going to use Ramda, Promise, Cheerio and Request in nodejs to parse Wikipedia into an array of data on United States presidents.


Setting up the Project
----------------------

Let's do the following

- Create a folder for our project called `presidents`
- install our dependencies.
- Make a test HTTP request

```
mkdir presidents #create our project folder

cd presidents #move into our project

npm init #create our package json

npm install ramda cheerio request promise lodash --save #install our dependencies

touch app.js #create our script file

```

Now open up `app.js` in your favourite editor.  And create variables for our dependencies.

```js
var Promise = require('Promise') //clean asynchronous code
var request = Promise.denodeify(require('request')) //talking to the web
var R = require('ramda') //reduce complexity
var cheerio = require('cheerio') //DOM traversal

//test request works
request('http://en.wikipedia.org/wiki/George_Washington', console.log )
```

Then open up your terminal again and run our script

```
node app
```

You'll get a huge data dump.  That's a good thing.

Now we just want the HTML response.  We may not know what `request`'s response API is.  So let's look at the keys of the response to see what we can access.

```js
request('http://en.wikipedia.org/wiki/George_Washington')
    .then(R.keys)
    .then(console.log)
```

Then re run it in your termninal.  You'll get something like this.

```js
> node app
[ '_readableState',
  'readable',
  'domain',
  '_events',
  '_maxListeners',
  'socket',
  'connection',
  'httpVersion',
  'complete',
  'headers',
  'trailers',
  '_pendings',
  '_pendingIndex',
  'url',
  'method',
  'statusCode',
  'client',
  '_consuming',
  '_dumped',
  'httpVersionMajor',
  'httpVersionMinor',
  'upgrade',
  'req',
  'pipe',
  'addListener',
  'on',
  'pause',
  'resume',
  'read',
  'request',
  'toJSON',
  'caseless',
  'body' ]

```

`body` looks like the most applicable attribute.  So lets change our code to grab the body instead.

```js
request('http://en.wikipedia.org/wiki/George_Washington')
  .then(R.get('body'))
  .then(console.log)
```

Run your script, and you'll get a _whole lot_ of HTML dumped to your console.  Now we need to parse the HTML to access our president data.  Enter cheerio.

```js
request('http://en.wikipedia.org/wiki/George_Washington')
  .then(R.get('body'))
  .then(cheerio.load) //<-- create a query function: $
  .then(function( $ ){
    return $('p').first().text() //get the 1st paragraph
  })
  .then(console.log)
```

Now run your app.  You'll get the following in your console.


> George Washington (February 22, 1732 [O.S. February 11, 1731][Note 1][Note 2] - December 14, 1799) was the first President of the United States (1789-1797), the Commander-in-Chief of the Continental Army during the American Revolutionary War, and one of the Founding Fathers of the United States.[3] He presided over the convention that drafted the United States Constitution, which replaced the Articles of Confederation and remains the supreme law of the land.


Thank our dependencies for our simple 12 line program.


Parsing the relevant data
-------------------------

Now we pray Wikipedia uses some standard convention for its data, so we can parse easily.

Go to the the [George Washington page on Wikipedia](http://en.wikipedia.org/wiki/George_Washington) and open up your browser dev tools.

At the time of writing they have JQuery on the page.  This will allow us to figure out our queries for cheerio.

Let's grab the name of our President via the heading on the page.  If you right click on the heading and click `Inspect Element`, you'll see it has a class of `firstHeading`.  So we can use JQuery to grab the heading by querying for that class.

In the developer console.  Try the following code.

```js
$('.firstHeading').text() //=> "George Washington"
```

Now back in `app.js` let's store that as a `names` property, using Cheerio.

```js

request('http://en.wikipedia.org/wiki/George_Washington')
  .then(R.get('body'))
  .then(cheerio.load)
  .then(function($){
    return {
      names: $('.firstHeading').text().split(' '),
    }
  })
  .then(console.log)
```

Run that and you'll get:

```
> node app
{ names: ['George','Washington'] }

```

Great!  Using the same process of inspecting elements we find there is a `bday` class on the George Washinton page.

```javascript
request('http://en.wikipedia.org/wiki/George_Washington')
.then(R.get('body'))
.then(cheerio.load)
.then(function($){
  return {
    names: $('.firstHeading').text().split(' '),
    bday: $('.bday').text(),
  }
})
.then(console.log) //=> { names: ['George', 'Washington'], dob: '1732-02-22' }
```

Let's add some more properties.  Some of these parsing queries get pretty ugly, but that is just the nature of scraping web pages.

```javascript
request('http://en.wikipedia.org/wiki/Thomas_Jefferson')
.then(R.get('body'))
.then(cheerio.load)
.then(function($){
  return {
    names: $('.firstHeading').text().split(' '),
    born: $('.bday').text(),
    died: $('.dday').text(),
    birthplace: $('th:contains("Died")').next().text().split('\n').slice(-1)[0],
    religion: $('th:contains("Religion")').next().find('a').first().text(),
    party: $('th:contains("Political party")').next().text(),
    profession: $('th:contains("Profession")').next().text(),
    graduated: $('th:contains("Alma mater")').next().text()
  }
})
.then(console.log)
```

The response you get back will look like this:

```javascript
{ names: [ 'Thomas', 'Jefferson' ],
  born: '1743-04-13',
  died: '1826-07-04',
  birthplace: 'Charlottesville, Virginia, U.S.',
  religion: 'Christian deism',
  party: 'Democratic-Republican',
  profession: 'Statesman, planter, lawyer, architect',
  graduated: 'College of William and Mary' }

```

Now we need to collect this data for _all_ Presidents.

Every president's page has a `Succeeded by` section, with a link to the next page.  But that means we would only process the data in order, which could take a lot longer than doing so in parallel.

Instead we can parse a list of the presidents from http://www.whitehouse.gov/about/presidents/.

```js
var parsePresidentsList = R.pipe(
  R.get('body'),
  cheerio.load,
  function($){
    return $('.views-field-title').text()
  },
  R.replace(/\d*\./g,''),//remove list numbering
  R.split('\n'), //split on new line
  R.map(R.match(/[A-z]+/g)), //remove anything that isn't a letter
  _.compact, //remove any failed matches
  R.map(R.join(' ')) //join the surviving names with a space
)

request('http://www.whitehouse.gov/about/presidents/')
  .then(parsePresidentsList)
  .then(console.log)
```

That may look pretty busy, but each step is easy to follow.  If we wanted, we could turn various parts of that process into helper functions.  Like loading and querying the DOM and getting a text result.  Scraping the Web, is always ugly.

If you run that, you'll see an output of President names in the console.

Now let's put the two together!

```js
var Promise = require('Promise')
var request = Promise.denodeify(require('request'))
var R = require('ramda')
var cheerio = require('cheerio')
var _ = require('lodash')

var parsePresidentsList = R.pipe(
  R.get('body'),
  cheerio.load,
  function($){
    return $('.views-field-title').text()
  },
  R.replace(/\d*\./g,''),//remove list numbering
  R.split('\n'), //split on new line
  R.map(R.match(/[A-z]+/g)), //remove anything that isn't a letter
  _.compact //remove any failed matches
)

function scrapeWikipedia(president){
  var url = 'http://en.wikipedia.org/wiki/'+president.join('_')
  return request(url)
  .then(R.get('body'))
  .then(cheerio.load)
  .then(function($){
    return {
      names: $('.firstHeading').text().split(' '),
      born: $('.bday').text(),
      died: $('.dday').text(),
      birthplace: $('th:contains("Died")').next().text().split('\n').slice(-1)[0],
      religion: $('th:contains("Religion")').next().find('a').first().text(),
      party: $('th:contains("Political party")').next().text(),
      profession: $('th:contains("Profession")').next().text(),
      graduated: $('th:contains("Alma mater")').next().text()
    }
  })
}

request('http://www.whitehouse.gov/about/presidents/')
  .then(parsePresidentsList)
  .then(R.take(2)) //only parse 2 presidents for now
  .then(R.map(scrapeWikipedia))
  .then(Promise.all)
  .then(console.log)

```

Let's walk through that code dump.

```js
request('http://www.whitehouse.gov/about/presidents/') // <-- get website about presidents
  .then(parsePresidentsList) // <-- Parse an array of president names from the response
  .then(R.take(2)) //only parse 2 presidents for now to speed up development, just comment this out later
  .then(R.map(scrapeWikipedia)) //scrape wikipedia for every president
  .then(Promise.all) //only move on when we have scraped every page
  .then(console.log) //log the resulting array to the console
```

I've moved our original wikipedia code into a function `scrapeWikipedia( president )`.  The real magic of this part of the code is `Promise.all`.  It takes the result of `R.map(scrapeWikipedia)`, and only moves on, when all the scrapes are complete.

This saves us polluting our code with counting variables, insane error handling checks, and most of all _state_.

You may notice that we are not storing the list of scraped data, or the list of presidents.  We just pass it to the function that needs it.  This seems crazy at first, but this is what makes this code so easy to maintain and edit (as we have been doing).  The entire program is just a flow of data.  There is no need to keep track of any state while debugging.

Writing the result to a file
----------------------------

Just for fun, let's save the output to a file.

```js
var Promise = require('Promise')
var request = Promise.denodeify(require('request'))
var R = require('ramda')
var cheerio = require('cheerio')

var _ = require('lodash')
var fs = require('fs')
var writeFile = _.curry(Promise.denodeify(fs.writeFile),2)
var prettyJSON = _.partialRight(JSON.stringify, null, 2)

var parsePresidentsList = R.pipe(
  R.get('body'),
  cheerio.load,
  function($){
    return $('.views-field-title').text()
  },
  R.replace('James Carter','Jimmy Carter'),
  R.replace(/\d*\./g,''),//remove list numbering
  R.split('\n'), //split on new line
  R.map(R.match(/[A-z]+/g)), //remove anything that isn't a letter
  _.compact //remove any failed matches
)

function scrapeWikipedia(president){
  var url = 'http://en.wikipedia.org/wiki/'+president.join('_')
  return request(url)
  .then(R.get('body'))
  .then(cheerio.load)
  .then(function($){
    return {
      names: $('.firstHeading').text().split(' '),
      born: $('.bday').text(),
      died: $('.dday').text(),
      birthplace: $('th:contains("Died")').next().text().split('\n').slice(-1)[0],
      religion: $('th:contains("Religion")').next().find('a').first().text(),
      party: $('th:contains("Political party")').next().text(),
      profession: $('th:contains("Profession")').next().text(),
      graduated: $('th:contains("Alma mater")').next().text()
    }
  })
}

request('http://www.whitehouse.gov/about/presidents/')
  .then(parsePresidentsList)
  .then(R.take(4)) //speed up development process
  .then(R.map(scrapeWikipedia))
  .then(Promise.all)
  .then(prettyJSON,console.error)
  .then(writeFile('presidents.json'))


```

I'll walk through the function definitions of prettyJSON and writeFile.

```js
var writeFile = _.curry(Promise.denodeify(fs.writeFile),2)
var prettyJSON = _.partialRight(JSON.stringify, null, 2)
```

`fs.writeFile` does not return a promise by default.  So we call `Promise.denodeify(fs.writeFile)` to convert `fs.writeFile` into a thenable function.

We use `_.curry` so we can specify the filename before we receive the file data.  Put that together and you get `_.curry(Promise.denodeify(fs.writeFile),2)`

`_.partialRight(JSON.stringify, null, 2)` just means, when we call `JSON.stringify( json )`, add these arguments at the end, so it becomes.  `JSON.stringify( json, null, 2)`.  Which specifies `stringify` to pretty print the output.

If you run the above code you should get an array of president data.

```json
[
  {
    "names": [
      "George",
      "Washington"
    ],
    "born": "1732-02-22",
    "died": "1799-12-14",
    "birthplace": "Mount Vernon, Virginia, U.S.",
    "religion": "Deism",
    "party": "None",
    "profession": "",
    "graduated": ""
  },
  {
    "names": [
      "John",
      "Adams"
    ],
    "born": "1735-10-30",
    "died": "1826-07-04",
    "birthplace": "Quincy, Massachusetts, U.S.",
    "religion": "Unitarianism",
    "party": "Federalist",
    "profession": "",
    "graduated": "Harvard University"
  },
  {
    "names": [
      "Thomas",
      "Jefferson"
    ],
    "born": "1743-04-13",
    "died": "1826-07-04",
    "birthplace": "Charlottesville, Virginia, U.S.",
    "religion": "Christian deism",
    "party": "Democratic-Republican",
    "profession": "Statesman, planter, lawyer, architect",
    "graduated": "College of William and Mary"
  },
  {
    "names": [
      "James",
      "Buchanan"
    ],
    "born": "1791-04-23",
    "died": "1868-06-01",
    "birthplace": "Lancaster, Pennsylvania, U.S.",
    "religion": "Presbyterianism",
    "party": "Democratic",
    "profession": "Lawyer\nDiplomat",
    "graduated": "Dickinson College"
  }
]
```

Reviewing the output data
-------------------------

If you scrape the entire data set, you'll notice the data is actually pretty clean.  There are parsing failures that would be easily resolved with some fine tuning of `scrapeWikipedia`'s queries.  But all in all, the implementation is fairly complete and compact.


Conclusion
----------

We just demonstrated scraping data from multiple sites in parallel, and logging the output to a file in less than 50 lines of Javascript.  We walked through the entire process, and made use of Ramda's function composition to create an in depth parsing function.

The final code is easy to augment and debug.

If you are a user of Lodash, and you haven't yet given Ramda a try, I recommend it highly.