# Using node.js as a scripting language.

node.js is often thought of as a langauge for writing web servers.  And that it's not suited for day to day scripting tasks.

I want to dispel you of this notion.

I think the best way to think about node is as a facilitator.  It's really good at letting other tools do the heavy lifting, and organizing and managing those external resources.  Things like calling shell scripts, waiting for network requests, database calls etc.  It's async, which makes it fast.  But being async is also what makes people reach for python because it's got a giant standard library and it's very easy to get started.


I've got a small task I need to do right now, so let's get started

## The task

I need to download some log archives and analyzing product usage by user and organization.

So how do we get started?  The first thing we need to do is get access to the logs.  They happen to be on a bucket, automatically uploaded with write only permissions from papertrail.

They are stored as gzipped tsv files. by time range in day bracketed folders.

So I think the first thing to do is just get the files.  Be comfortable hard coding within the file but using variables to make your life easier later.

## Where should my script live?

The first pro-tip I want to give you is, don't create a new npm project or repo for every little script.  Have a git ignored folder in your main project repo, and use it for odd scripts.  When things mature you can move them into the project or their own project, but let's be honest, most of the time that doesn't happen (or need to happen).

The benefits are, you can make use of existing dependencies in your project and you don't obsess over which package manager to use or how to structure your project.  

I've got an `output` directory in my project and within it I'm going to make a folder called `papertrail-logs`

`mkdir output/papertrail-logs`

Ok now I'm going to create a script inside that folder called `index.js` because in node, that means I can just require('papertrail-logs') or call `node output/papertrail-logs` and node will find my index.js script, but I can have an entire directory to store resources, other scripts, whatever.

Next I'm going to use `aws-sdk`

aws-sdk isn't my favourite library, it actually leaves a lot to be desired, but what choice do we have?

Now in my project I've already got `aws-sdk` so I don't need to install it, that's true of a lot of projects.  If you don't have it `npm install aws-sdk` and do so in your main project's `package.json` don't worry about having separate dependencies for scripts.

```js
const AWS = require('aws-sdk')

const profile = 'harth'

AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ 
        profile 
    });

const s3 = new AWS.S3()

async function main(){
    const buckets = 
        await s3.listBuckets().promise()
    console.log(buckets)
}

main()
    .catch(console.error)
```

Few things to note already.  Firstly, I'm on an old aws-sdk API.  Your instinct might be to go update it, I'd recommend not to get distracted with stuff like that if possible, just get started.

You'll notice I need to call `.promise()` to get AWS to use promises.  I don't even know if that's still required, it's a wart, it's annoying but I'm deliberately embracing that instead of getting distracted.

The next thing is authentication.  Best practices dictates passing in environment variables and letting the aws-sdk detect how to connect to their services from there.  That way you're able to reuse that script in different environments.  Again, this is a distraction, connect any way you can.  You can even hard code credentials because we're in a gitignored directory, but I'd recommend against doing that, aws profile's are great.

You'll also notice I've got a `main` function.  You might think that's so I can use async-await, and while that is true, top level await isn't standard yet, that's actually not why I'm doing that.  I've written *a lot* of scripts, and they very commonly turn into cli's, with options, and it's really helpful to be able to validate inputs before actually executing the main operation.  So including that main operation in a function makes that really easy.

Another advantage is, you can export your main function and allow some other module to call that function at a time of their convenience.  I think generally, even for scripts, having side effects at the top level is a bad idea.

You'll also notice, we're calling listBuckets, but I don't need to list buckets.  That's just a safe operation to test my connection.  One trick I have for keeping productive is to not write too much code before testing, especially testing integration.  So just knowing I'm connected before I do anything else is pivotal.

I run it like so `node output/papertrail-logs`

And I get output printed to the screen, that shows my request worked.  Great thing is, I can see my bucket is there `papertrail-harth` I'm going to make that a variable and try listing the prefixes at the top level next.

```js
const AWS = require('aws-sdk')

const profile = 'harth'
const Bucket = 'papertrail-harth'

AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function main(){
    const xs = await s3.listObjectsV2({ Bucket }).promise()
    console.log(xs)
}

main()
    .catch(console.error)
```

