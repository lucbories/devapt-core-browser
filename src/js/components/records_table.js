// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import T from '../../../node_modules/devapt-core-common/dist/js/utils/types'

// BROWSER IMPORTS
import Table from './table'


const context = 'browser/components/records_table'



/**
 * @file UI component class.
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class RecordsTable extends Table
{
	
	/**
	 * Creates an instance of Component.
	 * @extends Table
	 * 
	 * @param {object} arg_runtime - client runtime.
	 * @param {object} arg_state - component state.
	 * @param {string} arg_log_context - context of traces of this instance (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_state, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context
		super(arg_runtime, arg_state, log_context)
		
		this.is_one_record_table_component = true
		
		// this.table_jqo = $("#" + this.get_dom_id())
		this.records = {}
		
		const state = this.get_state_js()
		this.fields = ('fields' in state) ? state.fields : []
		this.labels = ('labels' in state) ? state.labels : []
		this.records_key = ('records_key' in state) ? state.records_key : 'records'
		this.record_key  = ('record_key' in state) ? state.record_key : 'record_key'
	}
	
	
	
	/**
	 * Update the table with records.
	 * 
	 * @param {objetc} arg_records - datas records, plain object.
	 * 
	 * @returns {nothing}
	 */
	update_records(arg_records)
	{
		// console.log(arg_records, 'table.update_records:arg_records')
		
		var self = this
		
		if (typeof arg_records != "object")
		{
			return
		}
		
		if ( ! (this.records_key in arg_records) )
		{
			return
		}
		
		const records_of_key = arg_records[this.records_key]
		if ( T.isArray(records_of_key) )
		{
			records_of_key.forEach(
				function(record)
				{
					if ( T.isString(record) || T.isNumber(record) )
					{
						self.add_record_string(record)
					}
				}
			)
		}
	}
	
	
	
	/**
	 * Add one record to the table.
	 * 
	 * @param {string} arg_record_str - datas with one record string.
	 * 
	 * @returns {nothing}
	 */
	add_record_string(arg_record_str)
	{
		// console.log(arg_record, 'table.add_record:arg_record')
		
		var self = this
		
		if (arg_record_str in this.records)
		{
			return
		}
		
		var row_id = this.get_dom_id() + '_' + arg_record_str
		// var html = '<tr colspan="3" id="' + row_id + '"><td>' + arg_record_str + '</td></tr>'
		
		const table_elem = this.get_dom_element()
		const table_body_elem = table_elem.getElementsByTagName( "tbody" )[0]

		// APPEND FIRST ROW
		let tr_element = document.createElement('tr')
		tr_element.setAttribute('colspan', '3')
		tr_element.setAttribute('id', row_id)
		table_body_elem.appendChild(tr_element)
		
		let td_element = document.createElement('td')
		td_element.innerHTML = arg_record_str
		tr_element.appendChild(td_element)

		// APPEND FIELDS ROWS
		this.fields.forEach(
			function(field, index)
			{
				tr_element = document.createElement('tr')
				table_body_elem.appendChild(tr_element)

				td_element = document.createElement('td')
				td_element.innerHTML = ''
				tr_element.appendChild(td_element)
				
				td_element = document.createElement('td')
				td_element.innerHTML = index < self.labels.length ? self.labels[index] : ''
				tr_element.appendChild(td_element)

				td_element = document.createElement('td')
				td_element.innerHTML = '0'
				td_element.setAttribute('id', row_id + '_' + field)
				tr_element.appendChild(td_element)

				// html += '<tr> <td></td> <td>' + self.labels[index] + '</td> <td id="' + row_id + '_' + field + '">0</td> </tr>'
			}
		)
		
		// $('tbody', this.table_jqo).append(html)

		this.records[arg_record_str] = row_id
	}
	
	
	
	/**
	 * Update table with records values.
	 * 
	 * @param {array} arg_values - datas values, plain objects array.
	 * 
	 * @returns {nothing}
	 */
	update_values(arg_values)
	{
		// console.log(arg_values, 'table.update_values')
		
		var self = this
		
		if (! arg_values)
		{
			console.log(table_id, 'no values', 'table.update_values')
			return
		}
		
		const table_id = this.get_dom_id()
		
		// console.log(arg_values, 'table.update_values')
		
		arg_values = Array.isArray(arg_values) ? arg_values : [arg_values]
		
		arg_values.forEach(
			function(values)
			{
				if (values)
				{
					self.update_record_values(values)
				}
			}
		)
	}
	
	
	
	/**
	 * Update table with one record values.
	 * 
	 * @param {object} arg_record_values - datas values, plain objects.
	 * 
	 * @returns {nothing}
	 */
	update_record_values(arg_record_values)
	{
		// console.log(context + ':update_record_values:values', arg_record_values)
		
		var self = this
		
		if (! arg_record_values || ! arg_record_values[this.record_key] )
		{
			return
		}
		
		const values_key = arg_record_values[this.record_key]
		if (! (values_key in self.records) )
		{
			return
		}
		
		var row_id = self.records[values_key]
		// console.log(row_id, 'table.update_record_values:row_id')
		
		this.fields.forEach(
			function(field)
			{
				if (field in arg_record_values)
				{
					var value = arg_record_values[field]
					if (typeof value == 'number')
					{
						value = value.toFixed()
					}
					
					var field_id = row_id + '_' + field
					// $("#" + field_id).text(value)
					const element = document.getElementById(field_id)
					element.textContent = value
				}
				else
				{
					console.log('field not found in record', field, arg_record_values)
				}
			}
		)
	}
}
