const mongoose = require ('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash');

const userSchema = new Schema({
	email:{
		type:String,
		required:true,
		trim:true,
		unique:true,
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	},
	password:{
		type:String,
		required:true,
		minlength:6,
		trim:true
	},
	fullName:{
		type:String,
		required:true,
		minlength:5,
		maxlength:50,
		trim:true
	},
	cpf:{
		type:String,
		required:true,
		trim:true,
		match:/([0-9]{2}[\.]?[0-9]{3}[\.]?[0-9]{3}[\/]?[0-9]{4}[-]?[0-9]{2})|([0-9]{3}[\.]?[0-9]{3}[\.]?[0-9]{3}[-]?[0-9]{2})/
	},
	telephone:{
		type:String,
		minlength:10,
		maxlength:10,
		trim:true
	},
	cellphone:{
		type:String,
		minlength:11,
		maxlength:11,
		required:true,
		trim:true
	},
	useWhatsapp:{
		type:Boolean,
		default:false
	},
	wallet:{
		type:Number,
		default:0
	},
	keys:{
		type:Number,
		default:0
	},
	interests:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Interest'
	}],
	contacts:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Interest'
	}]
});

userSchema.methods.toJSON = function () {
	var user = this;
	var userObject = user.toObject();

	return _.pick(userObject, ['_id','email','wallet','keys','fullName','cpf','telephone','cellphone','useWhatsapp','interests','contacts']);
};

module.exports = mongoose.model('User', userSchema);