That outputs a whole lot of file metadata for me in the console.  Now I know this API will only return a maximum of 1000 results and I'm getting back 889.  So right now, I'm not going to be missing any data, but very soon I will be.  To ignore it would be a mistake, even though we're trying to just write a simple script.  If in a week we can't use this script, it's not exactly useful.

So I'm going to set max keys to a smaller chunk to deliberately force the results to be truncated so that I can experiment with fetching all the data.

```js
const AWS = require('aws-sdk')

const profile = 'harth'
const Bucket = 'papertrail-harth'

AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function main(){

    let xs = []
    let ContinuationToken = undefined

    do {

        const { Contents, NextContinuationToken }  =
            await s3.listObjectsV2({
                Bucket, MaxKeys: 50, ContinuationToken
            }).promise()

        ContinuationToken = NextContinuationToken
        xs.push(...Contents)
        console.log(xs.length)
    } while (ContinuationToken)

    console.log(xs)
}

main()
    .catch(console.error)
```

So that just logs 50, 100, 150 and so on until it's got all the data.  Now I can up that MaxKeys to 1000 and put it up the top as a variable.  It should still work.

```js
const AWS = require('aws-sdk')

const profile = 'harth'
const Bucket = 'papertrail-harth'
const MaxKeys = 1000

AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function main(){

    let xs = []
    let ContinuationToken = undefined

    do {

        const { Contents, NextContinuationToken }  =
            await s3.listObjectsV2({
                Bucket, MaxKeys, ContinuationToken
            }).promise()

        ContinuationToken = NextContinuationToken
        xs.push(...Contents)
        console.log(xs.length)
    } while (ContinuationToken)

    console.log(xs)
}

main()
    .catch(console.error)
```

It does!  It just logs the total and then the results.  Now those who know me well may be suprised I used a while loop for that as I'm all about functional programming.  Why not use recursion, especially as it's async?

The main reason is, I just knew that pattern, it's probably in the archives of my brain from many years ago, and I'm not trying to make it elegant just easy to understand.  And the takeaway there is, for scripting, don't worry about elegance, use what you're comfortable with.  But... I am going to extract that part out into a function though, not so it's reusable, but so the main function reads with clarity of intent.

```js
const AWS = require('aws-sdk')

const profile = 'harth'
const Bucket = 'papertrail-harth'
const MaxKeys = 1000

AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function listAllObjects({
    Bucket
}){
    let xs = []
    let ContinuationToken = undefined

    do {
        const { Contents, NextContinuationToken }  =
            await s3.listObjectsV2({
                Bucket, MaxKeys, ContinuationToken
            }).promise()

        ContinuationToken = NextContinuationToken
        xs.push(...Contents)

    } while (ContinuationToken)
    return xs
}

async function main(){

    const xs = await listAllObjects({ Bucket })

    console.log(xs)
}

main()
    .catch(console.error)
```

Ok.  Now we may not actually want to download all log files in the bucket.  And to test our script, we only really need to download 1 or 2.  It's not super important if this script takes a bit to run because it's not part of an API or app, it's just hitting a bucket not a webserver, it can be as inefficient as we want.

So I'm just going to take the last 2 items from `xs`, even though I just downloaded ~800 items.

Then I'm going to download the files.  Now this time, I'm not going to write the files to disk, I want to use streams.  Not really for performance sake, but because it makes my script more self contained.  Node streams kind of... well, they aren't a great API.  It's a widely accepted view.  But there's a very nice part of the streams api, and anything beyond that you can abstract away pretty easily, so let's do that as we go.

First let's stream the file from s3 to stdout.

```js
xs.slice(0,1).map(
        ({ Key }) =>
            s3.getObject({ Key, Bucket })
            .createReadStream()
            .pipe(process.stdout)
)
```

Few things to note here, we're not using `xs[0]` so if the bucket was empty, our code doesn't crash, and we don't need an if statement to check if the list is empty.

Next thing is, the node stream API looks kind of nice... and it can be if you use it in a certain way.  I'll try to demonstrate that.  

