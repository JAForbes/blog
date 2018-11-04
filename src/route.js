const superouter = require('superouter')

const Router = require('./router')

const Route = superouter.type('Route', 
    { List: '/'
    , Post: '/posts/:path'
    }
)

const toURL = Route.toURL
const fromURL = url => Route.matchOr( () => Route.of.List(), url)

module.exports =
    Router({ 
        toURL
        , fromURL
        // eslint-disable-next-line no-undef
        , getPath: () => location.pathname
    })