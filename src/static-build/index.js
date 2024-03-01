import main, { cohostMarkdown } from '../index.js'
import { Route } from '../index.js';
import fs from 'fs'
import * as marked from 'marked'
import * as L from 'linkedom'
import hljs from 'highlight.js'
import m from 'mithril'

const posts = JSON.parse(fs.readFileSync('./public/posts.json'));

function stripHTML(x){
    return L.parseHTML(`<body><markdown>${x}</markdown></body>`).document.querySelector('markdown').textContent
}

// todo-james this is inconsistent, hit bugs in safari
// for exported coroutines where their constructor was simply `Function`
// value?.prototype?.constructor === function*(){}.prototype.constructor
// seems to always work, and is spec'd so maybe use that, for now this only
// runs in node so probably fine.
const Generator = function*(){}.constructor
global.renderMarkdown = true
for (let post of posts ) {
    let machine = main()
    let origin = 'https://james-forbes.com'
    let handlers = {
        getRoute(){
            return [Route.Post(post.path.slice( 'posts/'.length).slice(0,-2))]
        }
        ,getAllPosts(){
            return [[]]
        }
        ,getCohostFeed(){
            return [{
                items: []
            }]
        }
        ,getPostFromRoute(){
            return [post]
        }
        ,navigateFromEvent(){
            return []
        }
        ,getPostMarkdown(){
            return [fs.readFileSync('./public/' + post.path, 'utf8')]
        }
        ,getPostHTML(){
            return ['']
        }
        ,renderMarkdown(markdown){
            const renderer = Object.assign(new marked.Renderer(), {
                code(content, lang){

                    if (lang === 'mermaid') {
                        return `<code><pre class="mermaid" style="opacity: 0; transition: opacity 0.5s;">${stripHTML(content)}</pre></code>`
                    }

                    lang = lang || 'js'

                    let html = hljs.highlight(stripHTML(content), { language: lang || 'js' }).value

                    return `<code><pre class="hljs language-${lang}">${html}</pre></code>`
                },

            })
            const html = marked.marked(markdown, { 
                renderer
            })

            if ( markdown != cohostMarkdown ) {
                fs.writeFileSync('./public/'+post.path+'.html', html)
            }
            return [html]
        }
        ,getAssetSrc(asset){
            [origin + '/assets/'+asset]
        }
        ,hyperscript(f){
            function h(tag, ...args){

                let vnode = m(tag, ...args)
                vnode.attrs = vnode.attrs || {}

                if ( tag instanceof Generator ) {
                    let machine = tag(vnode)
                    iterate(machine)
                }

                return vnode
            }
            h.link = () => m('a')
            h.trust = () => ''
            const css = String.raw

            f(h,css)
            
            return []
        }
        ,popstate(){
            return []
        }
        ,on(){
            return []
        }
        ,handleOldPathFormat(){
            return []
        }
    }

    function iterate(machine){
        let args = []
        do {
            let next = machine.next(...args)
            let { done, value } = next
            if( value == null ) {
                'noop'
            } else if ( value instanceof Generator ) {
                iterate(value())
            } else if ( value.tag in handlers ) {
                args = handlers[value.tag](value.value) || []
            }
            if (done) break;
        } while (true)
    }

    iterate(machine)
}