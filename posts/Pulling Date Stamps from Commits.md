Pulling Datestamps from commits and formatting them with moment.js
==================================================================

Date stamps are working.  I tried to use [John Resig's pretty date script](http://ejohn.org/blog/javascript-pretty-date/)
, which is pretty nice, but is only suited for twitter-like situations, because the longest description it has is 'n weeks ago'.

So I googled some more and found moment.js, which is mind blowingly good.  Reminds me of Python's date support.

I am getting the date stamps from file commits for a particular blog post.  The post date is the earliest commit, and the updated date is the most recent commit.

I'd like to have a wordpress style archive widget on the left.  For now I am just listing by title.

I am suprised how quick that has come together.