const posts = require("../posts");
const css = require('bss')
const m = require('mithril')
m.stream = require('mithril/stream')
const iso = function(date) {
    return new Date(date).toISOString().slice(0, 10);
};

const style = {

    featured: css({})
        .$nest('ul', css`
            list-style: none;
            width: 65vw;
            float: left;
        `)
        .$nest('h3',
            css
                .$media('(max-width: 500px)', css`
                    float: left
                    width: 100vw
                    height: 3em
                `)
                .$media('(min-width: 501px)', css`
                    float: left
                    width: 20vw
                    height: 10em
                `)
        )
        .$nest('li',
            css`
                float: left;
                width: 20em;
                margin: 0em;
                textAlign: left;
                verticalAlign: bottom;
                height: 8em;
                padding: 1em;
            `
        )
    , posts: css`
        width: 100%;
        float: left;
    `
        .$nest('ul', `
            list-style: none;
            padding: 0em;
        `)
        .$nest('ul li', `
            padding: 1em;
        `)
}

function Post({ attrs: {p}}) {
    return {
        view: () => m("a",
            { oncreate: m.route.link
            , href: '/' + p.path.replace(".md", "")
            }
            , m("li.grow",
                { class: { "bg-dark-red": p.featured, white: p.featured } }
                , m("p", p.name)
                , m("i", iso(p.created))
            )
        )
    }
}

module.exports = {
    view: () => m("div"
        ,m("div"+style.featured
            ,m("h3", "Recent Articles")
            ,m("ul", posts.slice(0, 4).map( p => m(Post, { p }) ))
        )
        ,m("div"+style.posts + " " + style.featured, 
            m("h3", "Other posts"),
            m("ul", posts.slice(4).map( p => m(Post, { p })))
        )
    )
}
