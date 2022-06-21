/* global window */
import marked from 'marked'
import m from 'mithril'
import main, * as app from '../index.js'
import Prism from 'prismjs'
import { value } from 'jsonpath'

function parseRoute(pathname){
    if ( pathname.startsWith('/posts') ) {
        return app.Route.Post( pathname.slice( '/posts/'.length ) )
    } else {
        return app.Route.Home()
    }
}

function getSet(map, key, factory){
  if(map.has(key))
     return map.get(key)
  
  const value = factory(key, map)
  
  map.set(key, value)
  
  return value
}

const components = new Map();
let posts = null;
        
function componentAdapter(Machine){
    return function(initialVnode){
        const machine = Machine(initialVnode.attrs)
        let view = null;
        let Generator = function*(){}.constructor

        let listeners = []


        async function iterate(){
            let args = []

            async function fetchAllPosts(){
                posts = posts 
                || await window.fetch(window.location.origin + '/' + 'posts.json')
                     .then( x => x.json() )
                
                args = [posts]
            }

            let resume = () => {}
            function pause(){
                let p = new Promise( resolve => resume = resolve )
                return p
            }

            while (true) {
                let next = machine.next(...args)
                let value = next.value
                if( value == null ) continue;
                console.log(next, value)
                args = []
                if (value.tag == 'getRoute') {
                    let route = parseRoute(window.location.pathname)

                    args=[route]

                } else if (value.tag == 'getAllPosts') {
                     await fetchAllPosts()
                } else if (value.tag == 'getPostFromRoute' ) {
                    const route = value.value
                    if (!posts) await fetchAllPosts()

                    const post = posts.find( x => x.path == 'posts/' + route.value + '.md' )

                    args = [post]
                } else if (value.tag == 'navigateFromEvent') {
                    const event = value.value
                    const href = event.target.href
                    window.history.pushState(href)
                } else if (value.tag == 'getPostMarkdown' ) {
                    const post = value.value
                    const markdown = await window.fetch(window.location.origin + '/'+post.path)
                        .then( x => x.text() )
                    
                    args = [markdown]
                } else if (value.tag == 'renderMarkdown' ) {
                    const markdown = value.value
                    const html = marked(markdown)

                    args = [html]
                } else if (value.tag == 'highlightCodeBlocks') {
                    const html = value.value
                    Prism.highlightAll(html)

                    args = [html]
                    m.redraw()
                } else if (value.tag == 'getAssetSrc' ) {
                    args = [window.location.origin + '/assets/'+value.value]
                } else if (value.tag == 'hyperscript' ) {
                    view = () => value.value(
                        Object.assign((tag, ...args) => {
                            
                            if( tag instanceof Generator ) {    
                                tag = getSet(components, tag, componentAdapter)
                            }

                            return m(tag, ...args)
                        }, m)
                    )
                    m.redraw()
                } else if (value.tag == 'popstate') {
                    let listener;
                    
                    window.addEventListener('popstate', listener = e => {
                        resume()
                        machine.next(e)
                    })
                    listeners.push(() => window.removeEventListener('popstate', listener))
                    await pause()
                }

                if ( next.done ) break;
            }

            return null    
        }

        iterate()

        return {
            view(vnode){
                if (!view){
                    return null
                } else {
                    return view(vnode)
                }
            }
            ,onremove(){
                listeners.forEach( f => f() )
            }
        }
    }
}

const mithrilMain = componentAdapter(main)

m.mount(window.document.body, mithrilMain)