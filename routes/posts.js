var h = require('../framework')
var posts = require('../posts')
var j2c = require('j2c')

var iso = function(date){
    return new Date(date).toISOString().slice(0,10)
}

var style = j2c.sheet({
     '.featured ul':{
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
    ,'.posts': {
        width: '100%',
        float: 'left',
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
    return h('a', url.anchor('/'+p.path.replace('.md','')), [
        h('li.grow', { class: { 'bg-dark-red': p.featured, 'white': p.featured }}, [
            h('p', p.name)
            ,h('i', iso(p.created) )
        ])
    ])
}


module.exports = h('div', {}, [
    h('style', {}, String(style))
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
