// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import T from '../../../node_modules/devapt-core-common/dist/js/utils/types'

// BROWSER IMPORTS
import Command from './command'


const context = 'browser/commands/worker_command'



/**
 * Web worker command class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
 * 
 * 	API:
 * 		->do():Promise - do display.
 * 		->undo():Promise - undo display and display history previous content.
 * 		->start()
 * 		->stop()
 */
export default class WorkerCommand extends Command
{
	/**
	 * Creates a web worker command instance.
	 * 
	 * Command configuration is a simple object with:
	 * 		- url: local script url
	 * 
	 * @param {object} arg_runtime - client runtime.
	 * @param {object} arg_settings - command settings.
	 * @param {string} arg_log_context - context of traces of this instance (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_settings, arg_log_context=context)
	{
		super(arg_runtime, arg_settings, arg_log_context)
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_worker_command = true

		this._worker = undefined
		this._worker_promise = undefined

		this._script_url = T.isObject(this._settings) && T.isNotEmptyString(this._settings.script_url) ? this._settings.script_url : undefined
		this._script_operands = T.isObject(this._settings) && this._settings.script_operands ? this._settings.script_operands : undefined
		
		// this.enable_trace()
		// this.update_trace_enabled()
	}



	/**
	 * Check if command settings is valid.
	 * 
	 * @returns {boolean}
	 */
	is_valid()
	{
		const has_url  = T.isNotEmptyString(this._script_url) || this._script_operands == undefined
		
		return has_url
	}



	/**
	 * Do command.
	 * 
	 * @returns {Promise}
	 */
	_do()
	{
		// WORKER NOT SUPPORTED
		if (typeof(Worker) === "undefined")
		{
			return Promise.reject(context + ':do:worker is not supported')
		}

		// WORKER ALREADY EXISTS
		if (typeof(this._worker) !== "undefined")
		{
			return this._worker_promise && this._worker_promise.then ? this._worker_promise : Promise.reject(context + ':' + this.get_name() + ':bad worker promise')
		}

		// CREATE WORKER
		const resolve_fn = (results)=>{
			return results
		}

		const reject_fn = (err)=>{
			return err
		}

		if ( ! this.is_valid() )
		{
			return Promise.reject(context + ':do:bad settings')
		}

		this._worker = new Worker(this._script_url)
		this._worker.onmessage = function(event){
			resolve_fn(event.data)
		}
		
		this._worker.onerror = function(error){
			reject_fn(error)
		}

		this._worker_promise = new Promise(resolve_fn, reject_fn)
		this._worker_promise.then(
			(results)=>{
				this.stop()
				return results
			}
		)

		// START
		this._worker.postMessage(this._script_operands)

		return this._worker_promise
	}



	/**
	 * Undo command.
	 * 
	 * @returns {Promise}
	 */
	_undo()
	{
		if (typeof(Worker) === "undefined")
		{
			return Promise.reject(context + ':undo:worker is not supported')
		}

		return Promise.reject(context + ':undo:not yet implemented')
	}



	/**
	 * Stop worker.
	 */
	stop()
	{
		if (typeof(this._worker) !== "undefined")
		{
			this._worker.terminate()
			this._worker = undefined
			// this._worker_promise = undefined // DO NOT DELETE RESULTS PROMISE
		}
	}
}