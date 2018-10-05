const express = require('express');
const router = express();
const _ = require('lodash');
const {ObjectID} = require('mongodb');

const checkAuth = require('./../middleware/checkAuth');
const Address = require('./../models/address');
const User = require('./../models/user');

router.post('/', checkAuth, (req,res) => {
	var body = _.pick(req.body,['name', 'reference', 'streetAddress', 'postalCode', 'number', 'complement', 'neighborhood', 'city', 'uf']);
	body._creator = req.userData._id;
	var address = new Address(body);

	address.save().then((address)=>{
        User.findByIdAndUpdate({_id:req.userData._id},{$addToSet:{addresses:address._id}}).then().catch((err) => {
            console.log(address)
            return res.status(500).json({error:err});
        })
		res.status(201).json({
            addressCreated:address
        });
	}).catch(err => {
        res.status(500).json({
            error:err,
        })
    })
});

router.get('/', checkAuth, (req,res) => {
	Address.find({'_creator':req.userData._id}).then((addresses)=>{
		return res.json({
            count:addresses.length,
            addresses:addresses
        });
	}).catch(err => {
        res.status(500).json({
            error:err
        });
    });
});

router.delete('/:id', checkAuth, (req,res) =>{
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).json({
            message:'Address not found'
        });
	}

	Address.findOneAndRemove({
		_id:id,
		_creator: req.userData._id
	}).then((address)=>{
        if(!address){
            return res.status(404).json({
                message:'Address not found'
            });
        }
                
        User.findByIdAndUpdate({_id:address._creator},{$pull:{addresses:address._id}}).then(user => {
            console.log(user);
        }).catch(err => {
            res.status(500).json({
                error:err
            });
        });

		res.status(200).json({
            deletedAddress:address
        });
	}).catch(err => {
        res.status(500).json({
            error:err
        })
    });
});

router.patch('/:id', checkAuth, (req,res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		res.status(404).send();
	};

	var body = _.pick(req.body,['name', 'reference', 'streetAddress', 'postalCode', 'number', 'complement', 'neighborhood', 'city', 'uf']);

	Address.findOneAndUpdate({
		_id:id,
		_creator:req.userData._id
	},{$set:body},{new:true}).then((address)=>{
		if(!address){
			return res.status(404).json({
                message:'Address not found'
            })
		}
		res.status(200).json({
            addressUpdated:address
        });
	}).catch(err => {
        res.status(500).json({
            error:err
        })
    });
});

module.exports = router;