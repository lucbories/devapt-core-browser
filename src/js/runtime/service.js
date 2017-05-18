// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T             from '../../../node_modules/devapt-core-common/dist/js/utils/types'
import { transform } from '../../../node_modules/devapt-core-common/dist/js/utils/transform'
import Stream        from '../../../node_modules/devapt-core-common/dist/js/messaging/stream'

// BROWSER IMPORT
import ServiceOperation from './service_operation'
import DEFAULT_OPS      from './service_default_ops'


const context = 'browser/runtime/service'




/**
 * @file client Service class.
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class Service
{
	/**
	 * Create a service wrapper instance.
	 * 
	 * @param {string} arg_svc_name - service name.
	 * @param {object} arg_svc_settings - service settiings.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_svc_name, arg_svc_settings)
	{
		this.$name = arg_svc_name
		this.is_service = true
		this.execute_on_browser = false
		
		// MAP OF POLLING TIMERS: name => timer id
		this.timers = {}
		
		this.load(arg_svc_settings)
	}



	/**
	 * Get service name.
	 * 
	 * @returns {string}
	 */
	get_name()
	{
		return this.$name
	}
	
	
	
	/**
	 * Load service settings.
	 * 
	 * @param {object} arg_settings - runtime settings.
	 * 
	 * @returns {nothing}
	 */
	load(arg_settings)
	{
		const self = this
		// console.log(context + ':load: name=' + this.$name + ' settings=', arg_settings)
		
		// SERVICE EXECUTION IS BROWSER OR SERVER (default)
		if ('execution' in arg_settings)
		{
			if (arg_settings.execution == 'browser')
			{
				this.execute_on_browser = true
			}
		}
		
		// GET SERVICES OPERATIONS
		let ops = DEFAULT_OPS
		if ('operations' in arg_settings)
		{
			ops = arg_settings['operations']
		}
		// console.log(context + ':load: name=' + this.$name + ' ops=', ops)
		
		// GET POLLERS AND TIMELINE SETTINGS
		const pollers_settings = ('pollers' in arg_settings) ? arg_settings.pollers : undefined
		const timeline_settings = ('timeline' in arg_settings) ? arg_settings.timeline : undefined
		// console.log(context + ':load:settings.pollers=', pollers_settings)

		// CONFIGURE OPERATIONS
		this.$ops = ops
		const svc_path = '/' + this.$name
		const svc_socket = window.io(svc_path)
		self.socket = svc_socket
		
		this.$ops.forEach(
			(operation) => {
				const op_name = operation
				// console.log(context + ':load:svc=%s:op=%s', this.get_name(), op_name)
				
				// OPERATION POLLER: REPEAT EVERY xxx MILLISECONDS FOR GLOBAL SETTINGS
				if (! this.execute_on_browser && pollers_settings && (op_name in pollers_settings))
				{
					const pollers_op_settings = pollers_settings[op_name]
					// console.log('service has poller for operation:' + op_name, pollers_op_settings)

					this.create_poller(pollers_op_settings, op_name, arg_settings.credentials, svc_socket, [])
				}

				// OPERATION EXECUTION
				const svc_operation = new ServiceOperation(op_name, {service:this})
				self[op_name] = (arg_operands) => {
					// console.log(context + ':op:%s:%s:cfg=', this.get_name(), op_name, arg_operands)

					if (this.execute_on_browser)
					{
						return svc_operation.execute_on_browser(arg_operands, arg_settings.credentials)
					}

					return svc_operation.execute_on_server(svc_socket, svc_path, arg_operands, arg_settings.credentials, arg_settings.session_uid)
				}
				self[op_name].operation = svc_operation

				// OPERATION TIMELINE: HAS HISTORY?
				self[op_name].timelines = {}
				if (! this.execute_on_browser && timeline_settings && (op_name in timeline_settings))
				{
					this.create_timeline(op_name, svc_socket, timeline_settings)
				}
			}
		)
	}


	
	/**
	 * Create a timer.
	 * 
	 * @param {string}	arg_timer_name - timer unique name.
	 * @param {function} arg_timer_cb - timer callback function.
	 * @param {integer} arg_delay - timer interval integer in milliseconds.
	 * @param {boolean} arg_force_create - if true delete existing timer and recreate it (default=false).
	 * 
	 * @returns {nothing}
	 */
	create_timer(arg_timer_name, arg_timer_cb, arg_delay, arg_force_create = false)
	{
		assert( T.isString(arg_timer_name), context + ':create_timer:bad timer name string')
		assert( T.isFunction(arg_timer_cb), context + ':create_timer:bad timer callback function')
		assert( T.isNumber(arg_delay), context + ':create_timer:bad timer delay integer')
		assert( T.isBoolean(arg_force_create), context + ':create_timer:bad force create boolean')
		
		// console.log('create_timer', arg_timer_name, this.timers)
		
		if (arg_timer_name in this.timers)
		{
			// console.log(context + ':create_timer:timer exists name=' + arg_timer_name)
			if (! arg_force_create)
			{
				return
			}

			// DELETE EXISTING TIMER
			// console.log(context + ':create_timer:delete existing timer name=' + arg_timer_name)
			this.delete_timer( this.timers[arg_timer_name] )
			delete this.timers[arg_timer_name]
		}
		
		// CREATE TIMER
		// console.log(context + ':create_timer:create timer name=' + arg_timer_name)
		this.timers[arg_timer_name] = setInterval(
			arg_timer_cb,
			arg_delay
		)
	}
	
	

	/**
	 * Create a poller for the given socket operation.
	 * 
	 * @param {object} arg_poller_settings - poller settings { name:'...', interval_seconds|interval_milliseconds:number }.
	 * @param {object} arg_op_name - service operation name.
	 * @param {object} arg_credentials - session credentials.
	 * @param {object} arg_socket - service socket.
	 * @param {array} arg_op_opds - operation operands (optional)(default=[]).
	 * 
	 * @returns {nothing}
	 */
	create_poller(arg_poller_settings, arg_op_name, arg_credentials, arg_socket, arg_op_opds=[])
	{
		const self = this

		if ( T.isObject(arg_poller_settings) )
		{
			const interval_ms = T.isNumber(arg_poller_settings.interval_seconds) ? arg_poller_settings.interval_seconds * 1000 : arg_poller_settings.interval_milliseconds
			if ( T.isNumber(interval_ms) && T.isString(arg_poller_settings.name) )
			{
				console.log('create poller for operation:' + arg_op_name, arg_poller_settings.name, interval_ms)
				
				const request = {
					session_uid:arg_session_uid,
					service:self.get_name(),
					operation:arg_op_name,
					operands:arg_op_opds,
					credentials:arg_credentials
				}

				self.create_timer(
					arg_poller_settings.name,
					() => {
						// console.log('GLOBAL SETTINGS:create_timer svc_socket.emit', svc_path, op_name)
						arg_socket.emit(arg_op_name, request)
					},
					interval_ms,
					false
				)
			}
		}
	}
	


	/**
	 * Delete a timer.
	 * 
	 * @param {any}	arg_timer_id.
	 * 
	 * @returns {nothing}
	 */
	delete_timer(arg_timer_id)
	{
		clearInterval(arg_timer_id)
	}


	create_timeline(op_name, svc_socket, timeline_settings)
	{
		console.log('service has timeline for operation:' + op_name, timeline_settings)

		let timeline_op_settings_array = timeline_settings[op_name]
		if( T.isObject(timeline_op_settings_array) )
		{
			timeline_op_settings_array = [timeline_op_settings_array]
		}
		
		let stream = Stream.from_emitter_event(svc_socket, op_name)

		timeline_op_settings_array.forEach(
			(timeline_op_settings) => {
				if ( T.isObject(timeline_op_settings) && timeline_op_settings.transform && T.isNumber(timeline_op_settings.max) && T.isString(timeline_op_settings.name) && T.isNumber(timeline_op_settings.interval_seconds))
				{
					self[op_name].timelines[timeline_op_settings.name] = {
						values:[],
						previous_ts:undefined,
						stream:new Stream.Bus()
					}
					stream.subscribe(
						(value) => {
							value = value.datas ? value.datas : value

							if ( T.isString( timeline_op_settings.transform ) || T.isNumber( timeline_op_settings.transform ) )
							{
								const field_name = timeline_op_settings.transform
								timeline_op_settings.transform = {
									"result_type":"single",
									"fields":[
										{
											"name":field_name,
											"path":field_name
										}
									]
								}
							}

							const extracted_value = transform(timeline_op_settings.transform)(value)
							// console.log(context + ':load:timeline extracted_value=', extracted_value)
							
							const timeline = self[op_name].timelines[timeline_op_settings.name]
							const ts = Date.now()
							const prev_ts = timeline.previous_ts
							
							if (!prev_ts)
							{
								timeline.previous_ts = ts
								timeline.values = [{ts:ts, value:extracted_value}]
								timeline.stream.push(timeline.values)
							}
							else if ( (ts - prev_ts) > (timeline_op_settings.interval_seconds * 1000) )
							{
								timeline.values.push({ts:ts, value:extracted_value})
								timeline.previous_ts = ts
								
								if (timeline.values.length > timeline_op_settings.max)
								{
									const too_many = timeline.values.length - timeline_op_settings.max
									timeline.values = timeline.values.slice(too_many)
								}

								timeline.stream.push(timeline.values)
							}
						}
					)
				}
			}
		)
	}
}
