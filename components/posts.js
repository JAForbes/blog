const css = require('bss')
const m = require('mithril')
m.stream = require('mithril/stream')
const { maybe } = require('static-sum-type/modules/yslashn')
const { bifold } = require('static-sum-type')

const iso = function(date) {
    return new Date(date).toISOString().slice(0, 10);
}

const { Route, Router } = require('../src/route')


const Loaded = maybe('Loaded')

css.setDebug(true)

const style = {
    featured: css({})
        .$nest('ul', `
            list-style: none;
            width: 65vw;
            float: left;
        `)
        .$nest('h3',
            css
                .$media('(max-width: 500px)', `
                    float: left
                    width: 100vw
                    height: 3em
                `)
                .$media('(min-width: 501px)', `
                    float: left
                    width: 20vw
                    height: 10em
                `)
        )
        .$nest('li', css`
            float: left;
            width: 20em;
            text-align: left;
            margin: 0em 0.5em;
            vertical-align: bottom;
            height: 8em;
            padding: 1em;
        `)
    , posts: css`
        width: 100%;
        float: left;
    `
        .$nest('ul', css.listStyle('none').p('0em') )
        .$nest('ul li', css.p('1em'))
}

const Post = update => () => p => 
    m("a",
        { oncreate: 
            Router.link 
                ( update ) 
                ( Route.of.Post ( 
                    { path: 
                        p.path.split('/').slice(-1).shift().replace('.md', '') 
                    }) 
                )
        }
        , m("li"+css.grow 
            + css.bc( p.featured && 'black' ).c(p.featured && 'white')
            , m("p", p.name)
            , m("i", iso(p.created))
        )
    )

const getLoadedPosts = model => 
    bifold (Loaded) (() => [], xs => xs) (model.posts)

module.exports = 
    update => model => m("div"
        , m("div"+style.posts + style.featured
            , m("h3", "Recent Articles")
            , m("ul"
            , getLoadedPosts(model).slice(0, 4)
                .map( Post (update) (model) )
            )
        )
        , m("div"+style.posts + style.featured
            , m("h3", "Other posts")
            , m("ul"
                , getLoadedPosts(model).slice(4)
                    .map( Post (update) (model) )
            )
        )
        )