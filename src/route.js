const Router = require('./router')

module.exports =
    Router(
        { cases:
            { Post: ['path']
            , List: []
            }

        , toURL:
            { List: () => '/'
            , Post: ({ path }) => path.replace('.md', '')
            }

        , fromURL: ({
            Post, List
        }) => url => url
            .split('posts/')
            .slice(1)
            .flatMap( x => ['?','#']
                .flatMap( y => x.split(y).slice(0,1)) 
            )
            .map( path => Post({ path }))
            .concat( List() )
            .shift()
        }
    )
