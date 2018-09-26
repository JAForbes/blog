const m = require('mithril')
m.stream = require('mithril/stream')


module.exports = m('div', {}
    , m('h3', 'James Forbes')
    , m('ul.nav', 
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
