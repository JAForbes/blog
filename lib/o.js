//Author: James Forbes - 2014 - MIT Licence
function o(hash,changeCallback){

	var rootCallbacks = [];
	var callbacks = {};
	var accessors = {};

	var t =  {
		intro: 'You will not be able to use the automatic function syntax e.g. o.____() to access a record with the key "____".',
		reasons: {
			existingFunction: 'There is already a ____() function, and o wouldn\'t know your intentions.',
			nameReadOnly: 'The accessor is a function and you cannot override function.name in Javascript.',
		},
		disadvantages: {
			nameReadOnly: 'Be aware, you will not be able to use a change listener for this attribute, as '+
			  'the name property is a string, and strings cannot have custom properties in Javascript'
		},
		reassurance: 'Feel free to use the query syntax e.g. o("____") though!',
		pattern: /____/g
	}
	var warnings = {
		name: [t.intro,t.reasons.nameReadOnly,t.reassurance,t.disadvantages.nameReadOnly],
		remove: [t.intro,t.reasons.existingFunction,t.reassurance],
		change: [t.intro,t.reasons.existingFunction,t.reassurance]
	}
	
	//route queries to setters//getters
	var entry = function o(key,value){
		if(arguments.length != 0){
			return hash.apply(null,arguments)
		}
		return hash();
	}

	/*
		close over hash, and replace with hash()
		Only hash() can mutate hash.
		Other functions (internal/external) have to go through hash()
	*/
	hash = (function(original){

		function hash(key,val){
			var response;
			if(arguments.length == 2){
				response = set(key,val)		
			} else if (key) {
				response = getVal(key)
			} else {
				response = getAll()
			}
			return response;
		}

		function getAll(){
			return toJSON(original)
		}

		function getVal(key){
			return original[key]
		}

		function set(key,val){
			var valtype = type(val);
			var hasChanged = val != original[key]

			if(/Undefined|Null/.test(valtype)){
				
				delete original[key]
				delete accessors[key]
				if(entry[key]){ delete entry[key].change }

			} else {
				original[key] = val
				accessors[key] = accessors[key] || createAccessor(key)
			}
			return hasChanged && changed(val,key) || entry;
		}

		return hash;

	})(hash || {})

	entry.remove = function(keys){
		//Handle varargs and array as arguments
		if(arguments.length > 1){
		  keys = ([]).slice.call(arguments);
		}
		if(Array.isArray(keys)){
			each(keys,function(key){
				entry.remove(key)
			})
		} else {

			var key = keys;
			hash(key,null) //delete internal state
			delete entry[key] //delete accessor function
			delete callbacks[key] //delete callbacks
		}
		return entry;
	}

	function changed(val,key){
		var fire = function(callback){
			callback(val,key,hash())
		}
		each(rootCallbacks,fire)
		callbacks[key] && each(callbacks[key],fire)
		return entry;
	}

	//set a val in the hash, trigger change and create a getter/setter
	function set(key,val){
  		//set value
  		hash(key,val)
  		//create setter
  		return entry;
	}

	//Converts nested o's into plain objects.
	//Inspired by Backbone model.toJSON
	function toJSON(original,json){
	  json = json || {}
	  each(original,function(val,key){

	    if(key != 'remove' || key != 'change') {
	    
	    	if(val.name == 'o'){
		      val = toJSON(val())
		    }
		    json[key] = val
	    }
	  })
	  return json
	}

	
	/*
		Accept change handlers on the root object
	*/
	entry.change = function(onchange){
		rootCallbacks.push(onchange)
		return entry;
	}

	//Create function that will accept change callbacks for attributes e.g. o.attribute.change(callback)
	function changeEntry(key){
		return function(callback){
			callbacks[key] = callbacks[key] || [] 
			callbacks[key].push(callback)
			return entry;
		}
	}

	//iterate through an object
	function each(obj,iterator){
	
		if(isArray(obj)){
			for(var i = 0; i< obj.length; i++){
				iterator(obj[i],i)
			}	
		} else {
			for(var k in obj){
				var v = obj[k];
				iterator(v,k)
			}
		}
	}

	function isArray(array){
		return !!array.concat
	}

	//returns "Array", "Number", "Object", "Function", "Null", "Undefined"
	function type(o){
		return ({}).toString.call(o).slice(8,-1)
	}

	//creates an attribute getter/setter
	function createAccessor(key){
		
		var val = hash(key);
		var accessor;
		if(val.name == 'o'){
			accessor = val;
			val.change(function(val,key){
				changed(val,key)
			})
		} else {
		
			accessor = function(newVal){
				
				if(type(newVal) != 'Undefined'){ //setter
					
					return set(key,newVal) 
				}
				return hash(key) //getter
			}
		}
		automaticFunctionGen(key,accessor)
		return accessor;
	}

	/*
		Generates functions with the same name as an attribute.

		Note: won't generate if the key is in the warnings key.
		But you can still access via the query syntax e.g. o('attributeName')
	*/
	function automaticFunctionGen(key,accessor){
	
		entry[key] = accessor
		entry[key].change = entry[key].change || changeEntry(key)

		if(key in warnings){ 
			warn(key)
		}
	}

	/*
		Log a warning based on the warnings template for that key.
	*/
	function warn(key){
		var warning = warnings[key]
			.join('\n\n')
			.replace(t.pattern,key)
		console.warn(warning)
	}
	
	each(hash(),function(val,key){
      set(key,val)
	});

	return entry;
}