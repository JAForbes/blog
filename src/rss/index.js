import { Feed } from 'feed'
import fs from 'node:fs'

const posts = JSON.parse(fs.readFileSync('posts.json'))
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
        title: post.name
        , id: href + '/' + post.path
        , link: href + '/' + post.path
        , author: [
            author
        ]
        , date: new Date(post.created)
    })
}

fs.mkdirSync('public/feed', { recursive: true })

fs.writeFileSync('public/feed/rss', feed.rss2())
fs.writeFileSync('public/feed/json', feed.json1())
fs.writeFileSync('public/feed/atom', feed.atom1())
