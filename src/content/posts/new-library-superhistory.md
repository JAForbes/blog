---
title: "New library: superhistory"
subtitle: A small nestable wrapper around the history API
created: 2024-01-01
featured: false
archived: false
tags:
    - routing
    - programming
    - library
    - js
---

I've recently been pretty active creating little micro libs as I wanted to have some small self contained, well tested atoms that I could stick together to give me confidence in a larger system.

So there'll probably be a series of posts over the next few weeks walking through some of these libraries.

The first is *`superhistory`*.

### Why?

*`superhistory`* came about when I was working on nesting routers.  There's not a lot you have to do when nesting routers, but its important each piece is absolutely rock solid as there is a cyclic dependency 


```mermaid
graph LR
    A[State Update]-->B[Browser History Update]
    B[Browser History Update]-->A[State Update]
    
```

If your path normalization is wrong you can end up with an infinte loop.

So I thought, best to write some tests and put it in its own little library.  


### The basics

The history API is the corner stone of single page apps.  Before we had the history API we had to rely on hacks to update the URL without triggering a page reload.

The API is pretty simple but also not exactly pretty.  There are three functions I usually use:

- `history.pushState(state, _, url)`
- `history.replaceState(state, _, url)`
- `history.back()`

`pushState` adds a new entry to the browsers history and updates the URL.  `replaceState` replaces the current entry in the browsers history and updates the URL.  And `back` acts as if the user hit the `back` button.

In *`superhistory`* we have a single method `superhistory.go(path: string)`, by default it internally calls `pushState`, but if you want to instead replace the history state you can pass an options object `superhistory.go(path, { replace: boolean })`.

We also alias `back`, so `superhistory.back()` does what you expect.

> 🤓 Note we don't offer access to history's `state`, that's simply because I never use it.  Maybe in future we can add it to the options object.
> PR's welcome.

At any time, you grab the current history state via `history.get()` it returns `{ path, fullPath }`.  For the top level router both properties have the same value, we'll get into the difference in a minute.

### Reacting to changes

When you initialize the `superhistory` instance you can optionally pass in an `onChange` handler.  This callback will be executed when the user messes with history (`onpopstate`), but it also notifies you when your code triggers a route change via `go`.

At first this may seem kind of pointless, as you likely know when you changed the route seeing as you are the one that wrote the code.  But `superhistory` allows you to have nested history instances, and any one of them can trigger a route change so it is helpful to be able to subscribe to all changes from any instance in one place.

```typescript
import Superhistory from 'superhistory'

const superhistory = Superhistory({
    onChange({ path }){
        console.log('history changed', path)
    }
})
```

### Nesting History

After you've created an instance, let's say you routed to the settings page:

```typescript
superhistory.go('/settings')
```

Now we may want a `Settings` component to have access to the history API.  We can give it a new history instance that prefixes any route commands it makes with `/settings`.

If the component navigates to `/theme/darkmode` the browser actually navigates to `/settings/theme/darkmode`.

Easy:

```typescript
const settingsHistory = superhistory.child({ prefix: '/settings' })

settingsHistory.go('/theme/darkmode')

settingHistory.get()
// { path: '/theme/darkmode', fullPath: '/settings/theme/darkmode' }
```

And you can keep nesting:

```typescript
const themeHistory = settingsHistory.child({ prefix: '/theme' })

themeHistory.set('palette')

settingHistory.get()
// { path: '/theme/palette', fullPath: '/settings/theme/palette/' }
```

### Polymorphic

Wherever we are in the app, we shouldn't need to know if we are dealing with the root router or a child router.  So the API is deliberately polymorphic.

For example, if you want to render an anchor tag, both instances have a `preview` method that will render the fully qualified url (not just the path), taking into account any prefixes along the way from cascaded nested history's.

```typescript
h('a', { href: themeHistory.preview() }, 'Change Color Palette')
// h('a', { href: "https://example.com/settings/theme/palette" }, 'Change Color Palette')
```

### Not a router

There are a few other little utilities, but that is essentially all *`superhistory`* does.  It is just there to remove some footguns and make working with the history API a little bit more intuitive (at least for me).

But *`superhistory`* is not a router, a router can pattern match a URL and convert it into associated data.  And there'll be another post soon on a big update to *`superouter`*.
