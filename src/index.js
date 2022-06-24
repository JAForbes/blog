import Route from './route.js'
import Action from './action.js'

const v = Action.hyperscript

export { Action, Route }

export function * getPostContentSPA(){
    const route = yield Action.getRoute()
    const post = yield Action.getPostFromRoute(route)
    const markdown = yield Action.getPostMarkdown(post)
    const html = yield Action.renderMarkdown(markdown)
    return html
}

export function * getPostContentPreRendered(){
    const route = yield Action.getRoute()
    const post = yield Action.getPostFromRoute(route)
    const html = yield Action.getPostHTML(post)
    return html
}

function * PostView(){
    const html = yield * getPostContentPreRendered()

    return v( (h, css) =>
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
    return v( (h, css) =>
        h('.home'
            , css`
                .& {
                    display: grid;
                    justify-items: center;
                    font-size: 1.2em;
                }
                .& img {
                    border-radius: 100%;
                    max-width: 6em;
                }

                .& p {
                    max-width: 16.5em;
                    text-align: center;
                }
            `
            , h('img', { src })
            , h('p', 'Interested in any type of design and the individual componentry of calcified ideas.')
        )
    )
}

function * PostsList(){
    const posts = yield Action.getAllPosts()
    
    return v( (h, css) => {
        const all = posts.map( x => 
            h.link(
                { href: '/' + x.path.replace('.md', '') }
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

                    .& .list ul {
                        display: grid;
                        gap: 1em 3em;
                        grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
                        list-style: none;
                        margin: 0em;
                        padding: 0em;
                    }
                }

                @media (max-width: 80em) {
                    .& .list {
                        gap: 1em;
                    }
                }

                @media (min-width: 80em) {
                    .& .list {
                        display: grid;
                        --gutter: 10em;
                        grid-template-columns: var(--gutter) 1fr; 
                        margin-left: calc( var(--gutter) * -1 );
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

    return v( (h, css) => 
        h('nav'
            , css`
                .& {
                    display: grid;
                    gap: 1em;
                    justify-content: center;
                    text-align: center;
                    font-size: 1.2em;
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
                    , h.link({ href: '/' }, 'Explore')
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

function on(predicate, f){
    return function * () {
        do {
            yield * f()
        } while ( yield Action.on(predicate) )
    }
}

export default function * Main(){

    yield on( x => x.tag == 'popstate', function * () {
        const route = yield Action.getRoute()

        yield v( (h, css) => {

            return h('.app'
                , css`
                    .& {
                        font-family: Helvetica;
                        display: grid;
                        
                        --vertical-gap: 4em;
                        gap: var(--vertical-gap) 1em;
                    
                    }

                    @media (min-width: 30em) {
                        .& {
                            grid-template-columns: minmax(0, 60em);
                            justify-content: center;
                        }

                        .&.& h1 {
                            margin-bottom: 2em;
                        }
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
    })
}