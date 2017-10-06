// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import T         from 'devapt-core-common/dist/js/utils/types'
import Stream    from 'devapt-core-common/dist/js/messaging/stream'

// BROWSER IMPORTS
import Container from '../base/container'


const context = 'browser/components/dock_item'



export default class DockItem extends Container
{
	/**
	 * Creates an instance of DockItem.
	 * 
	 * @param {object} arg_runtime - client runtime.
	 * @param {object} arg_state - component state.
	 * @param {string} arg_log_context - context of traces of this instance (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_state, arg_log_context)
	{	
		super(arg_runtime, arg_state, arg_log_context ? arg_log_context : context)

		this.is_dock_item = true
	}



	/**
	 * Expand component to fullscreen (inside browser window).
	 * 
	 * @returns {nothing}
	 */
	expand_to_fullscreen()
	{
		console.log(context + ':expand_to_fullscreen')

		let dom_elem = this.get_dom_element()
		const bcolor = 'background-color'
		const lmargin = 'margin-left'

		if (dom_elem.parentNode && dom_elem.parentNode.className.indexOf('devapt-dock-item') > -1)
		{
			dom_elem = dom_elem.parentNode
		}

		dom_elem.className = dom_elem.className ? dom_elem.className : ''

		if ( dom_elem.className.indexOf('devapt-fullscreen') < 0 )
		{
			this._save_styles()

			document.body.style.overflow = 'hidden'

			dom_elem.style.position   = 'fixed'
			dom_elem.style.left       = '20px'
			dom_elem.style.top        = '20px'
			dom_elem.style.height     = '100%'
			dom_elem.style.width      = '100%'
			dom_elem.style[bcolor]    = 'white'
			dom_elem.style[lmargin]   = '0px'
			dom_elem.style['z-index'] = 999
			dom_elem.className       += ' devapt-fullscreen'

			this.resize(dom_elem.offsetWidth, dom_elem.offsetHeight)
		}
	}



	/**
	 * Collapse component from fullscreen to original size.
	 * 
	 * @returns {nothing}
	 */
	collapse_from_fullscreen()
	{
		// console.log(context + ':collapse_from_fullscreen')

		let dom_elem = this.get_dom_element()
		const bcolor = 'background-color'
		const lmargin = 'margin-left'

		if (dom_elem.parentNode && dom_elem.parentNode.className.indexOf('devapt-dock-item') > -1)
		{
			dom_elem = dom_elem.parentNode
		}

		dom_elem.className = dom_elem.className ? dom_elem.className : ''

		if ( dom_elem.className.indexOf('devapt-fullscreen') > -1 && T.isObject(this.saved_dom) && T.isObject(this.saved_dom.style) )
		{
			this._restore_styles()

			this.resize(dom_elem.offsetWidth, dom_elem.offsetHeight)
		}
	}



	/**
	 * Toggle component fullscreen mode.
	 * 
	 * @returns {nothing}
	 */
	toggle_from_fullscreen()
	{
		let dom_elem = this.get_dom_element()

		if (dom_elem.parentNode && dom_elem.parentNode.className.indexOf('devapt-dock-item') > -1)
		{
			dom_elem = dom_elem.parentNode
		}

		dom_elem.className = dom_elem.className ? dom_elem.className : ''

		if ( dom_elem.className.indexOf('devapt-fullscreen') > -1 )
		{
			this.collapse_from_fullscreen()
			return
		}

		this.expand_to_fullscreen()
	}



	/**
	 * Save style attributes.
	 * 
	 * @returns {nothing}
	 */
	_save_styles()
	{
		const bcolor = 'background-color'
		const lmargin = 'margin-left'
		let dom_elem = this.get_dom_element()

		if (dom_elem.parentNode && dom_elem.parentNode.className.indexOf('devapt-dock-item') > -1)
		{
			dom_elem = dom_elem.parentNode
		}

		dom_elem.className = dom_elem.className ? dom_elem.className : ''

		this.saved_dom = {
			body_overflow:window.document.body.style.overflow,
			className:dom_elem.className,
			style:{
				position:dom_elem.style.position,
				left:    dom_elem.style.left,
				top:     dom_elem.style.top,
				height:  dom_elem.style.height,
				width:   dom_elem.style.width,
				bcolor:  dom_elem.style[bcolor],
				lmargin: dom_elem.style[lmargin],
				zindex:  dom_elem.style['z-index']
			}
		}
	}



	/**
	 * Toggle component fullscreen mode.
	 * 
	 * @returns {nothing}
	 */
	_restore_styles()
	{
		const bcolor = 'background-color'
		const lmargin = 'margin-left'
		let dom_elem = this.get_dom_element()
		
		if (dom_elem.parentNode && dom_elem.parentNode.className.indexOf('devapt-dock-item') > -1)
		{
			dom_elem = dom_elem.parentNode
		}
		
		window.document.body.style.overflow = this.saved_dom.body_overflow

		dom_elem.style.position   = this.saved_dom.style.position
		dom_elem.style.left       = this.saved_dom.style.left
		dom_elem.style.top        = this.saved_dom.style.top
		dom_elem.style.height     = this.saved_dom.style.height
		dom_elem.style.width      = this.saved_dom.style.width
		dom_elem.style[bcolor]    = this.saved_dom.style.bcolor
		dom_elem.style[lmargin]   = this.saved_dom.style.lmargin
		dom_elem.style['z-index'] = this.saved_dom.style.zindex

		dom_elem.className = this.saved_dom.className

		this.saved_dom = {}
	}
}
