/*
	Kailash Nadh (http://kailashnadh.name)
	
	localStorageDB
	v1.0, September 2011
	A simple database layer for localStorage

	License	:	GNU Public License ( http://www.fsf.org/copyleft/gpl.html )
*/

function localStorageDB(db_name) {

	var db_prefix = 'db_',
		db_id = db_prefix + db_name,
		db_new = false,	// this flag determines whether a new database was created during an object initialisation
		db = null;

	// if the database doesn't exist, create it
	db = localStorage[ db_id ];
	if( !( db && (db = JSON.parse(db)) && db.tables && db.data ) ) {
		if(!validateName(db_name)) {
			error("The name '" + db_name + "'" + " contains invalid characters.");
		} else {
			db = {tables: {}, data: {}};
			commit();
			db_new = true;
		}
	}
	
	
	// ______________________ private methods
	
	// _________ database functions
	// drop the database
	function drop() {
		delete localStorage[db_id];
		db = null;
	}
			
	// number of tables in the database
	function tableCount() {
		var count = 0;
		for(var table in db.tables) {
			count++;
		}
		return count;
	}

	// _________ table functions
	// create a table
	function createTable(table_name, fields) {
		fields.splice(fields.indexOf('ID'), 1);
		fields.unshift('ID');
		db.tables[table_name] = {fields: fields, auto_increment: 1};
		db.data[table_name] = {};
	}
	
	// drop a table
	function dropTable(table_name) {
		delete db.tables[table_name];
		delete db.data[table_name];
	}
	
	// empty a table
	function truncate(table_name) {
		db.tables[table_name].auto_increment = 1;
		db.data[table_name] = {};
	}
	
	// number of rows in a table
	function rowCount(table_name) {
		var count = 0;
		for(var ID in db.data[table_name]) {
			count++;
		}
		return count;
	}
	
	// insert a new row
	function insert(table_name, data) {
		data.ID = db.tables[table_name].auto_increment;
		db.data[table_name][ db.tables[table_name].auto_increment ] = data;
		db.tables[table_name].auto_increment++;
	}
	
	// select rows, given a list of IDs of rows in a table
	function select(table_name, ids) {
		var ID = null, results = [], row = null;
		for(var i in ids) {
			ID = ids[i];
			row = db.data[table_name][ID];
			results.push( clone(row) );
		}
		return results;
	}
	
	// select rows in a table by field-value pairs, returns the IDs of matches
	function queryByValues(table_name, data, limit) {
		var result_ids = [],
			exists = false,
			row = null;

		// loop through all the records in the table, looking for matches
		for(var ID in db.data[table_name]) {
			row = db.data[table_name][ID];
			exists = false;

			for(var field in data) {
				if(typeof data[field] == 'string') {	// if the field is a string, do a case insensitive comparison
					if( row[field].toString().toLowerCase() == data[field].toString().toLowerCase() ) {
						exists = true;
						break;
					}
				} else {
					if( row[field] == data[field] ) {
						exists = true;
						break;
					}
				}
			}
			if(exists) {
				result_ids.push(ID);
			}
			if(result_ids.length == limit) {
				break;
			}
		}
		return result_ids;
	}
	
	// select rows in a table by a function, returns the IDs of matches
	function queryByFunction(table_name, query_function, limit) {
		var result_ids = [],
			exists = false,
			row = null;

		// loop through all the records in the table, looking for matches
		for(var ID in db.data[table_name]) {
			row = db.data[table_name][ID];

			if( query_function( clone(row) ) == true ) {	// it's a match if the supplied conditional function is satisfied
				result_ids.push(ID);
			}
			if(result_ids.length == limit) {
				break;
			}
		}
		return result_ids;
	}
	
	// delete rows, given a list of their IDs in a table
	function deleteRows(table_name, ids) {
		for(var i in ids) {
			delete db.data[table_name][ ids[i] ];
		}
	}
	
	// update rows
	function update(table_name, ids, update_function) {
		var ID = '';

		for(var i in ids) {
			ID = ids[i];

			new_data = update_function( clone(db.data[table_name][ID]) );
			if(new_data) {
				db.data[table_name][ID] = validFields(table_name, new_data);
			}
		}
	}
	


	// commit the database to localStorage
	function commit() {
		localStorage[db_id] = JSON.stringify(db);
	}
	
	// throw an error
	function error(msg) {
		throw new Error(msg);
	}
	
	// clone an object
	function clone(obj) {
		var new_obj = {};
		for(var key in obj) {
			new_obj[key] = obj[key];
		}
		return new_obj;
	}
	
	// validate db, table, field names (alpha-numeric only)
	function validateName(name) {
		return name.match(/[^a-z_0-9]/ig) ? false : true;
	}
	
	// given a data list, only retain valid fields in a table
	function validFields(table_name, data) {
		var field = '', new_data = {};
		for(var i in db.tables[table_name].fields) {
			field = db.tables[table_name].fields[i];
			
			if(data[field]) {
				new_data[field] = data[field];
			}
		}
		return new_data;
	}
	
	// given a data list, populate with valid field names of a table
	function validateData(table_name, data) {
		var field = '', new_data = {};
		for(var i in db.tables[table_name].fields) {
			field = db.tables[table_name].fields[i];
			new_data[field] = data[field] ? data[field] : null;
		}
		return new_data;
	}
	


	// ______________________ public methods

	return {
		// commit the database to localStorage
		commit: function() {
			commit();
		},
		
		// is this instance a newly created database?
		isNew: function() {
			return db_new;
		},
		
		// delete the database
		drop: function() {
			drop();
		},
		
		// check whether a table exists
		tableExists: function(table_name) {
			return db.tables[table_name] ? true : false;
		},
		
		// number of tables in the database
		tableCount: function() {
			return tableCount();
		},
		
		// create a table
		createTable: function(table_name, fields) {
			var result = false;
			if(!validateName(table_name)) {
				error("The database name '" + table_name + "'" + " contains invalid characters.");
			} else if(this.tableExists(table_name)) {
				error("The table name '" + table_name + "' already exists.");
			} else {
				// make sure field names are valid
				var is_valid = true;
				for(var i in fields) {
					if(!validateName(fields[i])) {
						is_valid = false;
						break;
					}
				}
				
				if(is_valid) {
					createTable(table_name, fields);
					result = true;
				} else {
					error("One or more field names in the table definition contains invalid characters.");
				}
			}

			return result;
		},
		
		// drop a table
		dropTable: function(table_name) {
			if(tableExists(table_name)) {
				dropTable(table_name);
			} else {
				error("The table '" + table_name + "' does not exist.");
			}
		},
		
		// empty a table
		truncate: function(table_name) {
			if(tableExists(table_name)) {
				truncate(table_name);
			} else {
				error("The table '" + table_name + "' does not exist.");
			}
		},
		
		// number of rows in a table
		rowCount: function(table_name) {
			if( !this.tableExists(table_name) ) {
				error("The table '" + table_name + "' does not exist.");
			} else {
				return rowCount(table_name);
			}
		},
		
		// insert a row
		insert: function(table_name, data) {
			var result = false;
			if( !this.tableExists(table_name) ) {
				error("The table '" + table_name + "' does not exist.");
			} else {
				var data = validateData(table_name, data);

				insert(table_name, data);
				result = true;
			}
			return result;
		},
		
		// update rows
		update: function(table_name, query, update_function) {
			var result_ids = [];
			if(typeof query == 'object') {						// the query has key-value pairs provided
				var data = validFields(table_name, query);
				result_ids = queryByValues(table_name, data);
			} else if(typeof query == 'function') {				// the query has a conditional map function provided
				result_ids = queryByFunction(table_name, query);
			}
			
			update(table_name, result_ids, update_function);
		},

		// select rows
		query: function(table_name, query, limit) {
			if(typeof query == 'object') {				// the query has key-value pairs provided
				var data = validFields(table_name, query);
				return select( table_name, queryByValues(table_name, data, limit) );
			} else if(typeof query == 'function') {		// the query has a conditional map function provided
				return select( table_name, queryByFunction(table_name, query, limit) );
			}
			return [];
		},

		// delete rows
		delete: function(table_name, query) {
			if(typeof query == 'object') {
				var data = validFields(table_name, query);
				deleteRows( table_name, queryByValues(table_name, data) );
			} else if(typeof query == 'function') {
				deleteRows( table_name, queryByFunction(table_name, query) );
			}
		}
	}
}