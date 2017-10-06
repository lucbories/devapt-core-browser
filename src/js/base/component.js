// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T   from 'devapt-core-common/dist/js/utils/types'

// BROWSER IMPORTS
import StatedDom      from './component/stated_dom'


const context = 'browser/base/component'



/**
 * @file UI component class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example:
 * 	API
 *		->get_text_value():string - Get component content value string.
 * 		->
 * 
 * 		->
 * 
 * 		->get_text_value():string - Get component content value string.
 * 		->set_text_value(arg_value):nothing - Set component content value string.
 * 
 * 		->get_object_value():object - Get component content value object.
 * 		->set_object_value(arg_value):nothing - Set component content value object.
 * 
 */
export default class Component extends StatedDom
{
	/**
	 * Creates an instance of Component.
	 * 
	 * @param {RuntimeBase}   arg_runtime     - client runtime.
	 * @param {Immutable.Map} arg_state       - component initial state.
	 * @param {string}        arg_log_context - context of traces of this instance (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_state, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context
		super(arg_runtime, arg_state, log_context)
		
		this.is_component   = true

		// DEBUG
		// console.info(context + ':constructor:creating component ' + this.get_name())
		// this.enable_trace()
	}


	
	/**
	 * Get component content value string.
	 * 
	 * @returns {string}
	 */
	get_text_value()
	{
		return this.get_dom_text()
	}
	


	/**
	 * Set component content value string.
	 * 
	 * @param {string} arg_value - component values string.
	 * 
	 * @returns {nothing}
	 */
	set_text_value(arg_value)
	{
		this.set_dom_text('' + arg_value)
	}



	/**
	 * Get component content value object.
	 * 
	 * @returns {object}
	 */
	get_object_value()
	{
		let json = undefined
		
		const str = this.get_dom_text()

		try {
			json = JSON.parse(str)
		}
		catch(e){
			console.warn(context + ':get_object_value:error %s:bad json string=%s:', e, str)
		}

		return json
	}
	


	/**
	 * Set component content value object
	 * 
	 * @param {object} arg_value - component values object.
	 * 
	 * @returns {nothing}
	 */
	set_object_value(arg_value)
	{
		try {
			const str = JSON.stringify(arg_value)
			this.set_dom_text(str)
		}
		catch(e){
			console.warn(context + ':set_object_value:error %s:bad object=:', e, arg_value)
		}
	}



	/**
	 * Resize component.
	 * 
	 * @param {any} arg_width - css width value.
	 * @param {any} arg_height - css height value.
	 * 
	 * @returns {nothing}
	 */
	resize(arg_width, arg_height)
	{
		console.log(context + ':resize:width=%s height:%s', arg_width, arg_height)

		// TODO
		const dom_elem = this.get_dom_element()
		if (! T.isNumber(arg_width))
		{
			arg_width = dom_elem.offsetWidth
		}
		if (! T.isNumber(arg_height))
		{
			arg_height = dom_elem.offsetHeight
		}
		console.log(context + ':resize:num width=%s num height:%s', arg_width, arg_height)

		this.get_children_component().forEach(
			(component)=>{
				this.debug(':resize:component=' + component.get_name())
				component.resize(arg_width, arg_height)
			}
		)
	}



	/**
	 * Update component size with its content.
	 * 
	 * @returns {object} - size object { width:integer, height:integer }
	 */
	update_size()
	{
		console.log(context + ':update_size:name=%s', this.get_name())

		const size = {
			width:0,
			height:0
		}
		this.get_children_component().forEach(
			(component)=>{
				this.debug(':update_size:component=' + component.get_name())

				const child_size = component.update_size()
				size.width  += child_size.width
				size.height += child_size.height
			}
		)

		// DEBUG
		console.log(context + ':update_size:name=%s:width=%s height:%s', this.get_name(), size.width, size.height)

		const dom_elem = this.get_dom_element()

		if (size.width == 0 || size.height == 0)
		{
			size.width  = dom_elem.offsetWidth,
			size.height = dom_elem.offsetHeight
			console.log(context + ':update_size:name=%s:from get_size:width=%s height:%s', this.get_name(), size.width, size.height)
		}
		
		dom_elem.style.width  = '' + size.width  + 'px;'
		dom_elem.style.height = '' + size.height + 'px;'

		return size
	}



	/**
	 * Get component size.
	 * 
	 * @returns {object} - size object { width:integer, height:integer }
	 */
	get_size()
	{
		const dom_elem = this.get_dom_element()
		return {
			width:dom_elem.offsetWidth,
			height:dom_elem.offsetHeight
		}
	}
	


	/**
	 * Get component size.
	 * 
	 * @returns {object} - size object { width:integer, height:integer }
	 */
	// get_content_size()
	// {
	// 	const dom_elem = this.get_dom_element()
	// 	return {
	// 		width:dom_elem.offsetWidth,
	// 		height:dom_elem.offsetHeight - 15
	// 	}
	// }
}
