/* globals addEventListener, history */
const stream = require('mithril/stream')
const dropRepeats = require('./drop-repeats')
const $ = require('hickery')

const superouter = require('superouter')

const Route = superouter.type('Route', 
    { List: '/'
    , Post: 'posts/:path'
    }
)

// eslint-disable-next-line no-undef
const getPath = () => location.pathname
const formatPath = path => path
const $route = f => o => Object.assign({}, o, { route: f(o.route) })
const toURL = Route.toURL
const fromURL = url => 
    Route.matchOr( () => Route.of.List(), url )

const link = 
    update => route => vnode => {
        const symbolicHref = toURL(route)
        const realHref = formatPath( symbolicHref )
        vnode.dom.href = realHref

        vnode.dom.addEventListener('click', function(e){
            e.preventDefault()
            update( $route( () => route ) )
        })
    }

const startURL = url => {
        
    const popstates = stream()

    dropRepeats (x=>x) (url) .map(
        (url) => {
            if( url !== getPath() ){
                history.pushState({}, '', formatPath(url))
            }
            return null
        }
    )
    
    addEventListener(
        'popstate', () => popstates(getPath())
    )
    
    return popstates
}

const start = model$ => {

    const url$ =
        model$.map( 
            model => [model]
                .flatMap($.select($route))
                .map( x => toURL(x) )
                .shift()
        )


    return startURL( url$ )
        .map( 
            url => [url]
                .map(fromURL)
                .map($.compose($route,$.set))
            .shift()
        )

}

module.exports =
    { getPath
    , formatPath
    , $route
    , toURL
    , fromURL
    , link
    , Route
    , start
    }