// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T   from 'devapt-core-common/dist/js/utils/types'
import uid from 'devapt-core-common/dist/js/utils/uid.js'

// BROWSER IMPORTS
import BoundDom       from './bound_dom'


const context = 'browser/base/component/stated_dom'



/**
 * @file UI stated dom class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example:
 * 	API
 * 		->update():Promise - Update view with current state.
 * 		->update_children():Promise - Update view with current state.
 * 
 * 		->clear():Promise - Clear component to initial values.
 * 
 *		->dispatch_update_state_action(arg_new_state):nothing - Dispatch update state action.
 * 		->dispatch_update_state_value_action(arg_path, arg_value):nothing - Dispatch update state action.
 * 
 * 		->get_children_component():array - Get view children components.
 * 
 */
export default class StatedDom extends BoundDom
{
	/**
	 * Creates an instance of StatedDom.
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
		
		this.is_stated_dom   = true

		// CHILDREN COMPONENTS
		this._children_components = undefined

		// DEBUG
		// console.info(context + ':constructor:creating component ' + this.get_name())
		// this.enable_trace()
	}



	/**
	 * Update view with current state.
	 * 
	 * @returns {Promise}
	 */
	update()
	{
		this.enter_group('update')

		console.info(context + ':update:%s', this.get_name())

		this._ready_promise = this._ready_promise.then(
			()=>{
				return this._update()
			}
		)

		this.leave_group('update:async')
		return this._ready_promise
	}


	_update()
	{
		this.debug('update:name=' + this.get_name() + ',dom_id=' + this.get_dom_id() )

		const new_elm = document.getElementById(this.get_dom_id())
		const prev_elm = this.get_dom_element()
		// console.log(prev_elm, context + ':update:prev_elm')
		// console.log(new_elm,  context + ':update:new_elm')

		if (!new_elm)
		{
			// this.leave_group('update')
			return Promise.resolve()
		}

		if (prev_elm != new_elm)
		{
			this.debug(':update:prev_elm <> new_elm')
			if (prev_elm.parentNode)
			{
				prev_elm.parentNode.removeChild(prev_elm)
			}
			this._dom_element = new_elm
		}
		
		let promise = Promise.resolve()
		if ( T.isFunction(this._update_self) )
		{
			this.debug(':update:call _update_self (async)')

			promise = promise.then(
				()=>{
					this._update_self(prev_elm, new_elm)
				}
			)
		}

		promise = promise.then(
			()=>
			{
				this.update_children()
			}
		)

		return promise
	}



	/**
	 * Update view with current state.
	 * 
	 * @returns {Promise}
	 */
	update_children()
	{
		this.enter_group('update_children')

		this.get_children_component().forEach(
			(component)=>{
				this.debug(':update_children:component=' + component.get_name())
				component.update()
			}
		)

		this.leave_group('update_children')
	}



	/**
	 * Clear component to initial values.
	 * 
	 * @returns {Promise}
	 */
	clear()
	{
		// TO OVERWRITE
	}



	/**
	 * Get a named stream.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * 
	 * @returns {Stream|undefined} - found stream.
	 */
	get_named_stream(arg_stream_name)
	{
		switch(arg_stream_name.toLocaleLowerCase()) {
			case 'runtime_logs': return this._runtime.logs_stream
		}
		
		console.warn(context + ':get_named_stream:%s:unknow named stream', this.get_name(), arg_stream_name.toLocaleLowerCase())
		return undefined
	}



	/**
	 * Dispatch update state action.
	 * 
	 * @param {Immutable.Map} arg_new_state - new state Immutable Map.
	 * 
	 * @returns {nothing}
	 */
	dispatch_update_state_action(arg_new_state)
	{
		if ( ! T.isObject(arg_new_state) )
		{
			return
		}

		const new_state = arg_new_state.toJS ? arg_new_state.toJS() : arg_new_state
		// console.log(context + ':dispatch_update_state_action:new state:', new_state)

		const action = { type:'ADD_JSON_RESOURCE', resource:this.get_name(), path:this.get_state_path(), json:new_state }
		window.devapt().ui().store.dispatch(action)
	}



