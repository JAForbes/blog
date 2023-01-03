What isn't a Monad?  And why doesn't it matter?
===============================================

> Some people have said to me they were deeply disappointed that this wasn't a real intro to Monads.  I'm sorry for misleading you.  I've added some links to some actually useful resources at the end of this post.

Look.  Nobody knows what a Monad is.  Really.

Why do you think Haskell's package manager is called Cabal?  It's because there's a cabal of computer scientists making up words and seeing if we actually read their papers or instead just blindly believe everything Bartosz Milewski blogs and follows along (spoiler: that's what we do.)

People don't actually read FP papers. People who think they understand FP papers are people *positive* that they know the names of constellations.  They don't.  They just made it up and no-one ever corrected them.  Yes, I'm Sirius, people who read FP papers are people who read tea leaves.  There's no punch line there, that's just something I noticed.

What we should be discussing is what a Monad isn't.  Because learning what a Monad is, is a side effect.  You might learn what it is and then do stuff.  And Monad's are about never doing things.  So explaining what one is, would be a proof by contradiction...

See!  You didn't even read that.  Let's see what Brian Lonsdorf and Hardy Jones says on the topic:

	Hardy: "Hi!"
	
	Brian: "Hi!"
	
	Hardy and Brian: "Hi!"
	
No no, after that.  


	Hardy: "Hi!"
	
	Brian: "Hi!"
	
	Hardy and Brian: "Hi!"
	
Just skip 20 mins in.  It's really good...

	Brian: "You get a Profunctor"

	Hardy: "Yeah"

	Brian: "And you dot chain the comonad"

	Hardy: "Yeah"

	Brian: "And you take the inverse procopromonad"

	Hardy: "*Sips Whisky* Yeah"

	Brian: "And you over throw capitalism"

	Hardy: "Yeah"

	Brian: "By replacing the automatons with Sage Crystals"

	Hardy: "Yeah.  Wait what are you talking about dude?"

	Brian: "Because all we are doing by writing code is accelerating the robopocalypse"

	Salesforce Representative: 
	  "DrBoolean in no way speaks on behalf of Salesforce and the Salesforce Robopocalypse."


Truly.

So what do we do?  Do we go back to writing for loops?

OF COURSE NOT

So what then?

1. Describe what you want to do
2. Give it to Haskell
3. When you get some type errors go on Stack Overflow and ask for help
4. When people berate you for your ignorance - open a python shell
5. Write a program that prints random mathematical symbols, greek letters and escape codes
6. Surround the garbage with lorem ipsum and PUBLISH A PAPER.
7. Wait for Elm to implement your program intuitively.
8. Run the elm-package
9. It outputs... 

	You are in a room.  A room without walls.  You are alone in the darkness.  In the absence of anything.  You have achieved complete understanding.  You have arrived nowhere.  

10. Quit the program.
11. WAKE UP!  You were dreaming.  There was no program and there was no output.

Our program doesn't do anything.  Our program doesn't exist!  We live in a simulation.  Powered by blood transfusions - of children.  DELICIOUS!

That's the point, that's the point.  0 Side Effects.

![](http://i.imgur.com/Dy2zrr7.jpg)

See Monads are Burritos.  You don't *eat* burritos, you give the burrito to a friend and the friend eats the Burrito.  It's the same thing with Monads.

You don't eat Monads, you write a paper about them and actually you know what...

BREAKING NEWS BREAKING NEWS BREAKING NEWS 

Rememeber Monads?  Well FORGET THEM.  Because now we have Free Monads.

What is a Free Monad?

It's exactly like a Burrito.  But instead of giving it to your friend.  You tell your friend the Burrito you'd like to have, then they make the Burrito *for you* then you give the Burrito back to them and *they* eat it.  

Oh and its Free hermano.

The remainder of this briefing will be encoded via lambda calculus.

 (λg.λh.h (g f)), then T(n)(λu.x) = (λh.h(f(n−1)(x)))
 
Thank you for your [side effect redacted]

#### What a Monad actually is

A Monad, in the context of software, is an interface for writing sequential code.  That interface includes some laws.  Laws are just rules that you have to follow to call your code a Monad.  Those laws are pretty straight forward and are useful because they guarantee behaviour in a lot of different contexts.

The reason people say Monads "are actually really easy" with a straight face is because it is just a list of behaviours that are and aren't allowed.  And following that list doesn't require any understanding of category theory at all.  In a way, learning what a Monad is, is sort of useless information without knowing why it's useful.

So what a Monad *is*, is only half of the story.  Why a Monad is useful, and how to use them, is potentially a more  approachable and useful topic.  Here's a few resources on how Monad's can be useful. 

- A justification and introduction of Algebraic types: http://james-forbes.com/?/posts/the-perfect-api
- A demonstration of Algebraic types for managing branching logic [Railway Oriented Programming](https://vimeo.com/97344498)
- My demonstration of Array methods as an intro to the Maybe Monad: http://james-forbes.com/?/posts/versatility-of-array-methods
- A free online book walking through FP and using Algebraic types in Javascript: Dr Boolean's [Mostly Adequate Guide]( https://github.com/MostlyAdequate/mostly-adequate-guide)
- Tom Harding's walkthrough of every single Typeclass in the Javascript Algebraic Type standard: Fantasy Land http://www.tomharding.me/2017/03/03/fantas-eel-and-specification/

#### Apologies and Footnotes

- Brian and Hardy's [podcast](www.magicreadalong.com) is actually a great resource for learning FP and not anti robo-armageddon propaganda.
- [Bartoz Milewski's](https://bartoszmilewski.com/) somehow clearly distills the most esoteric mathematical concepts into light reading.  No small feat and highly recommended.
- Lots of people do read FP papers, they are real, they are smart.  If you find it a struggle don't fret, I absolutely cannot read them and so this article is just me projecting.
- What's with Burritos?  It's best not to ask.  But you did so here's a link to one of the [least helpful resources on Monads](https://www.youtube.com/watch?v=b0EF0VTs9Dc) by Doug Crockford.
