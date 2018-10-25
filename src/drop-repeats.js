const equals = require('ramda/src/equals')
const stream = require('mithril/stream')
module.exports = select => s => {
    const s2 = stream()
    let hasVal = false
    s.map(
        newVal => {
            if( !hasVal || !equals(select(newVal), select(s2())) ) {
                s2( newVal)
            }
            hasVal = true
            return null
        } 
    )
    return s2
}