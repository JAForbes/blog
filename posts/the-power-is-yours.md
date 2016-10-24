Fantasy Land: The Power is Yours!
=================================

This post is directed at anyone who is interested in the Fantasy Land specification but perhaps feels unqualified to discuss it or engage with the community.  Functional Programming is for everyone, and so is Fantasy Land.  Fantasy Land is for the JS community to build upon when designing libraries, frameworks and the language itself.  Fantasy Land benefits as both a community and a specification from the participation of every developer, from every discipline.  

> Fantasy Land is a specification for supporting Algebraic types in Javascript.  Algebraic types are just data structures that obey some laws.  
>
> If you use Observables, Promises, Arrays or Strings you are already using Algebraic types (or something very close) without realising it.
>
> The Fantasy Land spec codifies a standard for different types within the context of Javascript.  Many libraries implement the spec, and the community is constantly growing.
> 
> If you have never heard of Fantasy Land and it sounds interesting to you, I've written a post that explains the benefits. 
> The post is written without the assumption that the reader is interested in functional programming.
>
> You can read it here: [The Perfect API](https://james-forbes.com/?/posts/the-perfect-api)

I've seen lots of interest in supporting Fantasy Land in mainstream libraries.  I've seen activity on twitter, likes / hearts on github issues, people messaging me about fantasy land on gitter, google analytics on blog posts etc.

At the time of writing, supporting Fantasy Land in Lodash is the 2nd most popular feature request [sorted by thumbs up](https://github.com/lodash/lodash/issues?q=is%3Aissue+is%3Aclosed+sort%3Areactions-%2B1-desc) and the most requested feature when [sorted by hearts](https://github.com/lodash/lodash/issues?q=is%3Aissue+is%3Aclosed+sort%3Areactions-heart-desc)

The Front End Virtual DOM framework, [Mithril](http://mithril.js.org/) is including [Fanstasy Land compatible streams](https://github.com/lhorie/mithril.js/blob/rewrite/docs/prop.md) in its upcoming 1.0 release.

These libraries and their communities are not satelites of Ramda, they are separate communities showing interest in Algebraic types.

I've received a lot of feedback and support from those in the larger JS community 
that they are interested in using functional datastructures in their day to day work, but that feedback
is rarely translated into words in public forums.

It is fine to support communities in whatever way is comfortable, and please continue to do so!
But I'm inferring the majority of that quiet support is coming from people who want JS 
to be more functional, but don't feel qualified to weigh in.  I've also heard JS devs explicitly state they feel unqualified to engage with the FL community and any discussions surrounding it.  I want to address that notion.

I understand that Functional programming is intimidating, (despite how friendly the community can be) 
the concepts and vernacular are foreign to the majority of JS programmers.

It also doesn't help that some of the greatest minds in programming are drawn to FP, which creates a false impression that you are required be a genius to engage with the community.  I think it is important to publically document our mistakes.

You may feel like you are over your head.  But there is always someone else who could benefit from your knowledge, and teaching is the best way to solidify concepts in your mind.  I would not claim to be an experienced functional programmer in the context of the fantasy land community.  But in many other communities I may be among the most experienced; simply because different communities have different focal points.  There are lots of people who can benefit from your knowledge *today*.

Conversely, experts at functional programming within the Fantasy Land community may not be experienced in other areas where Fantasy Land could be applied.  You might know alot about a field and wish to cross polinate your knowledge with Fantasy Land.  You may have use cases for Fantasy Land that the community has not yet considered, because they are focused on more common applications.  And imporantly the rest of the community may not know your area of expertise to the same degree you do.  

Even simply being inexperienced and inquisitive provides a lot of value to the community.  It is valuable for the community to know where they are being unclear and to address any points of confusion (and there are many).  

I often see conversations within the functional programming community that demonstrate a lack of experience in fields that other JS programmers have.  It is not possible to specialize in every field, logically everyone has gaps in their knowledge, so we can all benefit from increased sharing.  Functional programming isn't owned by anyone, it is for everyone, it can be viewed as a tool.  And we can all learn from eachother by using that tool within our own contexts and communicating our failures and successes.

I use fantasy land data structures, I'm getting there with the basic concepts, but I am in no way an authority on anything fantasy land or functional programming.  But, I still get a lot of value from having a stable consistent logical API.  Even if I don't understand the ramifications of all the laws in the spec to the degree I'd like; it gives me comfort that they aren't arbitrary.  It gives me comfort that I will continue to observe new patterns in existing code that will help me write more concise / correct applications.  I've already experienced this multiple times.  More with less.

In my opinion, people like you and I should be the target audience for the spec.  Far too many people, are putting far too much effort in for it to only benefit a select group of JS devs.  I believe most library authors in the community want their libraries to be used by JS devs of all backgrounds.  By extension I believe the fantasy land spec is there for the JS community at large to build upon.  It is a starting point to hopefully inspire library and spec authors.

So even if you feel over your head, it is worth letting library authors know that supporting fantasy land spec intrigues you.  
In fact, I'd argue it is especially helpful for people who don't feel confident with these concepts to weigh in.
If it only benefited those with extreme understanding, then it would be hardly worth implementing in mainstream libraries at all.

There are many reasons I want mainstream libraries to adopt fantasyland.  But the key reason is that I know that the JS spec is heavily inspired by what the community is doing.  Getting RxJS and Lodash to adopt FL would not only benefit users, but also make more than a ripple in the ECMAScript pond.  So if anyone reading this thinks they would like JS to more readily embrace functional paradigms I encourage you to weigh in - *especially* if you aren't confident as a functional programmer.

We could have a JS with pipleine and composition operators.  We could have a JS with a consistent API for Promises *and* Observables. We could have a JS with native function currying.  We could have a standard library with safe operators that protects us from null pointer exceptions.  We could have an async/await that works on all Monads.  There are so many small additions the language could introduce if the spec committee sees the community engaged in these patterns.  And the best way to influence the spec is to influence mainstream JS libraries.

If you'd like Lodash to support Fantasy Land please [leave a comment here](https://github.com/lodash/lodash/issues/2406).

If you'd like RxJS to support Fantasy Land please [leave a comment here](https://github.com/ReactiveX/RxJS/issues/34).

If you are interested in Fantasy Land and have not yet participated in the community, please join the gitter chat, open an issue on github, ask questions, provide feedback.  No matter what your background or experiences are; your input is valuable.  You are qualified to engage with the community, you are seasoned enough to ask questions, admit failures, acknowledge points of confusion.  We will all benefit from your perspective.


