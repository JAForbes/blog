var h = require('../framework')
var j2c = require('j2c')

var style = j2c.sheet({
    '.nav': {
        paddingLeft: '0em'
        ,width: '100%'
    }
    ,'.nav > li': {
        'margin' : '0em 0.6em 0em 0.6em'
    }
    ,'.nav, .nav > li': {
        'display': 'inline-block'
    }
})




module.exports = h('div', {}, [
    h('style', String(style))
    ,h('h3', 'James Forbes')
    ,h('ul', { props: { className: style.nav } }, [
        h('li'
            ,[ h('a.link.b.black.hover-dark-red'
                , url.anchor('/'),
                 'Explore'
                ) 
            ]
        )
        ,h('li'
            , [ h('a.link.b.black.hover-dark-red'
                , { props: { href: 'https://soundcloud.com/peopleofconcept' } }
                , 'Listen') 
            ]
        )
        ,h('li'
            , [ h('a.link.b.black.hover-dark-red'
                , { props: { href: 'https://canyon.itch.io/' } }
                , 'Play') 
            ]
        )
        ,h('li'
            , [ h('a.link.b.black.hover-dark-red'
                , { props: { href: 'https://github.com/JAForbes/' } }
                , 'Parse') 
            ]
        )
        ,h('li'
            , [ h('a.link.b.black.hover-dark-red'
                , { props: { href: 'https://twitter.com/james_a_forbes' } }
                , 'Follow') 
            ]
        )
    ])
])
