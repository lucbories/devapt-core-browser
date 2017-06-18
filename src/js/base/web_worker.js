// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import T from '../../../node_modules/devapt-core-common/dist/js/utils/types'

// BROWSER IMPORTS


const context = 'browser/base/web_worker'



/**
 * Web worker class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
 * 
 * 	API:
 * 		->do():Promise - do display.
 * 		->start()
 * 		->stop()
 */
export default class WebWorker
{
	/**
	 * Creates a web worker instance.
	 * 
	 * @param {string} arg_worker_name - worker name.
	 * @param {string} arg_script_url - worker script url.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_worker_name, arg_script_url)
	{
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_web_worker = true

		
		// WORKER NOT SUPPORTED
		if (typeof(Worker) === "undefined")
		{
			throw Error(context + ':worker=[' + arg_worker_name + ']:Worker is not supported')
		}

		this._name = arg_worker_name
		this._worker = new Worker(arg_script_url)

		this._requests = {}
		this._requests_count = 0
		
		const self = this

		this._worker.addEventListener('message',
			function(event)
			{
				self.process_response(event.data)
			}
		)

		this._worker.addEventListener('error',
			function(error)
			{
				self.process_error(error)
			}
		)
	}



	/**
	 * Get worker name.
	 * 
	 * @returns {string}
	 */
	get_name()
	{
		return this._name
	}



	/**
	 * Process error.
	 * 
	 * @param {any} arg_error - processing error.
	 * 
	 * @returns {Promise}
	 */
	process_error(arg_error)
	{
		console.error(context + ':worker=[' + this.get_name() + ']:error=[' + JSON.stringify(arg_error) + ']')
	}



	/**
	 * Process message response.
	 * 
	 * @param {any} arg_data - response data.
	 * 
	 * @returns {nothing}
	 */
	process_response(arg_data)
	{
		console.log(context + ':process_response:data=', arg_data)

		try{
			const response = JSON.parse(arg_data)
			
			if (response && response.id && (response.id in this._requests) )
			{
				this._requests[response.id].resolve(response.result)
				delete this._requests[response.id]
			}
		}
		catch(e)
		{
			if (arg_data && arg_data.id && (arg_data.id in this._requests) )
			{
				this._requests[arg_data.id].reject(e)
				delete this._requests[arg_data.id]
			}
			this.process_error(e)
		}
	}



	/**
	 * Submit a request.
	 * 
	 * @param {any} arg_data - request data.
	 * 
	 * @returns {Promise}
	 */
	submit_request(arg_data)
	{
		console.log(context + ':submit_request:data=', arg_data)

		const id = ++this._requests_count
		const request = {
			id: id,
			data: JSON.stringify(arg_data)
		}

		const response_promise = new Promise(
			(resolve_fn, reject_fn)=>{
				this._requests[id] = {
					request: request,
					resolve: resolve_fn,
					reject:  reject_fn,
					promise: response_promise
				}
				this._worker.postMessage(request)
			}
		)

		response_promise.then(
			(results)=>{
				return results
			}
		)

		return response_promise
	}



	/**
	 * Stop worker.
	 */
	stop()
	{
		console.log(context + ':stop')

		if (typeof(this._worker) !== "undefined")
		{
			this._worker.terminate()
			this._worker = undefined
			// this._worker_promise = undefined // DO NOT DELETE RESULTS PROMISE
		}
	}
}