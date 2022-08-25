import main, * as app from '../index.js'
import { Route } from '../index.js';
import fs from 'fs'
import * as marked from 'marked'
import * as L from 'linkedom'
import hljs from 'highlight.js'
import m from 'mithril'

const posts = JSON.parse(fs.readFileSync('./posts.json'));

function stripHTML(x){
    return L.parseHTML(`<body><markdown>${x}</markdown></body>`).document.querySelector('markdown').textContent
}
const Generator = function*(){}.constructor
for (let post of posts ) {
    let machine = main()
    let origin = 'https://james-forbes.fly.dev'
    let handlers = {
        getRoute(){
            return [Route.Post(post.path.slice( 'posts/'.length).slice(0,-2))]
        }
        ,getAllPosts(){
            return [[]]
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