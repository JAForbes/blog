const m = require('mithril')
m.stream = require('mithril/stream')
const navbar = require('../navbar')
const css = require('bss')
const Posts = require('../posts')

const strings = {
    bio: 
        ["Interested in any type of design"
        ,"and the individual componentry of calcified ideas."
        ]
        .join(' ')
}

const style = {
    bio: css`
        border-radius: 100%;
        max-width: 8em
    `
    ,intro: css`
        box-sizing: border-box;
        padding: 1em;
        max-width: 20em;
        margin: 0 auto;
    `
}

function Home(){
    console.log('Home')
    return {
        view: () => m('div'
            ,navbar
            ,m('img'+style.bio, { src: 'img/bio.jpeg'})
            ,m('p'+style.intro
                , { className: style.intro }
                , strings.bio
            )
            ,m(Posts)
        )
    }
}


module.exports = Home