const Router = require('./router')

module.exports =
    Router(
        { cases:
            { Post: ['path']
            , List: []
            }

        , toURL:
            { List: () => '/'
            , Post: ({ path }) => {

                const out = path.replace('.md', '')
                return out
            }
            }

        , fromURL: ({
            Post, List
        }) => url => {
            const out = 
                url
                .split('posts/')
                .slice(1)
                .flatMap( x => ['?','#']
                    .flatMap( y => x.split(y).slice(0,1) ) 
                )
                .map( path => Post({ path: '/posts/'+path+'.md' }))
                .concat( List() )
                .shift()

            return out
        }
        }
    )
