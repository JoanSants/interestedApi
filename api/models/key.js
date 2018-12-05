var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var keySchema = new Schema({
	name:{
		type:String,
		required:true
	},
	price:{
		type:Number,
		required:true
	},
	quantity:{
		type:Number,
		required:true
	},
	_creator:{
		type: mongoose.Schema.Types.ObjectId,
		required:true
	}
});

module.exports = mongoose.model('Key', keySchema);