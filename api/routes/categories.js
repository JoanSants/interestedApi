const express = require('express');
const router = express.Router();
const {ObjectID} = require('mongodb');
const _ = require('lodash');

const checkAuth = require('./../middleware/checkAuth');
const Category = require('./../models/category');


router.post('/', checkAuth, (req, res) => {
	var body = _.pick(req.body,['name', 'description']);
	body._creator = req.userData._id;

	var category = new Category(body);

	category.save().then((category)=>{
		res.status(201).json({category:category});
	}, (err) => {
		res.status(500).send(err.message);
	})
})

router.get('/', (req, res) => {
	Category.find().then((category) => {
		res.json({
            count: category.length,
            categories:category
        });
	}, (err) => {
		res.status(400).send();
	});
})

router.patch('/:id', checkAuth, (req, res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		res.status(404).send();
	}

	var body = _.pick(req.body,['name', 'description']);

	Category.findOneAndUpdate({_id:id,_creator:req.userData._id}, {$set:body}, {new:true})
	.then((category) =>{
		if(!category){
			return res.status(404).json({message:'Category not found'});
		}
		res.json({
            categoryUpdate:true,
            category:category
        });
	}).catch((err) => {
        res.status(500).json({
            error:err
        });
    })
});

router.delete('/:id', checkAuth, (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		res.status(404).json({
            message:'Category not found'
        });
	}

	Category.findOneAndRemove({
		_id:id,
		_creator: req.userData._id
	}).then((category) => {
		if(!category){
			res.status(404).json({
                message:'Category not found'
            });
		}
		res.status(200).json({
            categoryDeleted:true,
            category:category
        });	
	}).catch((err) => {
		res.status(500).send(err);
	});
});

module.exports = router;