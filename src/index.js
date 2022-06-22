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
        return { type: 'Action', tag: 'renderMarkdown', value: markdown }
    }
    ,getAssetSrc(asset){
        return { type: 'Action', tag: 'getAssetSrc', value: asset }
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
    const html = yield Action.renderMarkdown(markdown)

    return Action.hyperscript( (h, css) =>
        h('.post'
            , css`
                .& h1, .& h2 {
                    font-weight: 400;
                    text-align: center;
                    color: #7588d3;
                }

                .& .hljs {
                    padding: 1em;
                    border-radius: 0.25em;
                }

            `
            , h.trust(html)
        )
    )
}
function * HomeView(){
    const src = yield Action.getAssetSrc('img/bio.jpeg')
    return Action.hyperscript( (h, css) =>
        h('.home'
            , css`
                .& {
                    display: grid;
                    justify-items: center;
                }
                .& img {
                    border-radius: 100%;
                    max-width: 6em;
                }
            `
            , h('img', { src })
            , h('p', 'Interested in any type of design and the individual componentry of calcified ideas.')
        )
    )
}

function * PostsList(){
    const posts = yield Action.getAllPosts()
    
    return Action.hyperscript( (h, css) => {
        const all = posts.map( x => 
            h('a' ,
                { href: '/' + x.path.replace('.md', '')
                , * onclick (e) {
                    e.preventDefault()
                    yield Action.navigateFromEvent(e)
                }
                }
                , h('li.card'+ (x.featured ? '.featured' : '')
                        ,h('p', x.name)
                        ,h('i', x.created)
                    )
                )
        )

        let recent = all.slice(0,4)
        let rest = all.slice(4)

        return h('.posts-list'
            ,css`

                @media (min-width: 23em) {

                    .& {
                        display: grid;
                        gap: 1em 5em;
                        justify-content: center;
                        grid-template-columns: minmax(0em, 60em)
                    }
                }

                .& * {
                    margin: 0em;
                    box-sizing: border-box;
                }

                .& a, .& a:visited {
                    color: black;
                }


                .& .list {
                    display: grid;
                }

                @media ( max-width: 30em ) {


                    .& {
                        gap: 3em 1em;
                    }
                    .& .list {
                        display: grid;
                        gap: 1em;
                    }

                    .& .list ul {
                        display: grid;
                        gap: 1em 3em;
                        grid-template-columns: 1fr;
                        list-style: none;
                        margin: 0em;
                        padding: 0em;
                    }
                }
                @media ( min-width: 30em ) {
                    .& .list {
                        display: grid;
                        --gutter: 10em;
                        grid-template-columns: var(--gutter) 1fr; 
                        margin-left: calc( var(--gutter) * -1 );
                    }

                    .& .list ul {
                        display: grid;
                        gap: 1em 3em;
                        grid-template-columns: 1fr 1fr;
                        list-style: none;
                        margin: 0em;
                        padding: 0em;
                    }
                }

                
                .& .card {
                    display: grid;
                    gap: 2em;
                    padding: 2em;
                    transition: transform 0.5s, background-color 1s;
                    border: solid 0.1em #DDD;
                    border-left: solid 0.5em #DDD;

                }

                .& .card.featured:hover {
                    background-color: rgba(0,0,0,0.9);
                    transition: transform 0.1s, background-color 0.2s;
                }
                .& .card:hover {
                    backface-visibility: hidden;
                    transform: scale(1.05);
                    background-color: rgba(0,0,0,0.05);
                    transition: transform 0.1s, background-color 1s;
                }

                .& .card.featured {
                    color: white;
                    background-color: black;
                }

            `
            ,h('.list.recent'
                ,h('h4', 'Recent Articles')
                ,h('ul'
                    ,recent
                )
            )
            ,h('.list.rest'
                ,h('h4', 'Other posts')
                ,h('ul'
                    ,rest
                )
            )
        )
    })
}

export function * Nav(){

    return Action.hyperscript( (h, css) => 
        h('nav'
            , css`
                .& {
                    display: grid;
                    gap: 1em;
                    justify-content: center;
                    text-align: center;
                }

                .& ul {
                    list-style: none;
                    display: flex;
                    gap: 1em;
                    justify-content: center;
                    padding: 0em;
                    margin: 0em;
                }

                .& a:visited, .& a {
                    color: black;
                }
            `
            , h('h4', 'James Forbes')
            , h('ul'
                , h('li'
                    ,
                    h('a'
                        ,
                        { href: '/' 
                        , * onclick (e) {
                            e.preventDefault()
                            yield Action.navigateFromEvent(e)
                        }
                        }
                        , 'Explore'
                    ) 
                )
                , h('li'
                    , h('a'
                        , 
                        { href: 'https://soundcloud.com/peopleofconcept' 
                        }
                        , 'Listen'
                    )
                )
                , h('li'
                    , h('a'
                        , 
                        { href: 'https://canyon.itch.io/' 
                        }
                        , 'Play'
                    )
                )
                , h('li'
                    , h('a'
                        , 
                        { href: 'https://github.com/JAForbes/' 
                        }
                        , 'Parse'
                    )
                )
                , h('li'
                    , h('a'
                        , 
                        { href: 'https://twitter.com/jmsfbs' 
                        }
                        , 'Follow'
                    )
                )
            )
        )
    )
}

export default function * Main(){
    do {
        const route = yield Action.getRoute()

        yield Action.hyperscript( (h, css) => {

            return h('.app'
                , css`
                    .& {
                        font-family: Helvetica;
                        display: grid;
                        
                        --vertical-gap: 4em;
                        gap: var(--vertical-gap) 1em;
                    
                    }

                    .& blockquote {
                        margin: 1em;
                    }

                    @media ( max-width: 30em ) {
                        .& {
                            grid-template-columns: 22em;
                            justify-content: center;
                        }
                    }

                    .& h1, .& h2, .& h3, .& h4 {
                        margin: 0px;
                        padding: 0px;
                    }
                `
                ,[
                    h(Nav, { key: 'nav'})
                    , Route.match(route, {
                        Post: () => h(PostView, { key: 'Posts ' + route.value })
                        , Home: () => h(HomeView, { key: 'Home' })
                    })
                    , h(PostsList, { key: 'postslist' })
                ]
            )

        })
    } while (yield Action.popstate())
}