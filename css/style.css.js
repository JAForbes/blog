module.exports = {
    '@global': {
        img: { max_width: '100%'}

        ,'h1, h2, h3, h4, h5, h6': {
            color: 'white'
        }

        ,'@font-face': {
            font_family: 'Inconsolata'
            ,src: 'url(../font/Inconsolata-Regular.ttf) format("truetype")'
        }

        ,h1: { font_family: '"Inconsolata", sans-serif' }

        ,'*': {
            font_family: 'helvetica'
            ,box_sizing: 'border-box'
        }

        ,'code, code span': {
            font_family: '"Inconsolata", sans-serif'
        }

        ,'a, a:visited': { color: '#e6cdf9' }
        ,'a:active': { color: 'black' }

        ,'.tiny': {
            font_size: '0.8em'
            ,margin_top: '0.2em'
        }
        ,'.posts li': {
            margin: '0.5em'
            ,list_style: 'none'
        }
        ,'.hidden': {
            opacity: 0
        }
        ,'body': {
            text_align: 'center'
            ,color: '#e6cdf9'
            ,background_color: '#231f1f'
        }
        ,'.bio img': {
            margin_bottom: '1em'
            ,margin_left: 'auto'
            ,margin_right: 'auto'
            ,width: '10vw'
            ,max_width: '150px'
            ,text_align: 'left'
            ,border_radius: '100%'
        }
        ,'.posts, .post': {
            text_align: 'left'
        }
        ,'.posts': {
            margin_top: '2em'
            ,background_color: '#1d1919'
            ,padding: '0.5em'
            ,min_height: '100px'
            ,width: '100%'
        }
        ,'.bio': {
            position: 'relative'
            ,left: '10%'
            ,width: '80%'
            ,top: '10%'
            ,padding: '1em'
        }
        ,'.phone-menu-nav': {
            'display': 'none'
            ,'user-select': 'none'
        }
        ,'no-select': {
            'user-select': 'none'
        }
    }
};