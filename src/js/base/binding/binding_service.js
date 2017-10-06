// NPM IMPORTS
import assert from 'assert'
import { format } from 'util'

// COMMON IMPORTS
import T      from 'devapt-core-common/dist/js/utils/types'
import Stream from 'devapt-core-common/dist/js/messaging/stream'

// BROWSER IMPORTS
import BindingStream from './binding_stream'


const context = 'browser/base/binding/binding_service'



/**
 * @file UI binding class for service stream.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class BindingService extends BindingStream
{
	/**
	 * Creates an instance of Binding.
	 * @extends Bindable
	 *
	 * @param {string} arg_id - binding identifier.
	 * @param {RuntimeBase} arg_runtime - client runtime.
	 * @param {Component} arg_component - component instance.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_id, arg_runtime, arg_component)
	{
		super(arg_id, arg_runtime, arg_component)

		this.is_binding_service = true
	}


	
	/**
	 * Build binding.
	 * 
	 * @returns {Promise} 
	 */
	build()
	{
		this._component.enter_group('build')

		// console.log(context + ':build:loading binding for component=% and service=%s', this._component.get_name(), this._source_svc_name)
		
		assert( T.isString(this._source_svc_name),       context + format(':build:component=%s:bad service name=%s',                  this._component.get_name(), this._source_svc_name) )
		assert( T.isString(this._source_svc_method),     context + format(':build:component=%s:service=%s:bad service method=%s',     this._component.get_name(), this._source_svc_name, this._source_svc_method) )
		assert( T.isArray(this._targets) && this._targets.length > 0, context + format(':build:component=%s:service=%s:bad targets',  this._component.get_name(), this._source_svc_name) )
		assert( T.isString(this._target_method),         context + format(':build:component=%s:service=%s,bad target method=%s',      this._component.get_name(), this._source_svc_name, this._target_method) )
				
		const promise = this.bind_svc()
		
		// if ( T.isArray(this._state_path) && this._state_path.length > 0 )
		// {
		// 	const opds = { method:{ operands:[this._state_path]}}
		// 	this.set_targets_instances_array([this._component])
		// 	this.set_target_method_name('dispatch_update_state_value_action')
		// 	this.set_options(opds)
		// 	this._unsubscribe_state_update = this.bind_svc()
		// }

		this._component.leave_group('build:async')
		return promise
	}
	
	
	
	/**
	 * Bind a service stream event on object method.
	 * 
	 * @returns {Promise}
	 */
	bind_svc()
	{
		this._component.enter_group('bind_svc')

		console.info(context + ':bind_svc:loading binding for component ' + this._component.get_name())
		
		const promise = this._runtime.register_service(this._source_svc_name).then(
			(svc) => {
				this._component.enter_group('bind_svc - service found')
				
				assert( (this._source_svc_method in svc) && T.isFunction(svc[this._source_svc_method]), context + ':bind_svc - service found:bad bound method function')
				console.info(context + ':bind_svc:service found for component ' + this._component.get_name() + ' and service ' + this._source_svc_name)

				if (this._source_svc_method == 'post')
				{
					svc.subscribe() // TODO ?????
				}
				
				const method_cfg = T.isObject(this._options) ? this._options.method  : undefined
				const stream = new Stream( svc[this._source_svc_method](method_cfg) )

				if (this._source_svc_name == 'resources')
				{
					// DEBUG
					stream.get_transformed_stream().onValue(
						(values) => {
							console.log(context + ':bind_svc:resources stream:%s:values=', this._component.get_name(), values)
						}
					)
				}
				this.set_stream(stream)
				super.build()

				this._component.leave_group('bind_svc - service found')
			}
		)

		this._component.leave_group('bind_svc:async')
		return promise
	}
}
