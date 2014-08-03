Example Post
=========

I want to test if I can integrate a local markdown file
with a tumblr blog.

Why?
----

I like to have diffs on my posts.  But also only like to have a single
source of truth.  I don't want to have to manually keep my blog and
the repo in sync.

I also really like tumblr as a platform.  I like how accessible tumblr's customization
is, and I like there is a very high technical ceiling of possibilities that they didn't take
away from the users.

You can make your page do whatever you want, inject any JS or CSS and even remove the tumblr branding.

I've got a few projects that piggy back tumblr to great effect.

[Zoe Appleseed](http://zoeappleseed.com)'s website is built on top of tumblr's API.  We built
a custom page and gallery and pull her art from the tumblr api.  She can now update the content on
her site by just tagging her posts "seed".  She doesn't have to learn HTML and I don't have to get involved to update her page.

I've also created a few Javascript libraries that I need to battle test, and this is a good way to do that.

How?
----

I am going to write a script that scans my local repository and compares local files to existing posts
on this account.  The script will then either create or edit posts based on the diff between those files and posts.

I am then using github pages to host the page, and tumblr becomes my content management system.

People can still follow and reblog me, and if someone visits the tumblr page, they will just be redirected to the github page.

Can I do this?
--------------

Yes, I will open source this project.  And do a post on this very blog about how to make use of it.

However, I am making a lot of assumptions to avoid the need for configuration files, so you might need to
play around with the code if your use case is different to mine.
