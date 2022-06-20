
export const Route = {
    Home(){
        return { type: 'Route', tag: 'Home' }
    }
    ,Post(slug){
        return { type: 'Route', tag: 'Post', value: slug }
    }
    ,match(route, {Home, Post}){
        return {
            Home
            ,Post
        }[route.tag](route.value)
    }
}

export const Action = {
    getRoute(){
        return { type: 'Action', tag: 'getRoute' }
    }
    ,getAllPosts(){
        return { type: 'Action', tag: 'getAllPosts'}
    }
    ,getPostFromRoute(route){
        return { type: 'Action', tag: 'getPostFromRoute', value: route }
    }
    ,navigateFromEvent(event){
        return { type: 'Action', tag: 'navigateFromEvent', value: event }
    }
    ,getPostMarkdown(post){
        return { type: 'Action', tag: 'getPostMarkdown', value: post }
    }
    ,renderMarkdown(markdown){
        return { type: 'Action', tag: 'getPostMarkdown', value: markdown }
    }
    ,highlightCodeBlocks(html){
        return { type: 'Action', tag: 'highlightCodeBlocks', value: html }
    }
    ,getAssetSrc(asset){
        return { type: 'Action', tag: 'getAssetSrc', asset }
    }
    ,hyperscript(visitor){
        return { type: 'Action', tag: 'hyperscript', value: visitor }
    }
    ,popstate(){
        return { type: 'Action', tag: 'popstate' }
    }
}

function * PostView(){
    const route = yield Action.getRoute()
    const post = yield Action.getPostFromRoute(route)
    const markdown = yield Action.getPostMarkdown(post)
    const originalHTML = yield Action.renderMarkdown(markdown)
    const highlightedHTML = yield Action.highlightCodeBlocks(originalHTML)

    yield Action.hyperscript( h =>
        h.trust(highlightedHTML)
    )
}

function * HomeView(){
    const src = yield Action.getAssetSrc('img/avatar')
    return Action.hyperscript( h =>
        h('.home'
            , h('img', { src })
            , h('p', 'Interested in any type of design and the individual componentry of calcified ideas.')
        )
    )
}

function * PostsList(){
    const posts = yield Action.getAllPosts()

    return Action.hyperscript( h => 
        h('ul.posts-list'
            , posts.map( x => 
                h('a',
                    { href: x.path.replace('.md', '')
                    , * onclick (e) {
                        yield Action.navigateFromEvent(e)
                    }
                    }
                    , h('li'
                            ,h('p', x.name)
                            ,h('i', x.created)
                        )
                    )
            )
        )
    )
}

export default function * Main(){
    do {
        const route = yield Action.getRoute()

        return Action.hyperscript( h =>
            h('.app'
                , h('nav')
                , Route.match(route, {
                    Post: () => h(PostView)
                    , Home: () => h(HomeView)
                })
                , h(PostsList)
            )
        )
    } while ( yield Action.popstate() )
}