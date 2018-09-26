const css = require('bss')

module.exports = {
    grow:
        css`
            -moz-osx-font-smoothing: grayscale;
            backface-visibility: hidden;
            transform: translateZ(0);
            transition: transform 0.25s ease-out;
        `
        .$hover(`transform: scale(1.05)`)
        .$active( `transform: scale(0.90)`)
}