Quick aside for those not familiar with the Node streams API, this tiny snippet is actually doing a lot behind the scenes.  We only download from AWS as we pipe to stdout.  So we can create as many read streams as we want, and they don't actually do anything until we attach them to a write stream.

When we pipe each getObject into process.stdout you may think we're going to download way too much data at once.  But each stream has an internal buffer that is pretty small and when that buffer is full the download is paused and only resumed when there's sufficient space again.  So we're actually only download tiny chunks from each file in parallel.

That process is called back pressure.  Which is a weird name, but all it means is how much pressure (data) is in the read stream waiting to be written to the next write stream.

So there's a lot of powerful bidirectional communication happening between each stream in that call to `.pipe`.

Now, that works, but it outputs some garbage to stdout, and at first I didn't know why (or rather I forgot) so I used this debugging trick:

```js
xs.slice(0,1).map(
        ({ Key }) =>
            console.log({ Key }) ||
            s3.getObject({ Key, Bucket })
            .createReadStream()
            .pipe(process.stdout)
)
```

`console.log` returns `undefined` which makes it falsey, so I can use logical-or to inject a log into an expression.  And I can very easily comment or remove that line without interfering too much with the surrounding code.

When I logged the key I saw this: `2020-01-19-23.tsv.gz` and then I remembered, the file is gzipped, hence the garbage.

Good thing Node.JS has a built in zlib module with streaming support!

So I add this import `const zlib = require('zlib')`  and this to our `pipe`

```js
xs.slice(0,1).map(
    ({ Key }) =>
            s3.getObject({ Key, Bucket })
                .createReadStream()
                .pipe(zlib.createUnzip())
                .pipe(process.stdout)
)
```

And that works!

Ok now I've got tsv streaming in, it'd be nice to be able to analyse the logs.  And having all the data in tsv doesn't make that simple.  Really the best tool for the job is a database.  And we may do that!  But it'd be nice to get the data into a native format first for analysis.

At the time of writing, probably the best csv/tsv parsing library out there is papa parse.  And it supports node streams too.

So let's continue piping!

So far I haven't had to install any libraries because I use all of these libraries are in my larger application, but you may need to `npm install papaparse` if you are following along.

Then we add the import and the new `pipe` line.  I'm just scanning the documentation quickly for "node streams" and figuring it out from there.

```js
// ⚠ WARNING DOES NOT WORK
xs.slice(0, 1).map(
    ({ Key }) =>
        s3.getObject({ Key, Bucket })
        .createReadStream()
        .pipe(zlib.createUnzip())
        .pipe(
            Papa.parse(Papa.NODE_STREAM_INPUT, {
                delimiter: '\t'
            })
        )
        .pipe(process.stdout)
)
```

So I tried the obvious, and got an error about chunks needing to be strings or buffers but instead got type object.  After a bit of googling I found nothing, but thought I'd just inspect what the`Papa.parse` output was.

To inspect what a stream is doing we can add a  `.on('data', x => ... )` callback.

```js
xs.slice(0, 1).map(
    ({ Key }) =>
        s3.getObject({ Key, Bucket })
        .createReadStream()
        .pipe(zlib.createUnzip())
        .pipe(
            Papa.parse(Papa.NODE_STREAM_INPUT, {
                delimiter: '\t'
            })
        )
        .on('data', x => {
            console.log(x)
        })
        // .pipe(process.stdout)
)
```

After I did that, I saw `Papa.parse` was emitting an array, as soon as I saw that the error was obvious, we're trying to pipe the parsed output (an array of values) to stdout which needs a string or a buffer.

The general lesson here is, test often, and after every change, that way you know what the likely cause of an error is.

We've now got a stream of parsed tsv's.  Let's do some quick clean up and then output each row as JSON.

