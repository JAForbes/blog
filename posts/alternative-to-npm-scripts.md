An alternative to npm scripts 
=============================

> This proposal works best for applications where the set of people that build your project are developers, ci, etc.  For node libraries, there are a different set of constraints.  This proposal can still apply for a subset of tasks, but only when you know the environment of the installer (which for node libraries, you can't).

npm scripts are great.  npm's scoping of local binaries to a project is fantastic for deterministic builds that don't rely on ambient environment binaries.

But they aren't perfect.  There are work arounds for every problem, but they are not satisfactory, and yet (prior to thinking of this new approach) I still prefer npm scripts to any other approach to builds that I've seen or used.

So what is great about npm scripts?

- pre/post hooks are a simple low tech alternative to dependency tracking and allows you to ensure code runs before a publish or before an install.
- adding local `node_modules/.bin` binaries to the path allows us to treat local binaries as if they are accessible globally leading to (hopefully) more deterministic build scripts

And what are the problems with npm scripts?

- No comments or line breaks in JSON strings leads to hard to read commands
- On Windows the shell is enforced to be cmd.exe even if bash (native or git bash) is present.  This leads to unnecessary friction for windows devs contributing to node projects (which should be os independent like node itself)
- Composition of scripts is verbose because they must be prefixed by `npm run`, there are libraries that mitigate this but they have their own problems.
- Shell incompatibilities between default shells on various systems including unix like systems leads to subtle problems for contributors and in CI environments.

We want to keep the good, and lose the bad.  There will be trade offs but I think with a few conventions we can reach a very nice compromise.

Node is UNIX
-------------

My suggestion may seem naive, or unrealistic, so before I go into the specifics I want to point out: Node is greatly inspired by unix.  The unix philosophy informs tiny npm modules being composed to form larger systems.  Node's native api takes naming conventions from unix like `fork`, `pipe`, `fs.stat`, `fs.unlink`, `process.stdout` and so on.  Node's stream implementations though imperfect, seek to recreate unix pipes.  Node has always embraced unix, Ryan Dahl in his original presentations frequently presented node in a unix context.  Node event names like `SIGINT` are present on Windows.  Even though Node works well on Windows, it is designed for and influenced by unix.  Node on Windows is a series of adapters to allow Windows to mimic linux (with varying degrees of success).

Node and npm tooling requires an understanding of the terminal. It is taken for granted now that frontend libraries use the terminal, whether its to run `ava`, `mocha`, `tape` and so on, or using `create-react-app` or  `ember-cli`. `browserify`'s entire tool chain is a series of unix pipe's.  Even when we try to avoid the terminal with tools like gulp we end up mimicking unix ideas (unix streams)  because we are creating tools in the image of node which begets unix.

When we design libraries that try very hard to avoid unix conventions they are lambasted as complicated (webpack). 

Node is Unix.  So let's embrace it.

Node is Bash?
-------------

There are many shells out there, zsh, fish, dash, and on and on.  But Bash is the javascript of shell languages.  It is ubiquitious, it is supported everywhere, it is the lingua franca.  If you install Git on Windows, you also install a capable bash simulation.  Windows 10 ships with a native subsystem for linux that makes native calls to win32 api's, and unsurprisingly the first shell/os they supported was Ubuntu and bash.

Bash is preinstalled on OSX, and nearly every linux distribution under the sun.  When its not available, its easily attainable.  Your CI likely runs bash.

Dev tooling is one of the easiest parts of our stack to introduce tech (perhaps even more so than tests) because it doesn't affect our customers.  Even if you work at an enterprise .NET shop with powershell all the way down, there is nothing preventing you from using bash in your company.  If you are using git you probably already have bash on your system even if you are not aware of it.

There's really no excuse, or reason any more to support cmd.exe in npm.  It's the source of countless bugs across countless projects.  It introduces contributor friction and its all because we're assuming that learning bash is not a pre-requisite for using node tooling: maybe it should be.

There's very insidious incompatiblities like `&` indicating a parallel processs in bash, but the equivalent of a semicolon under windows. 

We can use npm modules that emulate bash functionality, but without using bash directly it will be difficult to support a suite of useful operations.

I'm not saying node shouldn't run on windows, I'm saying npm shouldn't run on windows.  And at the very least, your team should only use bash for its build tooling.

The current state of the art
-----------------------------

Let's say we have a `package.json` that uses browserify, tape.  We're going to use `npm-run-all` to run multiple jobs in parallel and `mkdirp` to create required folders.  If you use `mkdir -p` on windows you'll create a directory called `-p`.

We're going to handle both dev and production bundling, with minification and transpilation.  It's still going to be simpler than most projects tend to be.  I'm ignoring steps like deployments, css concentation and even caching mitigating.  But hopefully complicated enough to see the benefits of the proposal.

We install our dev dependencies locally and write our scripts like so:

```json
{
  "scripts": {
    "preinstall": "mkdirp dist",
    "start": "npm-run-all --parallel dev:**",
    "dev:watch": "watchify client/index.js -o dist/bundle.js",
    "dev:serve": "serve dist",
    "dev:api": "nodemon server/index.js",
    "prod": "npm-run-all prod:**",
    "prod:dist": "browserify client/index.js | buble | uglifyjs -mc > dist/bundle.js"
  }
}
```

We can run our app via `npm start` and all our dev processes will run in parallel.  This will work fine on all operating systems thanks to `mkdirp` and `npm-run-all`.  Both of those libraries exist because we can't rely on unix patterns reliably on windows.

For example, if we were using bash, instead of `npm-run-all` we could simply write:

```json
{
  "start": "npm run dev:watch & npm run dev:serve & npm run dev:api"
}
```
Which would run each job in parallel.  The verbosity is a secondary problem `npm-run-all` solves, but without that we'd be left with:

```json
{
  "start": "dev:watch & dev:serve & dev:api"
}
```

And the `dev` prefix only exists to enable `npm-run-all` to do glob matching. Without those prefixes it's simply:

```json
{
  "start": "watch & serve & api"
} 
```

When we compare: `watch & serve & api` and `npm-run-all dev:**` we can see, in the same number of characters we get a lot more information about what that command does.  Without the problems of cross platform compatibilities and npm conventions we can see a beautiful API waiting to be used.

So how do we solve the cross platform and npm verbosity, we write a single bash script, with a simple convention.  A bash script named `run` that contains top level functions and evals a function name at the end of the file.

The Proposal and Pattern
------------------------

In short, we can solve these problems by using bash.  But not bash as we commonly think of it, with lots of variables and edge cases.  We'll only use bash functions (which are actually super cool). 

```bash
#!/bin/bash

# Add npm binaries to path
export PATH=./node_modules/.bin:$PATH

function preinstall(){
  # -p works because it's bash
  # only install if dist created
  mkdir -p dist
}

function install(){
  preinstall && npm install
}

function start(){
  # run each function in parallel
  watch & serve & api
}

function dist(){
  # we can even break things up onto their own lines
  browserify client/index.js \
    | buble \
    | uglifyjs -mc \
    > dist/bundle.js
}

# When we add deployments and other prod jobs, we can add them here
function prod(){
  dist
}

# Run a function name in the context of this script
eval "$@"
```

```js
bash run start
```

Benefits:

- Cross platform (thanks to git bash/windows sub system for linux)
- Comments!
- No escaping quotes
- Similar local binary semantics
- Similar api `npm run test` becomes `bash run test`
- With tools like shellcheck we can catch bugs in our commands at write time not run time.
- Succinct composition
- Low tech, low impedenance mismatch

Migration
---------

We can now call our bash script from our package.json to support both forms while migrating.

```json
{
  "scripts": {
    "preinstall": "bash run preinstall",
    "start": "bash run start",
    "prod": "bash run prod*"
  }
}
```

What about ...
---------------

#### What about Node Libraries?

A library may target node and the browser, but the majority of your scripts will be focused on things other than running in node.  Usually to get your source to run in node, you don't have to do anything at all.  It's sensible to move all your non node stuff into a `bash run` script, and keep the bare minimum required to install your library in node as npm scripts.  It's likely the lionshare of your build scripts are unrelated to a node user installing your library as dependency.  Things like tests, coverage etc definitely can make assumptions about the dev environment because only your contributors will be running those scripts.

#### What about make?

In my opinion using `make` tends towards fighting assumptions that don't apply to interpreted languages.  `make` leans on bash (which is good) but it's own extensions to the syntax can lead to esoteric exercises that don't have a lot of value beyond `make` itself.  Build tools should be obvious and simple and trivial to alter.  `make` is also quite painful for contributors using windows.

#### What about calling separate script files from npm scripts?

This is a pretty common suggestion, but in practice it's fairly cumbersome.  Separating each script into it's own file leads to duplication of behaviour, more documentation, more boilerplate.

Keeping all our scripts in one place is one of the best lessons I think we can learn from npm scripts

#### What about Grunt/Gulp doing it all in JS?

JS isn't very good at procedural code.  To do basic tasks that bash can do out of the box requires installing several libraries, and inevitably each project uses different approaches to do the same thing.  Its possible, but picking the best language for a given task is advisable I think.

#### What about X,Y,Z?

This is all my opinion.  Every project is different, different people have different priorities.  This approach suits me well and solves my problems.  It may not do the same for you, and that's a good thing!

Cool Tricks
-----------

#### source run

If you have a particular tab in your terminal dedicated to running scripts, you may want to run `source run` and move those build functions into your ambient environment, so that you can simple type `install && test && start` instead of `bash run install && bash run test && bash run start` you also get tab completion for free, because that's how bash works.

#### -x for verbose logging

If you want to log out the execution of your `run` script itself (instead of just the stdio of the sub processes) you can run `bash` with the `-x` option.  e.g. `bash -x run start`.

> -x

>    Print a trace of simple commands, for commands, case commands, select commands, and arithmetic for commands and their arguments or associated word lists after they are expanded and before they are executed. The value of the PS4 variable is expanded and the resultant value is printed before the command and its expanded arguments.

[Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)


Bash: The good parts
---------------------

We can embrace unix without having to leave node conventions in the dust.  npm scripts are a great simple tool with powerful semantics.  I really like them.  But from now on, I'll be using the above pattern because it solves all the problems I have with npm scripts.

There's room for improvement, we could automatically generate tab completion for bash scripts that use this style.  We could extend this approach in a myriad of ways.  But I think this pattern alone allows us to use `package.json` as just project meta data and move our build logic into it's own file.  Because it's just vanilla bash we can lint it with shellcheck and get little benefits like comments and syntax highlighting.

I hope this post has given you some ideas for your own projects.

> If you have any thoughts, questions or comments please feel free to reach out on twitter [@james_a_forbes](https://twitter.com/james_a_forbes)