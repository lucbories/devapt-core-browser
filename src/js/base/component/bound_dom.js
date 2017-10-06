// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T   from 'devapt-core-common/dist/js/utils/types'
import uid from 'devapt-core-common/dist/js/utils/uid.js'

// BROWSER IMPORTS
import BindingsLoader from '../binding/bindings_loader'
import RenderedDom    from './rendered_dom'


const context = 'browser/base/component/bound_dom'



/**
 * @file UI dom bindings class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example:
 * 	API
 * 		->load(arg_state):nothing - Load and apply a component configuration.
 * 		->init_bindings():nothing - Init bindings.
 * 		->unload():nothing - Unload a component configuration.
 * 
 */
export default class BoundDom extends RenderedDom
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
		
		this.is_bound_dom = true

		this._is_loaded = false
		this._bindings = {}

		// DEBUG
		// console.info(context + ':constructor:creating component ' + this.get_name())
		// this.enable_trace()
	}
	
	
	
	/**
	 * Load and apply a component configuration.
	 * 
	 * @param {Immutable.Map|undefined} arg_state - component state to load (optional).
	 * 
	 * @returns {nothing|Promise} 
	 */
	load(arg_state)
	{
		this.enter_group('load')

		if (this._is_loaded)
		{
			// console.info(context + ':load:already loaded component ' + this.get_name())
			this.leave_group('load:already loaded')
			return
		}

		// const self = this
		// console.info(context + ':load:loading component ' + this.get_name())
		
		if (! this.store_unsubscribe)
		{
			this.store_unsubscribe = this.get_runtime().create_store_observer(this)
		}
		
		const state = arg_state ? arg_state : this.get_state()
		// console.log(state, 'load bindinds')
		
		if (! state)
		{
			this.leave_group('load:no state found')
			return
		}

		this.init_assets()

		// this.update()

		this._is_loaded = true
		this.leave_group('load')
	}
	

	
	/**
	 * Init bindings.
	 * 
	 * @returns {nothing} 
	 */
	init_bindings()
	{
		this.enter_group('init_bindings')

		const state = this.get_state()
		const bindings = state.has('bindings') ? state.get('bindings').toJS() : undefined
		if ( T.isObject(bindings) )
		{
			if ( T.isArray(bindings.services) )
			{
				bindings.services.forEach(
					(bind_cfg) => {
						bind_cfg.type = bind_cfg.timeline ? 'timeline' : (bind_cfg.dom_event ? 'emitter_jquery' : 'service')
						const id = 'binding_' + uid()
						this._bindings[id] = BindingsLoader.load(id, this._runtime, this, bind_cfg)
					}
				)
			}

			if ( T.isArray(bindings.streams) )
			{
				bindings.streams.forEach(
					(bind_cfg) => {
						// console.log(context + ':load:stream binding:', bind_cfg)
						let stream = bind_cfg.source_stream ? bind_cfg.source_stream : undefined
						
						if ( T.isString(stream) )
						{
							let source_component = this
							if ( bind_cfg.source_type == 'views' && T.isNotEmptyString(bind_cfg.source_selector) )
							{
								source_component = window.devapt().ui(bind_cfg.source_selector)
							}
							stream = source_component.get_named_stream(stream)
						}

						if ( T.isObject(stream) && stream.is_stream )
						{
							bind_cfg.type = 'stream'
							bind_cfg.source_stream = stream
							const id = 'binding_' + uid()
							this._bindings[id] = BindingsLoader.load(id, this._runtime, this, bind_cfg)

							// console.log(context + ':load:stream bound:', id, bind_cfg)
						}
					}
				)
			}
			
			if ( T.isArray(bindings.emitter_jquery) )
			{
				bindings.emitter_jquery.forEach(
					(bind_cfg) => {
						bind_cfg.type = 'emitter_jquery'
						const id = 'binding_' + uid()
						const binding_streams = BindingsLoader.load(id, this._runtime, this, bind_cfg)
						if ( T.isArray(binding_streams) )
						{
							_.forEach(binding_streams,
								(binding, index)=>{
									this._bindings[id + '_' + index] = binding
								}
							)
						} else {
							this._bindings[id] = binding_streams
						}
					}
				)
			}
			
			if ( T.isArray(bindings.emitter_dom) )
			{
				bindings.emitter_dom.forEach(
					(bind_cfg) => {
						bind_cfg.type = 'emitter_dom'
						const id = 'binding_' + uid()
						const binding_streams = BindingsLoader.load(id, this._runtime, this, bind_cfg)
						if ( T.isArray(binding_streams) )
						{
							_.forEach(binding_streams,
								(binding, index)=>{
									this._bindings[id + '_' + index] = binding
								}
							)
						} else {
							this._bindings[id] = binding_streams
						}
					}
				)
			}
		}

		this.leave_group('init_bindings')
	}
	
	
	
	/**
	 * Unload a component configuration.
	 * 
	 * @returns {nothing} 
	 */
	unload()
	{
		this.enter_group('unload')

		assert( T.isFunction(this.store_unsubscribe), context + ':unload:bad store_unsubscribe function')
		
		// UNBIND ALL BINDINGS
		_.forEach(this._bindings,
			(binding/*, id*/)=>{
				binding._unsubscribe()
				if (binding._unsubscribe_state_update)
				{
					binding._unsubscribe_state_update()
				}
			}
		)

		// DETACH STORE CHANGE LISTENER
		this.store_unsubscribe()

		this.leave_group('unload')
	}
}
