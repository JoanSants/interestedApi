const express = require('express');
const router = express.Router();
const {ObjectID} = require('mongodb');
const url = process.env.APP_URL;
const fs = require('fs');
const _ = require('lodash');
const multer = require('multer');
const storage = multer.diskStorage({
	destination: function(req, file, cb){
		cb(null, './api/images/');
	},
	filename: function(req, file, cb){
		cb(null, Date.now() + file.originalname);
	}
});
const fileFilter = (req, file, cb) => {
	if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/svg' || file.mimetype === 'image/jpg'){
		cb(null, true);
	}else{
		cb(new Error('Invalid file!'), false);
	}
};
const upload = multer({
	storage:storage, 
	limits:{
	fileSize: 1024 * 1024 * 1
	},
	fileFilter:fileFilter
});

const checkAuth = require('./../middleware/checkAuth');
const Interest = require('./../models/interest');
const Category = require('./../models/category');
const User = require('./../models/user');

router.post('/', checkAuth , upload.single('interestImage'), (req,res) => {
	var body = _.pick(req.body,['_category','name','description','price']);

	Category.findById(body._category).then((category) => {
		if(!category){
			fs.unlinkSync(`./api/images/${req.file.filename}`);
			return res.status(404).json({
				message:'Category not found'
			});
		}
	
		body.createdAt = new Date();		
		body._creator = req.userData._id;			
		body.imageName = req.file.filename;
		body.image = url + '/images/'+ req.file.filename;
		
		var interest = new Interest(body);
		interest.save().then((interest) => {

			User.findOneAndUpdate({_id:interest._creator}, {$addToSet:{interests:interest._id}}).then()
			.catch(err => {
				return res.status(500).json({
					error:err
				})
			})

			res.status(201).json({
				interest:interest
			});
		}).catch(err => {
			fs.unlinkSync(`./api/images/${req.file.filename}`);
			res.status(500).json({
				error:err
			})
		})
	}).catch(err => {
		fs.unlinkSync(`./api/images/${req.file.filename}`);
		res.status(500).json({
			error:err
		});
	});
});

router.get('/', (req, res) => {
	Interest.find({active:true}).then((interests) => {
		res.status(200).json({
			count:interests.length,
			interests:interests
		});
	}).catch(err => {
		res.status(500).json({
			error:err
		})
	})
});

router.get('/:id', (req,res)=>{
	var _id = req.params.id;
	if(!ObjectID.isValid(_id)){
		return res.status(404).json({
			message:'Interest not found'
		});
	}
	Interest.findById({_id}).then((interest)=>{
		if(!interest){
			return res.status(404).json({
				message:'Interest not found'
			});
		}
		res.status(200).json({
			interest:interest
		});
	}).catch((err) => {
		res.status(500).json({
			error:err
		});
	});
});

router.patch('/:id', checkAuth, upload.single('interestImage'), (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body,['_category','name','description','price']);

	if(req.file){
		body.imageName = req.file.filename;
		body.image = url + '/images/'+ req.file.filename;
	}

	if(!ObjectID.isValid(id)){
		return res.status(404).json({
			message:'Interest not found'
		});
	}

	Interest.findOneAndUpdate({_id:id,_creator:req.userData._id}, {$set:body}, {new:false}).then((interestOld) => {
		if(!interestOld){
			return res.status(404).json({
				message:'interest not found'
			});
		}

		Interest.findById({_id:id}).then((interest) => {
			if(interest.imageName !== interestOld.imageName){
				fs.unlinkSync(`./api/images/${interestOld.imageName}`);
			}

			return res.json({
				InteresUpdated:true,
				interest:interest
			});
		});

	}).catch((err) => {
		res.status(500).json({
			error:err
		})
	});
});

router.delete('/:id', checkAuth, (req,res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		fs.unlinkSync(`./api/images/${interest.imageName}`);
		return res.status(404).json({
			message:'Interest not found'
		});
	}

	Interest.findOneAndRemove({
		_id:id,
		_creator:req.userData._id
	}).then((interest) => {
		if(!interest){
			try{
			fs.unlinkSync(`./api/images/${interest.imageName}`);
			}catch(e){

			}
			return res.status(404).json({
				message:'Interest not found'
			});
		}
		fs.unlinkSync(`./api/images/${interest.imageName}`);

		User.findOneAndUpdate({_id:interest._creator}, {$pull:{interests:interest._id}}).then()
		.catch(err => {
			return res.status(500).json({
				error:err
			})
		})
		res.status(200).json({
			interestDeleted:true,
			interest:interest
		});
	}).catch((err) => {
		res.status(500).json({
			error:err
		});
	})
});

module.exports = router;