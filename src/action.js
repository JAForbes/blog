export default {
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
    ,getPostHTML(post){
        return { type: 'Action', tag: 'getPostHTML', value: post }
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
    ,on(predicate){
        return { type: 'Action', tag: 'on', value: predicate }
    }
    ,handleOldPathFormat(){
        return { type: 'Action', tag: 'handleOldPathFormat' }
    },
    renderMermaid(){
        return { type: 'Action', tag: 'renderMermaid' }
    }
}