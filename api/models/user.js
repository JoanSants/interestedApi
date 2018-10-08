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
	addresses:[{
		type:mongoose.Schema.Types.ObjectId,
		ref:'Address'
	}],
	interests:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Interest'
    }],items:[{
		type:mongoose.Schema.Types.ObjectId,
        ref:'Items'
	}],
    proposalsDone:[{
        type:mongoose.Schema.Types.ObjectId,
	  	ref:'Proposal'
	}],
	proposalsReceived:[{
        type:mongoose.Schema.Types.ObjectId,
	  	ref:'Proposal'
    }]
});

userSchema.methods.toJSON = function () {
	var user = this;
	var userObject = user.toObject();

	return _.pick(userObject, ['email','wallet','keys','fullName','cpf','telephone','cellphone','useWhatsapp','interests']);
};

module.exports = mongoose.model('User', userSchema);