const equals = require('ramda/src/equals')
const stream = require('mithril/stream')
module.exports = s => {
    const s2 = stream()
    s.map(
        newVal => {
        if( !equals(newVal, s2()) ) {
            s2( newVal)
        }
        return null
        } 
    )
    return s2
}