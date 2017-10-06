// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import T from 'devapt-core-common/dist/js/utils/types'

// BROWSER IMPORTS
import NameTypeSettingsLoggable from './name_type_settings_loggable'


const context = 'browser/base/feature'



/**
 * @file Base stateless Feature class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
 * 	API
 * 		->get_name():string - get command name (INHERITED).
 * 		->get_type():string - get command type (INHERITED).
 * 		->get_settings():object - get instance type (INHERITED).
 * 		->is_valid():boolean - check if instance is valid (settings...) (INHERITED, SUBCLASSED).
 * 
 * 		->get_author():string|object - get author id or record.
 * 		->get_license():string - get license name.
 * 		->get_about():string|object - get about doc content.
 * 		->get_help():string|object - get about doc content.
 * 		->get_refdoc():string|object - get about doc content.
 * 
 */
export default class Feature extends NameTypeSettingsLoggable
{
	/**
	 * Creates an instance of Feature, do not use directly but in a sub class.
	 * 
	 * A Feature configuration is a simple object with this common attributes:
	 * 		- name:string  - unique name.
	 * 		- type:string  - type of commnand from command factory known types list (example: display).
	 * 		- about:string - string or doc object: { 'topicA':{ 'topicA1':'...' }, 'topicB':'...' }.
	 * 		- help:string  - string or doc object: { 'topicA':{ 'topicA1':'...' }, 'topicB':'...' }.
	 * 		- refdoc:string  - string or doc object: { 'topicA':{ 'topicA1':'...' }, 'topicB':'...' }.
	 * 
	 * @param {object}           arg_runtime     - runtime.
	 * @param {object}           arg_settings    - instance settings.
	 * @param {string|undefined} arg_log_context - context of traces of this instance (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_settings, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context
		super(arg_runtime, arg_settings, log_context)
		
		this.is_feature = true
	}



	/**
	 * Get Author.
	 * 
	 * @returns {string|object} - author id string or author record object
	 */
	get_author()
	{
		return ( T.isObject(this._settings) && ( T.isString(this._settings.author) || T.isObject(this._settings.author) ) ) ? this._settings.author : undefined
	}



	/**
	 * Get License name.
	 * 
	 * @returns {string}
	 */
	get_license()
	{
		return ( T.isObject(this._settings) && T.isString(this._settings.license) ) ? this._settings.license : undefined
	}



	/**
	 * Get About content.
	 * 
	 * @returns {string|object}
	 */
	get_about()
	{
		return ( T.isObject(this._settings) && ( T.isString(this._settings.about) || T.isObject(this._settings.about) ) ) ? this._settings.about : undefined
	}



	/**
	 * Get Help content.
	 * 
	 * @returns {string|object}
	 */
	get_help()
	{
		return ( T.isObject(this._settings) && ( T.isString(this._settings.help) || T.isObject(this._settings.help) ) ) ? this._settings.help : undefined
	}



	/**
	 * Get Referential Docs content.
	 * 
	 * @returns {string|object}
	 */
	get_refdoc()
	{
		return ( T.isObject(this._settings) && T.isString(this._settings.refdoc) ) ? this._settings.refdoc : undefined
	}



	/**
	 * Check if instance settings is valid.
	 * 
	 * @returns {boolean}
	 */
	is_valid()
	{
		return this.get_name() != 'no name'
			&& this.get_type() != 'no type'
			&& this.get_about()
			&& this.get_help()
			&& this.get_refdoc()
	}
}