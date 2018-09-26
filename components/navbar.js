const m = require('mithril')
const css = require('bss')
m.stream = require('mithril/stream')


const style = css`
    padding-left: 0em;
    width: 100%;
    display: inline-block;
`
.$nest('>li', css`
    margin: 0em 0.6em 0em 0.6em;
    display: inline-block;
`)


module.exports = m('div', {}
    , m('h3', 'James Forbes')
    , m('ul'+style, 
        m('li'
            , m('a.link.b.black.hover-dark-red'
                ,{oncreate: m.route.link, href: '/' }
                ,'Explore'
            )
        )
        , m('li'
            , m('a.link.b.black.hover-dark-red'
                , { href: 'https://soundcloud.com/peopleofconcept' }
                , 'Listen')
        )
        , m('li'
            , m('a.link.b.black.hover-dark-red'
                , { href: 'https://canyon.itch.io/' }
                , 'Play')
            
        )
        , m('li'
            , m('a.link.b.black.hover-dark-red'
                , { href: 'https://github.com/JAForbes/' }
                , 'Parse')
            
        )
        , m('li'
            , m('a.link.b.black.hover-dark-red'
                , { href: 'https://twitter.com/james_a_forbes' }
                , 'Follow')
            
        )
    )
)
