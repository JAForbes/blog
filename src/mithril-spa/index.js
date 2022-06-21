/* global window */
import marked from 'marked'
import m from 'mithril'
import main, * as app from '../index.js'
import Prism from 'prismjs'
import EventEmitter from 'events'
import xet from 'xet'

let events = new EventEmitter()

window.history.scrollRestoration = 'manual';

function parseRoute(pathname){
    if ( pathname.startsWith('/posts') ) {
        return app.Route.Post( pathname.slice( '/posts/'.length ) )
    } else {
        return app.Route.Home()
    }
}

const components = new Map();
let posts = null;

function componentAdapter(Machine){
    return function(initialVnode){
        const machine = Machine(initialVnode.attrs)
        let view = null;
        let Generator = function*(){}.constructor

        async function iterate(machine, args=[]){

            async function fetchAllPosts(){
                posts = posts 
                || await window.fetch(window.location.origin + '/' + 'posts.json')
                     .then( x => x.json() )
                
                args = [posts]
            }

            while (true) {
                let next = machine.next(...args)
                let value = next.value
                
                args = []
                if ( value == null ) {
                    'noop';
                } else if (value.tag == 'getRoute') {
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
                    const href = event.currentTarget.href
                    window.history.pushState(null, '', href)
                    events.emit('popstate')
                    
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
                } else if (value.tag == 'getAssetSrc' ) {
                    args = [window.location.origin + '/assets/'+value.value]
                } else if (value.tag == 'hyperscript' ) {
                    view = () => value.value(
                        Object.assign((tag, ...args) => {
                            
                            tag = tag instanceof Generator ? xet(components, tag, componentAdapter) : tag
                            
                            let vnode = m(tag, ...args)

                            vnode.attrs = vnode.attrs || {}
                            
                            for(let key of Object.keys(vnode.attrs) ) {
                                if ( vnode.attrs[key] instanceof Generator ) {
                                    let original = vnode.attrs[key]
                                    vnode.attrs[key] = (...args) => {
                                        let it = original(...args)
                                        return iterate(it)
                                    }
                                }
                            }
                        
                            return vnode
                        }, m)
                    )
                    m.redraw()
                } else if (value.tag == 'popstate') {

                    
                    window.addEventListener('popstate', () => {
                        events.emit('popstate')
                    }, { once: true })

                    let playback = {}
                    playback.pause = new Promise((Y) => {
                        playback.resume = Y
                    })
                    events.once('popstate', () => {
                        args = [true]
                        playback.resume()
                    })

                    await playback.pause

                }

                if ( next.done ) break;
            }

            return null
        }

        iterate(machine)

        return {
            view(vnode){
                return view && view(vnode)
            }
        }
    }
}

const mithrilMain = componentAdapter(main)

m.mount(window.document.body, mithrilMain)