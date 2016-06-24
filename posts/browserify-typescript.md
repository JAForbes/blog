Easy Typescript Workflow
========================

I spent a lot of time trying to figure out how to get typescript workflow 
that doesn't require generating separate JS files for every TS file.

I won't go into all the hurdles I ran into, I will just show the answer.

It turns out its actually very simple.

We're going to use the browserify plugin `tsify`.  

Browserify is a module bundler.  It allows you to turn many separate files into a single output that can be consumed
by the browser.

So let's install that incase you haven't already:

```
npm install browserify --save-dev
```

Some people install devtools as globals, but I prefer my `package.json` to explain exactly how to build a project.

Now let's install `typescript` and `tsify` locally (for the same reason)

```
npm install typescript tsify --save-dev
```

Great.  We can now build typescript projects.  But first you need a typescript entry point.

A lot of tutorials assume you are writing a typescript project, but its much more likely you have a JS project and you want to 
write a few typescript files to try it out.  If you try this, you'll run into a few issues.

Let's create a few js files, a ts file and a js entry point.  This will demonstrate a few problems and how to resolve them.

```js
//common.js

function hello(){
  console.log('hello from commonJS')
}

//how we export files Node style
module.exports = hello
```

```js
//harmony.js

export default function hello(){
  console.log('hello from es6')
}
```

```tsc
//typescript.ts

const common = require('./common')
import harmony from './harmony'

export common
export harmony
```

```js
//index.js

import ts from 'typescript'

ts.common() // logs "hello from commonJS"
ts.harmony() // logs "hello from es6"
```

Notice we've got 2 different module styles.  ES6 modules and commonJS.  If you are using es6 modules, everything will work perfectly.
But if you are using commonJS at compile time you'll get an error like `cannot find name "require"`.

Typescript is just complaining because require is used but not defined.  A simple solution is to declare `require` as `any`

```tsc
//typescript.ts

const common = require('./common')
import harmony from './harmony'

export common
export harmony
```
