/* global window */
import * as marked from 'marked'
import m from 'mithril'
import main, * as app from '../index.js'
// import Prism from 'prismjs'
import EventEmitter from 'events'
import xet from 'xet'
import highlight from 'highlight.js/lib/common'
import 'highlight.js/styles/atom-one-dark.css'
import Action from '../action'

let events = new EventEmitter()

window.history.scrollRestoration = 'manual';

function parseRoute(pathname){
    if ( pathname.startsWith('/posts') ) {
        return app.Route.Post( pathname.slice( '/posts/'.length ) )
    } else {
        return app.Route.Home()
    }
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        // eslint-disable-next-line operator-assignment
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

const components = new Map();
const sheets = new Map();
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
                    console.log('navigate from event')
                    const event = value.value
                    event.preventDefault()
                    const href = event.currentTarget.href
                    window.history.pushState(null, '', href)
                    events.emit('popstate')
                    window.scrollTo({ top: 0, behavior: 'auto' })
                } else if (value.tag == 'getPostMarkdown' ) {
                    const post = value.value
                    const markdown = await window.fetch(window.location.origin + '/'+post.path)
                        .then( x => x.text() )

                    args = [markdown]
                } else if (value.tag == 'renderMarkdown' ) {
                    const markdown = value.value
                    const renderer = Object.assign(new marked.Renderer(), {
                        code(content, lang){
                            const code = window.document.createElement('pre')
                            const pre = window.document.createElement('code')
                            pre.innerHTML = highlight.highlight(content, { language: lang || 'js' }).value
                            code.appendChild(pre)
                            pre.classList.add('hljs', 'language-'+lang)
                            return code.outerHTML
                        },

                    })
                    const html = marked.marked(markdown, { 
                        renderer
                    })
                    
                    window.highlight = highlight
                    
                    args = [html]
                } else if (value.tag == 'getAssetSrc' ) {
                    args = [window.location.origin + '/assets/'+value.value]
                } else if (value.tag == 'hyperscript' ) {

                    
                    view = () => value.value(
                        h
                        ,css
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


        const h = Object.assign((tag, ...args) => {
                
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
                } else if (vnode.attrs[key] instanceof Function ) {
                    let original = vnode.attrs[key]
                    vnode.attrs[key] = (...args) => {
                        return iterate({
                            next(){
                                return { done: true, value: original(...args) }
                            }
                        })
                    }
                }
            }
        
            return vnode
        }, m)

        h.link = (attrs={}, text) => 
            h('a'
                ,
                { onclick: Action.navigateFromEvent
                , ...attrs
                }
                , text
            )

        function css(strings, ...args){
            
            const { className } = xet(sheets, strings, () => {
                const styleSheet = String.raw(strings, ...args);
                const hash = hashCode(styleSheet)
                const className = 'css'+hash
                const updatedStylesheet = styleSheet.replace(/\&/gm, className)

                const style = window.document.createElement('style')
                style.textContent = updatedStylesheet
                window.document.head.appendChild(style)
                
                return {
                    hash, stylesheet: updatedStylesheet, className
                }
            })
            
            return h.fragment({
                oncreate(vnode){
                    const parent = vnode.dom.parentNode
                    parent.classList.add(className)
                    parent.removeChild(vnode.dom)
                }
            }, h('span'))
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