```js
const zlib = require('zlib')
const AWS = require('aws-sdk')
const R = require('ramda')
const Papa = require('papaparse')
const profile = 'harth'
const Bucket = 'papertrail-harth'
const MaxKeys = 1000


AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function listAllObjects({
    Bucket
}){
    let xs = []
    let ContinuationToken = undefined

    do {
        const { Contents, NextContinuationToken }  =
            await s3.listObjectsV2({
                Bucket, MaxKeys, ContinuationToken
            }).promise()

        ContinuationToken = NextContinuationToken
        xs.push(...Contents)

    } while (ContinuationToken)
    return xs
}

async function main(){

    const xs = (await listAllObjects({ Bucket })).slice(-2)


    xs.map(
        ({ Key }) =>
            s3.getObject({ Key, Bucket })
            .createReadStream()
            .pipe(zlib.createUnzip())
            .pipe(
                Papa.parse(Papa.NODE_STREAM_INPUT, {
                    delimiter: '\t'
                })
            )
            .on('data', x => {
                console.log(
                    JSON.stringify(
                        R.merge(
                            { Key },
                            R.zipObj(
                                [
                                    'id'
                                    ,'generated_at'
                                    ,'received_at'
                                    ,'source_id'
                                    ,'source_name'
                                    ,'source_ip'
                                    ,'facility_name'
                                    ,'severity_name'
                                    ,'program'
                                    ,'message'
                                ]
                                ,x
                            )
                        )

                    )
                )
            })
    )
}

main()
    .catch(console.error)
```

I've gone and read the papertrail docs to figure out what each columns header is, and brought in ramda as a utility library.

R.zipObj takes an array of keys and an array of values and mashes them into an object.  The native equivalent is Object.fromEntries.  But I've developed a habit not to use that everywhere yet because it's not supported in all environments.  Also, we're scripting, and I know ramda quite well, so I'm using what feels effortless for me.  You might want to use lodash, or some other approach - and that's exactly what I recommend when scripting.  Don't copy me!  Use what you're familiar and comfortable with.

One thing left.  I want to filter which log files to download.  And I need to know what log files are available to download.

Remember when I said it's common for scripts to turn into cli's and it's great when your side effects are segregated into a main function.  Well that's about to pay off.

Let's bring in commander and date-fns.

Commander is a cli parser with some nice things built in for free.  The API is pretty simple and I like how it auto generates help messages.  There's a few things I find weird about it, but we won't run into that here...

```js
const zlib = require('zlib')
const AWS = require('aws-sdk')
const R = require('ramda')
const Papa = require('papaparse')
const profile = 'harth'
const Bucket = 'papertrail-harth'
const MaxKeys = 1000


AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function listAllObjects({
    Bucket
}){
    let xs = []
    let ContinuationToken = undefined

    do {
        const { Contents, NextContinuationToken }  =
            await s3.listObjectsV2({
                Bucket, MaxKeys, ContinuationToken
            }).promise()

        ContinuationToken = NextContinuationToken
        xs.push(...Contents)

    } while (ContinuationToken)
    return xs
}

async function main(){

    const xs = (await listAllObjects({ Bucket })).slice(-2)


    xs.map(
        ({ Key }) =>
            s3.getObject({ Key, Bucket })
            .createReadStream()
            .pipe(zlib.createUnzip())
            .pipe(
                Papa.parse(Papa.NODE_STREAM_INPUT, {
                    delimiter: '\t'
                })
            )
            .on('data', x => {
                console.log(
                    JSON.stringify(
                        R.merge(
                            { Key },
                            R.zipObj(
                                [
                                    'id'
                                    ,'generated_at'
                                    ,'received_at'
                                    ,'source_id'
                                    ,'source_name'
                                    ,'source_ip'
                                    ,'facility_name'
                                    ,'severity_name'
                                    ,'program'
                                    ,'message'
                                ]
                                ,x
                            )
                        )

                    )
                )
            })
    )
}

app
    .option(
        '--after <isodate>'
        , 'Only fetch log files after a certain date.'
    )
    .option(
        '--before <isodate>'
        , 'Only fetch log files before a certain date.'
    )
    .option(
        '--list'
        , 'list available log files instead of downloading their contents'
    )
    .parse(process.argv)

function list(){
console.log('list')
}

if( app.list ) {
list()
} else {
    main()
        .catch(console.error)
}
```

Now we can do a few things already.

We can run our script with `--help` and it will output a nicely formatted help screen based on what we passed to `app.option`.  If we call it with the `--list` option our main function won't run, and instead we'll just log "list" to the screen then exit.