	/**
	 * Dispatch update state action.
	 * 
	 * @param {array|string} arg_path - component state path.
	 * @param {any} arg_value - component state value.
	 * 
	 * @returns {nothing}
	 */
	dispatch_update_state_value_action(arg_path, arg_value)
	{
		if (! T.isArray(arg_path) )
		{
			console.error(context + ':dispatch_update_state_value_action:bad path array:path,value:', arg_path, arg_value)
			return
		}
		// console.log(context + ':dispatch_update_state_value_action:path,value:', arg_path, arg_value)
		
		const new_state = this.get_state().setIn(arg_path, arg_value)
		this.dispatch_update_state_action(new_state)
	}



	/**
	 * Get view children components.
	 * 
	 * @returns {array} - list of Component.
	 */
	get_children_component()
	{
		// SKIP FOR MENUBAR
		if (this.is_menubar)
		{
			return []
		}
		
		if ( ! this._children_components)
		{
			this._children_components = []

			// GET APPLICATION STATE AND INIT APPLICATION STATE PATH
			const ui = window.devapt().ui()
			const current_app_state = ui.store.get_state()
			const state_path = ['views']

			// GET COMPONENT DESCRIPTION AND CHILDREN
			const component_desc = ui._ui_factory.find_component_desc(current_app_state, this.get_name(), state_path)
			const children = component_desc ? component_desc.get('children', undefined) : undefined
			const children_names = children ? Object.keys( children.toJS() ) : []
			this.debug(':get_children_component:init with children_names:', children_names)

			// GET COMPONENT ITEMS
			const items = this.get_state_value('items', [])
			this.debug(':get_children_component:init with items:', JSON.stringify(items))

			const all_children = _.concat(children_names, items)
			// console.info(context + ':get_children_component:all_children:%s:', this.get_name(), all_children)

			const unique_children = {}
			all_children.forEach(
				(item)=>{
					if ( T.isObject(item) )
					{
						this.debug(':get_children_component:loop on item object')
						
						if ( T.isString(item.view) )
						{
							if (item.viewitem in unique_children)
							{
								return
							}

							this.debug(':get_children_component:loop on item string:', item.view)
							
							const component = window.devapt().ui(item.view)
							if (component && component.is_component)
							{
								this._children_components.push(component)
								unique_children[component.get_name()] = true
								return
							}

							this.warn(':get_children_component:bad item component for:', item.view)
							return
						}

						this.warn(':get_children_component:bad item object for:', JSON.stringify(item))
						return
					}
					
					if ( T.isString(item) )
					{
						if (item in unique_children)
						{
							return
						}

						this.debug(':get_children_component:loop on item string:', item)
						const component = window.devapt().ui(item)
						if (component && component.is_component)
						{
							this._children_components.push(component)
							unique_children[component.get_name()] = true
							return
						}

						this.warn(':get_children_component:bad item component for:', item)
						return
					}

					this.warn(':get_children_component:bad item type for:', item.toString())
				}
			)
		}

		
		this.debug(':get_children_component:', this._children_components)
		return this._children_components
	}



	/**
	 * Render a component inside this element from a json description.
	 * 
	 * @param {object} arg_options - json source configuration.
	 * 
	 * @returns {nothing}
	 */
	register_and_render_inside_from_json(arg_options)
	{
		this.enter_group('register_and_render_inside_from_json')

		const json = this.register_from_json(arg_options)

		if (! T.isObject(json) )
		{
			this.leave_group('register_and_render_inside_from_json:error:bad json object')
			return
		}

		this.render_inside_from_json(json.name, json)

		this.leave_group('register_and_render_inside_from_json')
	}



