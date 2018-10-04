const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash');

const interestSchema = new Schema({
	_category:{
		type: mongoose.Schema.Types.ObjectId,
		required:true
	},
	_creator:{
		type: mongoose.Schema.Types.ObjectId,
		required:true
	},
	createdAt:{
		type: Date
	},
	name:{
		type: String,
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	description:{
		type: String,
		required: true,
		minlength: 1,
		maxlength: 200,
		trim:true
	},	
	price:{
		type: Number,
		required:true,
	},
	image:{
		type: String,
		required:true,
	},
	imageName:{
		type: String,
		required:true,
	},
	active:{
		type:Boolean,
		default:true
	},
	finished:{
		type:Boolean,
		default:false
	},
	_order:{
		type: mongoose.Schema.Types.ObjectId,
		default:null
	}
});

interestSchema.methods.toJSON = function(){
	var interest = this;
	var interestObject = interest.toObject();

	return _.pick(interestObject,['active','_id','_category','name','description','price','_creator','image','imageName']);
}

module.exports = mongoose.model('Interest', interestSchema);