I want to be able to list all the available log files between a date range, and I want to be able to view all logs between a date range.  The list function will be where we retrieve and filter the available log files.  Main will continue to render out the parsed logs.

The log files path looks like this "papertrail/logs/dt=2019-10-24/2019-10-24-21.tsv.gz" where each file represents one hour of the day.

So if we want to filter by date we need to be able to parse that string and then compare it to the provided args.

The built in Date object gets a bad name in JS.  I think it's not that bad if you learn about its idiosyncrasies.  But we're scripting, there's no reason not to bring in whatever module will make our life easier.  So I'm going to use date-fns' parse function.  First thing is use node's built in `path.basename` function to get the last segment of the filename.

```js
function list(){
    var Key = "papertrail/logs/dt=2019-10-24/2019-10-24-21.tsv.gz" 
    // logs 2019-10-24-21
    console.log( path.basename(Key,'tsv.gz') )
}
```

Then we bring in df.parse

```js
function list(){
    var Key = "papertrail/logs/dt=2019-10-24/2019-10-24-21.tsv.gz" 
    // logs 2019-10-24-21
    const end = df.parse( path.basename(Key,'tsv.gz'), 'yyyy-MM-dd-HH' )

    // logs 2019-10-24T10:00:00.000Z
    console.log( end )
}
```

Then we can use `df.subHours` to subtract 1 hour to get the start time of the log file.

```js
function list(){
    var Key = "papertrail/logs/dt=2019-10-24/2019-10-24-21.tsv.gz" 
    // logs 2019-10-24-21
    const end = df.parse( path.basename(Key,'tsv.gz'), 'yyyy-MM-dd-HH' )
    const start = df.subHours( end, 1 )

    // logs 2019-10-24T09:00:00.000Z
    console.log( start )
}
```

Next let's bring in some real data.

```js
async function list(){
    const xs = await listAllObjects({ Bucket })

    xs.map(
        ({ Key }) => {
            const end = 
                df.parse( path.basename(Key,'tsv.gz'), 'yyyy-MM-dd-HH' )
        
            const start = 
                df.subHours( end, 1 )

            return { Key, start, end }
        }
    )
    .forEach( x => console.log(x) ) 
}
```

What if someone drops a file in our bucket that doesn't match our pattern, our dates will be invalid.  And our script will crash - so let's use flatMap to only return our date if the end date is valid.

```js
async function list(){
    const xs = await listAllObjects({ Bucket })

    xs
    .flatMap(
        ({ Key }) => {
            const end = 
                df.parse( path.basename(Key,'tsv.gz'), 'yyyy-MM-dd-HH' )
        
            const start = 
                df.subHours( end, 1 )

            return df.isValid(end) 
                ? [{ Key, start, end }]
                : []
        }
    )
    .forEach( x => console.log(x) ) 
}
```

Remember the `before` and `after` arguments we parsed via commander?  We can add a `filter` after the `flatMap` that brackets the dates by the provided iso times, but only if that range was provided.

```js
async function list({ after, before }){
    const xs = await listAllObjects({ Bucket })

    xs
    .flatMap(
        ({ Key }) => {
            const end = 
                df.parse( path.basename(Key,'tsv.gz'), 'yyyy-MM-dd-HH' )
        
            const start = 
                df.subHours( end, 1 )

            return df.isValid(end) 
                ? [{ Key, start, end }]
                : []
        }
    )
    .filter(
        ({ start, end }) =>
        // if there's an after option:
            // check our start time is after it
            (!after || df.parseISO(after) < start)
            && 
            // if there's a before option:
            // check our end time is before it
            (!before || end < df.parseISO(before))
    )
    .forEach( x => console.log(x) ) 
}
```

Notice I've made `after` and `before` arguments to the function for easier testing and parameterization from the call site.

This functionality can be used by our cli, but we could use the exact same functionality for filtering results to a date range in the main function.

Let's refactor a bit.