	/**
	 * Register a component description from a json content.
	 * 
	 * @param {object} arg_options - json source configuration.
	 * 
	 * @returns {nothing}
	 */
	register_from_json(arg_options)
	{
		this.enter_group('register_from_json')
		
		console.log(context + ':register_from_json:options=', arg_options)
		
		if (arg_options.is_event_handler)
		{
			arg_options = arg_options.data
		}

		// CHECK CONFIGURATION
		if ( ! T.isObject(arg_options) )
		{
			console.warn(context + ':register_from_json:bad options object')
			this.leave_group('register_from_json:error:bad options object')
			return
		}
		if ( ! T.isString(arg_options.json_source_view) )
		{
			console.warn(context + ':register_from_json:bad options.json_source_view string')
			this.leave_group('register_from_json:error:bad options.json_source_view string')
			return
		}
		if ( ! T.isString(arg_options.json_source_getter) )
		{
			console.warn(context + ':register_from_json:bad options.json_source_getter string')
			this.leave_group('register_from_json:error:bad options.json_source_getter string')
			return
		}
		const source_object = this.get_runtime().ui().get(arg_options.json_source_view)
		if ( ! T.isObject(source_object) || ! source_object.is_component )
		{
			console.warn(context + ':register_from_json:%s:view=%s:bad json source component', this.get_name(), arg_options.json_source_view, source_object)
			this.leave_group('register_from_json:error:bad json source component')
			return
		}
		if ( ! (arg_options.json_source_getter in source_object) )
		{
			console.warn(context + ':register_from_json:bad json source method for component')
			this.leave_group('register_from_json:error:bad json source method for component')
			return
		}
		if ( ! ( T.isFunction( source_object[arg_options.json_source_getter] )) )
		{
			console.warn(context + ':register_from_json:bad json source method for component')
			this.leave_group('register_from_json:error:bad json source method for component')
			return
		}

		// GET JSON FROM SOURCE
		try{
			const json = source_object[arg_options.json_source_getter]()

			// DEBUG
			console.log(context + ':register_from_json:json=', json)

			// CHECK COMPONENT NAME
			if ( ! T.isString(json.name) )
			{
				console.warn(context + ':register_from_json:bad json.name string')
				this.leave_group('register_from_json:error:bad json.name string')
				return
			}

			// STORE COMPONENT DESCRIPTION
			const action = { type:'ADD_JSON_RESOURCE', resource:json.name, collection:'views', json:json }
			this.get_runtime().get_state_store().dispatch(action)

			this.leave_group('register_from_json')
			return json
		}
		catch(e) {
			console.warn(context + ':register_from_json:error %s', e)

			this.leave_group('register_from_json:error:' + e)
			return undefined
		}
	}



	/**
	 * Render a component inside this element from a json description.
	 * 
	 * @param {string} arg_name - component name.
	 * @param {object} arg_json_desc - component description.
	 * 
	 * @returns {nothing}
	 */
	render_inside_from_json(arg_name, arg_json_desc)
	{
		this.enter_group('render_inside_from_json')
		
		console.log(context + ':render_inside_from_json:name and description:', arg_name, arg_json_desc)
		
		try{
			// CREATE COMPONENT ELEMENT
			const this_element = this.get_dom_element()
			if ( ! this_element)
			{
				console.warn(context + ':render_inside_from_json:bad dom element')
				this.leave_group('render_inside_from_json:error:bad dom element')
				return
			}

			const this_document = this_element.ownerDocument
			const existing_element = this_document.getElementById(arg_name)
			let sub_element = undefined
			if (existing_element)
			{
				if (existing_element.parentElement == this_element)
				{
					sub_element = existing_element
				} else {
					console.warn(context + ':render_inside_from_json:a previous element exist with given name=%s', arg_name)
					this.leave_group('render_inside_from_json:error:bad dom element')
					return
				}
			} else {
				sub_element = this_element.ownerDocument.createElement('div')
				sub_element.setAttribute('id', arg_name)
				this_element.appendChild(sub_element)
			}

			const component = this.get_runtime().ui().create_local(arg_name, arg_json_desc)
			component.render(true)
			.then(
				()=>{
					window.devapt().content_rendered()
				}
			)
		} catch(e){
			console.warn(context + ':render_inside_from_json:error %s', e)
			return
		}
	}
}
