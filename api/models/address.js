const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cep = require('cep-promise');

const addressSchema = new Schema({
	_creator:{
		type:mongoose.Schema.Types.ObjectId,
		required:true
	},
	name:{
		type:String,
		minlength:1,
		maxlength:50,
		trim:true,
		required:true
	},
	reference:{
		type:String,
		maxlength:100,
		trim:true
	},
	streetAddress:{
		type:String,
		minlength:1,
		maxlength:50,
		trim:true,
		required:true
	},
	postalCode:{
		type:String,
		trim:true,
		required:true,
		validate:{
			validator: function(value){
				return cep(value).catch()
			}
		}
	},
	number:{
		type:Number,
		minlength:1,
		maxlength:10,
		trim:true,
		required:true
	},
	complement:{
		type:String,
		maxlength:100,
		trim:true	
	},
	neighborhood:{
		type:String,
		minlength:1,
		maxlength:100,
		trim:true,
		required:true	
	},
	city:{
		type:String,
		minlength:1,
		maxlength:100,
		trim:true,
		required:true
	},
	uf:{
		type:String,
		minlength:2,
		maxlength:2,
		trim:true,
		required:true
	}
});

module.exports = mongoose.model('Address', addressSchema);