```js
const zlib = require('zlib')
const AWS = require('aws-sdk')
const R = require('ramda')
const Papa = require('papaparse')
const app = require('commander')
const df = require('date-fns')
const path = require('path')
const profile = 'harth'
const Bucket = 'papertrail-harth'
const MaxKeys = 1000


AWS.config.credentials =
    new AWS.SharedIniFileCredentials({ profile });

const s3 = new AWS.S3()

async function listAllObjects({
    Bucket
}){
    let xs = []
    let ContinuationToken = undefined

    do {
        const { Contents, NextContinuationToken }  =
            await s3.listObjectsV2({
                Bucket, MaxKeys, ContinuationToken
            }).promise()

        ContinuationToken = NextContinuationToken
        xs.push(...Contents)

    } while (ContinuationToken)
    return xs
}

async function main({ before, after }){

    const xs = await list({ before, after, Bucket }) // NEW!!!

    xs
    .map(
        ({ Key }) =>
            s3.getObject({ Key, Bucket })
            .createReadStream()
            .pipe(zlib.createUnzip())
            .pipe(
                Papa.parse(Papa.NODE_STREAM_INPUT, {
                    delimiter: '\t'
                })
            )
            .on('data', x => {
                console.log(
                    JSON.stringify(
                        R.merge(
                            { Key },
                            R.zipObj(
                                [
                                    'id'
                                    ,'generated_at'
                                    ,'received_at'
                                    ,'source_id'
                                    ,'source_name'
                                    ,'source_ip'
                                    ,'facility_name'
                                    ,'severity_name'
                                    ,'program'
                                    ,'message'
                                ]
                                ,x
                            )
                        )

                    )
                )
            })
    )
}

app
    .option(
        '--after <isodate>'
        , 'Only fetch log files after a certain date.'
    )
    .option(
        '--before <isodate>'
        , 'Only fetch log files before a certain date.'
    )
    .option(
        '--list'
        , 'list available log files instead of downloading their contents'
    )
    .parse(process.argv)

async function list({ after, before, Bucket }){ // NEW !!!
    const xs = await listAllObjects({ Bucket }) // NEW !!!

    return xs
        .flatMap(
            ({ Key }) => {

                const end =
                    df.parse(
                        path.basename(Key, '.tsv.gz')
                        ,'yyyy-MM-dd-HH'
                        ,new Date()
                    )

                const start =
                    df.subHours(end, 1)

                return df.isValid(end)
                    ? [{ start, end, Key }]
                    : []
            }
        )
        .filter(
            ({ start, end }) =>
                (!after || df.parseISO(after) < start)
                && (!before || end < df.parseISO(before))
        )
}

if( app.list ) {
    // NEW !!!
    list({
        Bucket, after: app.after, before: app.before
    })
        .then( xs => JSON.stringify(xs, null, 2) )
        .then(console.log)
        .catch(console.error)
} else {
    main(app)
        .catch(console.error)
}
```

We've made the `list` function return data instead of logging directly, and then we simply add the logging to the list call site.  In the main function we're now using `list` instead of `listAllObjects` which gives the `main` function the same date filtering functionality as `list`.  

Which means we've now got a pretty nice script with cli documentation, paginated data fetching, date filtering and it's all lazily evaluated using node streams which means it's memory efficient and fast with less than 150 lines of code.

What's next?  Well that's up to you!  But my goal here was to show both that node can script with the best of them, and to impart some tips and tricks when scripting with node including:

- Don't create a new project for each new script
- Reuse project dependencies
- Use a git ignored folder ( e.g. `output` ) for scripting and experimenting
- Use whatever library, technique, tactic will get the task done in the least time.
- Don't obsess over small details (e.g. outdated library versions) except if it makes the script unreliable or flaky (e.g. paginated data).
- Keep side effects out of the top level scope, it's easier to test, share and extend functionality.
- And finally: Test frequently.

For me, I'll be adding a new script that uses the built-in `readline` module.   That second script will parse the outputted json log lines to analyze the data and parse ids.  From there, I'll probably pipe that into a postgres or sqlite database for long term querying.

Node.JS has a lot of great built ins and a huge library ecosystem.  With some discipline and know how - it can be an incredibly powerful scripting language.

I hope you found that interesting and helpful.

Happy Scripting!