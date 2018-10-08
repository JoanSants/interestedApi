const express = require('express');
const router = express.Router();
const {ObjectID} = require('mongodb');
const checkAuth = require('./../middleware/checkAuth');
const _ = require('lodash');

const Item = require('./../models/item');
const User = require('./../models/user');
const Interest = require('./../models/interest');
const Proposal = require('./../models/proposal');

router.post('/', checkAuth, (req, res) => {
	var body = _.pick(req.body,['_interest','_item','title','description','price']);
	body._creator = req.userData._id;
    body.createdAt = new Date();
    
    if(!ObjectID.isValid(body._interest)){
        return res.status(404).json({
            message:'Interest not found'
        });
    }
	
	Interest.findOne({_id:body._interest}).then((interest) => {
        
        if(!interest){
			return res.status(404).json({
                message:'Interest not found'
            });
        }

        if(interest._creator.equals(req.userData._id)){
            return res.status(400).json({
                message:"This interest is yours"
            });
        }

        Item.findById(body._item).then((item) => {
            if(!item){
                return res.status(404).json({
                    message:'Item not found'
                });
            }

            if(item._creator != req.userData._id){
                return res.status(400).json({
                    message:'The item must be yours.'
                })
            }
        });

        body._interested = interest._creator;
        var proposal = new Proposal(body);
        proposal.save().then((proposal)=>{

            User.findByIdAndUpdate({_id:proposal._creator},{$addToSet:{proposalsDone:proposal._id}})
            .then(user =>{
                    if(!user){
                        return res.status(400).json({
                            message:'Failed to insert the proposal into creator'
                        });
                    }        
            }).catch((err) => {
                return res.status(500).json({error:err});
            });

            console.log('1' );

            User.findByIdAndUpdate({_id:proposal._interested},{$addToSet:{proposalsReceived:proposal._id}})
            .then(user => {
                if(!user){
                    console.log('err2');
                    return res.status(400).json({
                        message:'Failed to insert the proposal into interested'
                    });
                }    
            }).catch((err) => {
                return res.status(500).json({error:err});
            })

            Item.findOneAndUpdate({_creator:req.userData._id},{$addToSet:{proposals:proposal._id}})
            .then(item =>{
                if(!item){
                    console.log('err3');
                    return res.status(500).json({
                        message:'Failed to insert the proposal into item'
                    })
                }
            }).catch((err) => {
                return res.status(500).json({error:err});
            })

            Interest.findByIdAndUpdate(body._interest,{$addToSet:{proposals:proposal._id}})
            .then(interest =>{
                if(!interest){
                    console.log('err4');
                    return res.status(500).json({
                        message:'Failed to insert the proposal into interest'
                    })
                }
                }).catch((err) => {
                return res.status(500).json({error:err});
            })

            res.status(201).json({
                proposalCreated:proposal
            });
        }).catch((err) => {
            res.status(500).josn({
                error:err
            });
        });
	});
});

//Get proposals by Id

router.get('/proposals/:id', checkAuth, (req, res) => {
	var id = req.params.id;
	Proposal.findOne({
        _id:id,
        _creator:req.userData._id
    }).then((proposal)=>{
		res.json({
            count:proposal.length,
            proposal:proposal
        });
	}).catch((err) => {
		res.status(500).json({
            error:err
        });
	})
})

router.get('/received', checkAuth, (req, res) => {
	Proposal.find({_interested: req.userData._id}).then((proposals) => {
		res.status(200).json({
			count:proposals.length,
			proposals:proposals
		});
	}).catch((err) => {
		res.status(500).json({
			error:err
		});
	});
});

router.get('/sent', checkAuth, (req, res) => {
	Proposal.find({_creator: req.userData._id}).then((proposals) => {
		res.status(200).json({
			count:proposals.length,
			proposals:proposals
		});
	}).catch((err) => {
		res.status(500).json({
			error:err
		});
	});
});

//Patch by id
router.patch('/proposals/:id', checkAuth, (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body,['title','description','price','active']);

	Proposal.findOneAndUpdate({'_id':id,'_creator': req.userData._id},{$set: body}, {new: true})
	.then((proposal) => {
		if(!proposal){
			res.status(404).json({
                message:'Proposal not found'
            });
		}
		res.status(200).json({
            proposalUpdated:proposal
        });
	}).catch((err) => {
		res.status(500).json({
            error:err
        });
	});
});

module.exports = router;