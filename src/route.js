export default {
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
