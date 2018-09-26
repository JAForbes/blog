const m = require('mithril')
const navbar = require('./navbar')
const css = require('bss')
const Posts = require('./posts')

const strings = {
    bio: 
        ["Interested in any type of design"
        ,"and the individual componentry of calcified ideas."
        ]
        .join(' ')
}

function Home(){
    return {
        view: () => m('div'
            ,navbar
            ,m('img'
                + css.br('100%').maxWidth('8em'), 
                { src: 'img/bio.jpeg'}
            )
            ,m('p'
                + css
                    .boxSizing('border-box')
                    .p('1em')
                    .maxWidth('20em')
                    .margin('0 auto')
                , strings.bio
            )
            ,m(Posts)
        )
    }
}


module.exports = Home