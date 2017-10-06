// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T   from 'devapt-core-common/dist/js/utils/types'

// BROWSER IMPORTS
import Dom from './dom'


const context = 'browser/base/component/rendered_dom'



/**
 * @file UI rendered dom class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example:
 * 	API
 * 		->render():Promise - Render component DOM element.
 * 		->process_rendering_vnode(arg_rendering_result, arg_credentials):nothing - Process rendering VNode: create or update DOM element.
 * 		->save_rendering():nothing - Save rendering virtul node. Update component VNode with current component HTML.
 * 
 * 		->get_assets_promise():Promise - Get assets promises.
 * 		->get_assets_dependancies():array - Get assets dependancies.
 * 		->add_assets_dependancy(arg_asset_id):nothing - Add assets dependancy.
 * 		->init_assets():nothing - Init assets promises.
 */
export default class RenderedDDom extends Dom
{
	/**
	 * Creates an instance of RenderedDom.
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
		
		this.is_rendered_dom  = true
		this.is_menubar       = false
		this.is_breadcrumbs   = false

		this._ready_promise = Promise.resolve()
		this._assets_dependancies = []
		this._assets_promise = undefined

		// DEBUG
		// console.info(context + ':constructor:creating component ' + this.get_name())
		// this.enable_trace()
	}



	/**
	 * Render component DOM element.
	 * 
	 * @param {boolean} arg_force - should force creation of a new VNode if a previous rendering exists.
	 * 
	 * @returns {Promise} - Promise of this to chain promises.
	 */
	render(arg_force)
	{
		this.enter_group('render')

		this._ready_promise = this._ready_promise.then(
			()=>{
				const promise = this._render(arg_force)
				return promise.then(
					()=>{
						this.update_size()
					}
				)
			}
		)

		this.leave_group('render:async')
		return this._ready_promise
	}

	_render(arg_force)
	{
		// const is_rendered = this.get_state_value('is_rendered', false)
		// if (! arg_force && this._is_rendered)
		// {
		// 	this.leave_group('render:already rendered')
		// 	return Promise.resolve()
		// }
		
		let promise = Promise.resolve()
		if (arg_force)
		{
			this.debug('render:force rendering')
			promise = this._rendering.render()
		}

		promise = promise.then(
			()=>{
				// SHOULD RENDER VNODE
				if ( ! this.has_dom_vnode())
				{
					this.debug('render:should create vnode')
					const p = this._rendering.render()
					this.leave_group('render:vnode is created')
					return p
				}
				
				// DISPLAY VNODE
				if ( this.has_dom_vnode())
				{
					const vnode = this.get_dom_vnode()
					const p = this.process_rendering_vnode(vnode)
					this.leave_group('render:vnode is rendered')
					return p
				}

				// RENDERING FAILED
				this.error('render:render:no vnode to render')
				this.leave_group('render:no vnode to render')
				return Promise.reject(context + ':render:no dom vnode to render for ' + this.get_name())
			}
		)

		return promise
	}
	
	
	
	/**
	 * PROCESS RENDERING VNODE: CREATE OR UPDATE DOM ELEMENT.
	 */
	process_rendering_vnode(arg_rendering_result, arg_credentials)
	{
		this._rendering.process_rendering_vnode(arg_rendering_result, arg_credentials)

		this._is_visible = true
		// PROCESS CHILDREN
		// ...
	}



	/**
	 * Destroy component DOM element.
	 * 
	 * @returns {Promise}
	 */
	destroy()
	{
		this.enter_group('destroy')

		if (this._dom_element)
		{
			this._dom_element.parentNode.removeChild(this._dom_element)
		}
		
		this.leave_group('destroy')
	}



	/**
	 * Save rendering virtul node. Update component VNode with current component HTML.
	 * 
	 * @returns {nothing}
	 */
	save_rendering()
	{
		this._rendering.save_rendering()
	}



	/**
	 * Update component size with its content.
	 * 
	 * @returns {nothing}
	 */
	update_size()
	{
		// NOTHING TO DO
	}
	


	/**
	 * Get assets promises.
	 * 
	 * @returns {Promise}
	 */
	get_assets_promise()
	{
		return this._assets_promise
	}
	


	/**
	 * Get assets dependancies.
	 * 
	 * @returns {array}
	 */
	get_assets_dependancies()
	{
		return this._assets_dependancies
	}
	


	/**
	 * Add assets dependancy.
	 * 
	 * @param {string} arg_asset_id - asset element id.
	 * 
	 * @returns {nothing}
	 */
	add_assets_dependancy(arg_asset_id)
	{
		return this._assets_dependancies.push(arg_asset_id)
	}



	/**
	 * Init assets promises.
	 * 
	 * @returns {nothing}
	 */
	init_assets()
	{
		this.enter_group('init_assets')

		const assets_promises = []
		this._assets_dependancies.forEach(
			(asset_id)=>{
				assets_promises.push( window.devapt().asset_promise(asset_id) )
			}
		)
		// console.log(context + ':init:%s:assets:', this.get_name(), this._assets_dependancies)

		this._assets_promise = Promise.all(assets_promises)

		this.leave_group('init_assets')
	}
}
