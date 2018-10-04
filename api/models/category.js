const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash');

const categorySchema = new Schema({
    name:{
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
    _creator:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});
    
categorySchema.methods.toJSON = function(){
    category = this;
    categoryObject = category.toObject();
    return _.pick(categoryObject,['name','description','_id']);
}

module.exports = mongoose.model('Category', categorySchema);