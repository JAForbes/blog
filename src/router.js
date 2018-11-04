/* globals addEventListener, history */

const stream = require('mithril/stream')
const dropRepeats = require('./drop-repeats')

const $ = 
    { set: x => () => x
    , compose: (...fns) => (...xs) =>
        fns.reduceRight( (p,n) => [n(...p)], xs) [0]

    , select: f => o => {
        const r = []
        f( ( x ) => {
            r.push(x)
            return x
        } )(o)
        return r
    }
    }




function Router({ toURL, fromURL, getPath }){

    const $route = f => o => Object.assign({}, o, { route: f(o.route) })
    
    const initial = o => $route($.set(fromURL(getPath()))) (o)

    const link = 
        update => route => vnode => {

            console.log({ route, 'toURL(route)': toURL(route) })
            vnode.dom.href = toURL(route)

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
                    history.pushState({}, '', url)
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

    return { 
        link
        , start
        , initial
    }
}

module.exports = Router