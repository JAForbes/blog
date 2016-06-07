var h = require('../../framework')
var style = require('../../css/style.css.js')
var navbar = require('../navbar')
var j2c = require('j2c')
var posts = require('../posts')

var R = require('ramda')

var style = j2c.sheet(R.merge( style, {
    '.bio': {
        'border-radius': '100%'
        ,'max-width': '8em'
    }
    ,'.intro': {
        boxSizing: 'border-box'
        ,padding: '1em'
        ,maxWidth: '20em'
        ,margin: '0 auto'
    }
}))

function Home(v){
    return v(
        h('div', [
            h('style', String(style) )
            ,navbar
            ,h('img', { props: { className: style.bio, src: 'img/bio.jpeg'} })
            ,h('p'
                , { props: { className: style.intro } }
                , "Interested in any type of design and the individual componentry of calcified ideas."
             )
             ,posts
        ])
    )
}


module.exports = Home