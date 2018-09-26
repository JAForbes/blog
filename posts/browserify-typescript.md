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

declare var require : any;
const common = require('./common')
import harmony from './harmony'

export common
export harmony
```

Okay, now let's build our project.

First we need to let typescript know that it's okay to mix JS and TS files in our project.
So we need to create a `tsconfig.json` file.

```
tsc --init
```

The above command will create a template file in your root.
Open it up and add the line:

```json
//tsconfig.json
{

  "compilerOptions": {
      "module": "commonjs",
      "target": "es5",
      "noImplicitAny": false,
      "sourceMap": false,
      "allowJs": true // <-- add this line
  }
}
```

Now define the following script in your `package.json`


```json
//package.json
{

  "scripts" : {
    "compile": "browserify -p tsify index.js -o bundle.js"
  }
}
```

Now at the command prompt run:

```
npm run compile
```

And you're done.

#### Watch files for changes

If you want to watch files for changes, you just use watchify instead of browserify.

```
npm install watchify --save-dev
```

Now in your `package.json` add a new script:

```json
//package.json
{

  "scripts" : {
    "compile": "browserify -p tsify index.js -o bundle.js"
    "watch" : "watchify -p tsify index.js -o bundle.js"
  }
}
```

And then run `npm run watch`.

#### Add type information to your local Common JS files

If you want to add type information to your JS files you can create a `.d.ts file with the same name in the same directory as your module.  Typescript will use those annotations instead of inferring types itself.

Note, this technique works even if you aren't using typescript.  You can add definition files to JS projects and editors like VSCode will use them automatically without any config files.

#### Add type information for libraries

This is in flux at the moment.  There are 3 ways to do it : Definitely Typed, typings and npm with the @types namespace.
I think I'll write more about this when the dust settles.  For now, I use `typings`

The trick is, to first use `typing search <packagename>` to see which repository it is in.  Then when you install you need 
to prefix the package name with the repository name and a tilde.  E.g.

```
typings install dt~mithril --save
```

Like I said, it's a bit of a mess.  But it will be better soon.
That said, other than the weird installation experience, the type definitions themselves are very useful.

I also write inline definitions for libraries myself and import them using the `ref` syntax.

E.g. if I had a custom type annotation file for `ramda` in the same directory as my typescript file, I could write:
`/// <reference path="ramda.d.ts" />` to bring my custom type annotations into scope.
