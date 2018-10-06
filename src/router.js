/* globals addEventListener, history */
const stream = require('mithril/stream')
const dropRepeats = require('./drop-repeats')

const sst = require('static-sum-type')
const type = require('static-sum-type/modules/taggy')

// eslint-disable-next-line no-undef
const getPath = () => location.pathname // location.hash
const formatPath = path => path //'#'+path

const $ = require('hickery')

const Router = (
	{ toURL: theirToURL
	, fromURL: theirFromURL
	, cases
	}
) => {

	const Route = 
		type ('Route') ( cases )

	Route.fold = sst.fold(Route)
	
	const toURL = sst.fold (Route) (theirToURL)
	const fromURL = theirFromURL(Route)
	const $route = f => o => Object.assign({}, o, { route: f(o.route )})

	const Router =
		{ getPath
		, formatPath
		, $
		, toURL
		, fromURL
		, link: update => route => vnode => {
			const symbolicHref = toURL(route)
			const realHref = formatPath( symbolicHref )
			vnode.dom.href = realHref
			
			vnode.dom.addEventListener('click', function(e){
				e.preventDefault()
				update( symbolicHref )
			})
		}
		
		, startURL: url => {
			
			const popstates = stream()

			dropRepeats(url).map(
				(url) => {
					if( url !== getPath() ){
						history.pushState({}, '', formatPath(url))
					}
					return null
				}
			)
			
			addEventListener(
				'popstate', () => popstates(getPath())
			)
			
			return popstates
		}

		, Route

		, start: model$ => {

			const url$ =
				model$.map( 
					model => [model]
						.flatMap($.select($route))
						.map( x => toURL(x) )
						.shift()
				)

			return Router
				.startURL( url$ )
				.map( 
					url => [url]
						.map(Router.$)
						.map(fromURL)
					.shift()
				)

		}
		}

	return Router
}

module.exports = Router