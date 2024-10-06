import { Feed } from 'feed'
import { getCollection } from 'astro:content';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

const posts = (await getCollection('posts', x => !x.archived)).sort( x => -x.data.created.getTime())

const href = 'https://james-forbes.com'
const author = {
    name: 'James Forbes'
    ,link: 'https://github.com/JAForbes'
}
const feed = new Feed({
    title: 'James Forbes'
    ,description: 'Interested in any type of design and the individual componentry of calcified ideas.'
    ,id: href
    ,link: href
    ,language: 'en'
    ,image: 'https://james-forbes.com/assets/img/bio.jpeg'
    ,updated: new Date()
    ,feedLinks: {
        json: 'https://james-forbes.com/feed/json'
        ,atom: 'https://james-forbes.com/feed/atom'
    }
    ,author
    ,copyright: 'All rights reserved ' + new Date().getFullYear() + ', James Forbes'
})


for( let post of posts ) {
  
    feed.addItem({
        title: post.data.title
        , id: href + '/posts/' + post.slug
        , link: href + '/posts/' + post.slug
        , author: [
            author
        ]
        , content: parser.render(post.body)
        , date: new Date(post.data.created)
    })
}

export function GET(context) {

    const [body, contentType] = context.params.feedType === 'rss'
        ? [feed.rss2(), 'text/xml']
        : context.params.feedType === 'atom'
        ? [feed.atom1(), 'text/xml']
        : context.params.feedType === 'json'
        ? [feed.json1(), 'application/json']
        : [feed.rss2(), 'text/html']

  let res = new Response(body)
  res.headers.set('content-type', contentType)
  return res
}

export function getStaticPaths(){
    return [
        { params: { feedType:'atom' }},
        { params: { feedType:'json' }},
        { params: { feedType:'rss' }},
    ]
}