const m = require('mithril')
const css = require('bss')
m.stream = require('mithril/stream')

const links =
    [ ['Explore', '/']
    , ['Listen', 'https://soundcloud.com/peopleofconcept']
    , ['Play', 'https://canyon.itch.io/']
    , ['Parse', 'https://github.com/JAForbes/']
    , ['Follow', 'https://twitter.com/james_a_forbes']
    ] 

const style = 
    css`
        padding-left: 0em;
        width: 100%;
        display: inline-block;
    `
    .$nest('>li', css`
        margin: 0em 0.6em 0em 0.6em;
        display: inline-block;
    `)


module.exports = () => () => 
    m('div'
        , m('h3', 'James Forbes'),
        [ links ]
        .map(
            xs => xs
                .map(
                    ([title, href]) => 
                        m('a', 
                            { href 
                            }
                            , title
                        )
                )
                .map( x => m('li'+css.grow, x) )
        )
        .map( xs => m('ul'+style, xs ) )
    )
