var h = require('../../framework')
var posts = require('../../posts')
var j2c = require('j2c')

var iso = function(date){
    return new Date(date).toISOString().slice(0,10)
}

var style = j2c.sheet({
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
    ,'.nav': {
        paddingLeft: '0em'
        ,width: '100%'
    }
    ,'.nav > li': {
        'margin' : '0em 0.6em 0em 0.6em'
    }
    ,'.nav, .nav > li': {
        'display': 'inline-block',
    }
    ,'.featured ul':{
        listStyle: 'none'
        ,width: '65vw'
        ,float: 'left'
        ,padding: '0em'
    }

    ,'.featured h3': {
        '@media (max-width: 500px)': {
            float: 'left'
            ,width: '100vw'
            ,height: '3em'
        }
        ,'@media (min-width: 501px)': {
            float: 'left'
            ,width: '20vw'
            ,height: '10em'
        }
    }
    ,'.featured li': {
        float: 'left'
        ,width: '20em'
        ,margin: '0.5em'
        ,textAlign: 'left'
        ,verticalAlign: 'bottom'
        ,height: '8em'
        ,padding: '1em'
    }
    ,'.featured ul li:nth-child(5n+1)': {
        backgroundColor: 'hsl(260, 20%, 20%)'
    }
    ,'.featured ul li:nth-child(5n+2)': {
        backgroundColor: 'hsl(270, 20%, 20%)'
    }
    ,'.featured ul li:nth-child(5n+3)': {
        backgroundColor: 'hsl(280, 20%, 20%)'
    }
    ,'.featured ul li:nth-child(5n+4)': {
        backgroundColor: 'hsl(290, 20%, 20%)'
    }
    ,'.featured ul li:nth-child(5n+5)': {
        backgroundColor: 'hsl(300, 20%, 20%)'
    },
    '.posts': {
        width: '100%',
        float: 'left'
    }
    ,'.posts ul': {
        listStyle: 'none'
        ,padding: '0em'
    }
    ,'.posts ul li': {
        padding: '1em'
    }
})

function Post(p){
    return h('a', { props: { href: '?/'+p.path.replace('.md','') }}, [
        h('li', [
            h('p', p.name)
            ,h('i', iso(p.created) )
        ])
    ])
}

function Home(v){
    return v(
        h('div', [
            h('style', String(style) )
            ,h('h3', 'James Forbes')
            ,h('ul', { props: { className: style.nav } }, [
                h('li', [ h('a', { props: { href: '?/' } }, 'Writing') ])
                ,h('li', [ h('a', { props: { href: 'https://soundcloud.com/gazevectors/sets/impossible-lake' } }, 'Music') ])
                ,h('li', [ h('a', { props: { href: 'https://canyon.itch.io/' } }, 'Games') ])
                ,h('li', [ h('a', { props: { href: 'https://github.com/JAForbes/' } }, 'Programs') ])
                ,h('li', [ h('a', { props: { href: 'https://twitter.com/james_a_forbes' } }, 'Twitter') ])
            ])
            ,h('img', { props: { className: style.bio, src: 'img/bio.jpeg'} })
            ,h('p'
                , { props: { className: style.intro } }
                , "Interested in any type of design and the individual componentry of calcified ideas."
             )
            ,h('div', { props: { className: style.featured } }, [
                h('h3', 'Recent Articles')
                ,h('ul',
                    posts.slice(0,4)
                        .map(Post)
                )
            ])
            ,h('div', { props: { className: style.posts+' '+style.featured }  }, [
                h('h3', 'Other posts')
                ,h('ul',
                    posts.slice(4).map(Post)
                )
            ])
        ])
    )
}


module.exports = Home