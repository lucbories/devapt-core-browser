// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import T             from '../../../node_modules/devapt-core-common/dist/js/utils/types'
import Stream        from '../../../node_modules/devapt-core-common/dist/js/messaging/stream'


let context = 'browser/runtime/service_operation'



/**
 * @file client ServiceOperation class.
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class ServiceOperation
{
	/**
	 * Create a client Runtime instance.
	 * 
	 * @param {string} arg_svc_name - service name.
	 * @param {object} arg_svc_settings - service settiings.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_op_name, arg_op_settings)
	{
		this._name = arg_op_name
		this._settings = arg_op_settings
		this.is_service_operation = true
	}



	/**
	 * Get service name.
	 * 
	 * @returns {string}
	 */
	get_name()
	{
		return this._name
	}



	/**
	 * Execute operation on browser.
	 * 
	 * @param {any}    arg_operands    - operation operands.
	 * @param {object} arg_credentials - session credentials.
	 * 
	 * @returns {Stream} - service results stream.
	 */
	execute_on_browser()
	{
		// TODO
	}
	
	
	/**
	 * Execute operation on remote server.
	 * 
	 * @param {object} arg_svc_socket  - remote service socket.
	 * @param {string} arg_svc_path    - remote service socket.
	 * @param {any}    arg_operands    - operation operands.
	 * @param {object} arg_credentials - session credentials.
	 * @param {string} arg_session_uid - session unique id.
	 * 
	 * @returns {Stream} - service results stream.
	 */
	execute_on_server(arg_svc_socket, arg_svc_path, arg_operands, arg_credentials, arg_session_uid)
	{
		const op_name = this.get_name()
		// console.log(context + ':execute_remote:op=%s:path=%s:operands=%o', op_name, arg_svc_path, arg_operands)

		// DEFINE REQUEST PAYLOAD
		const request = {
			session_uid:arg_session_uid,
			service:this._settings.service.get_name(),
			operation:op_name,
			operands: T.isArray(arg_operands) ? arg_operands : [arg_operands],
			credentials:arg_credentials
		}
		
		// REPEAT EVERY xxx MILLISECONDS FOR LOCAL SETTINGS
		if ( T.isObject(arg_operands) && T.isObject(arg_operands.poller) )
		{
			const poller_settings = arg_operands.poller
			this.create_poller(poller_settings, op_name, arg_credentials, arg_svc_socket, [arg_operands])
		}
		
		let stream = Stream.from_emitter_event(arg_svc_socket, op_name)

		// DEBOUNCE STREAM
		if ( T.isObject(arg_operands) && T.isNumber(arg_operands.debounce_milliseconds) )
		{
			stream = stream.debounce_immediate(arg_operands.debounce_milliseconds)
		}

		stream.on_error(
			(error) => {
				console.error(context + 'svc=' + arg_svc_path + ':op_name=' + op_name + ':error=', error)
			}
		)

		// SEND REQUEST
		console.log(context + ':execute_remote:request=', request)
		arg_svc_socket.emit(op_name, request)

		
		// RETURN RESPONSE STREAM
		return stream
	}
}
