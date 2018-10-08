const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cep = require('cep-promise');

const itemSchema = new Schema({
    _creator:{
        required:true,
        type:mongoose.Schema.Types.ObjectId
    },
    createdAt:{
        type:Date,
        required:true
    },
    image:{
        type: String,
        required:true
    },imageName:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true,
        minlength:1,
        maxlength:50,
        trim: true
    },
    description:{
        type:String,
        required:true,
        minlength:1,
        maxlength:200,
        trim: true
    },
    originCep:{
        type:Number,
        validate:{
            validator: function(value){
                return cep(value).catch()
            }
        }
    },sendable:{
        type:Boolean,
        required:true,
    },
    active:{
        type:Boolean,
        default:true
    },
    finished:{
        type:Boolean,
        default:false
    },proposals:[{
        type:mongoose.Schema.Types.ObjectId
    }]
});

module.exports = mongoose.model('Item', itemSchema);