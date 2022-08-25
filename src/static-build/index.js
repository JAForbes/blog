/* globals globalThis, window */

import main from '../index.js'
import { Route } from '../index.js';
import fs from 'fs'
import * as marked from 'marked'
import * as L from 'linkedom'
import hljs from 'highlight.js'
import m from 'mithril'
import render from 'mithril-node-render'
import xet from 'xet'
import * as H from 'history'

globalThis.history = H.createMemoryHistory()
globalThis.location = globalThis.history.location

// const components = new Map();
const sheets = new Map();

const posts = JSON.parse(fs.readFileSync('./posts.json'));

function stripHTML(x){
    return L.parseHTML(`<body><markdown>${x}</markdown></body>`).document.querySelector('markdown').textContent
}

function h(tag, ...args){

    let vnode = m(tag, ...args)
    vnode.attrs = vnode.attrs || {}

    if ( tag instanceof Generator ) {
        let machine = tag(vnode)
        return iterate(machine)
    }

    return vnode
}
h.link = (...args) => m('a', ...args)
h.trust = m.trust


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

function iterate(machine){
    let args = []
    let rendered = ''
    do {
        let next = machine.next(...args)
        let { done, value } = next
        if( value == null ) {
            'noop'
        } else if ( value instanceof Generator ) {
            return iterate(value())
        } else if ( value.tag in handlers ) {
            args = handlers[value.tag](value.value) || []
            if ( value.tag === 'hyperscript' ) {
                rendered = args[0]
            }
        }
        if (done) break;
    } while (true)

    return rendered
}

let handlers = {
    getRoute(){
        return [Route.Post(post.path.slice( 'posts/'.length).slice(0,-2))]
    }
    ,getAllPosts(){
        return [posts]
    }
    ,getPostFromRoute(){
        return [post]
    }
    ,navigateFromEvent(){
        return []
    }
    ,getPostMarkdown(){
        return [fs.readFileSync('./' + post.path, 'utf8')]
    }
    ,renderMarkdown(markdown){
        const renderer = Object.assign(new marked.Renderer(), {
            code(content, lang){

                lang = lang || 'js'
                let html = hljs.highlight(stripHTML(content), { language: lang || 'js' }).value

                return `<code><pre class="hljs language-${lang}">${html}</pre></code>`
            },

        })
        const html = marked.marked(markdown, { 
            renderer
        })

        fs.mkdirSync('./dist/posts', { recursive: true })
        fs.writeFileSync('./dist/'+post.path+'.html', html)
        return [html]
    }
    ,getPostHTML(){
        let [markdown] = handlers.getPostMarkdown(post)
        let [html] = handlers.renderMarkdown(markdown)
        return [html]
    }
    ,getAssetSrc(asset){
        [origin + '/assets/'+asset]
    }
    ,hyperscript(f){
        
        const css = String.raw

        const tree = render.sync(f(h,css))

        return [tree]
    }
    ,popstate(){
        return []
    }
    ,on(){
        return []
    }
}


const baseHTMLFile = fs.readFileSync('index.html', 'utf8')

const Generator = function*(){}.constructor

for (let post of posts ) {
    // let machine = main()
    // let origin = 'https://james-forbes.fly.dev'

    const { window, document } = L.parseHTML(baseHTMLFile)
    
    console.log(window)
    // let out = iterate(machine)
    // console.log(out)
}