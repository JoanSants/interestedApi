const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const proposalSchema = new Schema({
	_creator:{
		required:true,
		type:mongoose.Schema.Types.ObjectId
	},
	createdAt:{
		type:Date,
		required:true
	},
	_interest:{
		required:true,
		type:mongoose.Schema.Types.ObjectId
	},
	_interested:{
		required:true,
		type:mongoose.Schema.Types.ObjectId
	},_item:{
		type:mongoose.Schema.Types.ObjectId,
		required:true
	},
	price:{
		type:Number,
		required:true
	},
	title:{
		type:String,
		required:true
	},
	description:{
		type:String,
		required:true
	},
	accepted:{
		type:Boolean,
		default:false
	},
	active:{
		type:Boolean,
		default:true
	},
	finished:{
		type:Boolean,
		default:false
	}
});

module.exports = mongoose.model('Proposal', proposalSchema); 