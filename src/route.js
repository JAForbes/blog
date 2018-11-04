const superouter = require('superouter')

const Router = require('mithril-stream-router')

const Route = superouter.type('Route', 
    { List: '/'
    , Post: '/posts/:path'
    }
)

exports.Route = Route

const toURL = Route.toURL
const fromURL = url => Route.matchOr( () => Route.of.List(), url)


exports.Router =
    Router({ 
        toURL
        , fromURL
        // eslint-disable-next-line no-undef
        , getPath: () => location.pathname
    })