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
const Item = require('./../models/item');
const User = require('./../models/user');

router.post('/', checkAuth , upload.single('itemImage'), (req,res) => {
	var body = _.pick(req.body,['title','description','originCep','sendable','active']);
	
		body.createdAt = new Date();		
		body._creator = req.userData._id;			
		if(req.file){
			body.imageName = req.file.filename;
			body.image = url + '/images/'+ req.file.filename;
		}
		
		var item = new Item(body);
		item.save().then((item) => {

			User.findOneAndUpdate({_id:item._creator}, {$addToSet:{items:item._id}}).then()
			.catch(err => {
				return res.status(500).json({
					error:err
				})
			})

			res.status(201).json({
				item:item
			});
		}).catch(err => {
			fs.unlinkSync(`./api/images/${req.file.filename}`);
			res.status(500).json({
				error:err
			})
		});
});

router.get('/', checkAuth, (req, res) => {
	Item.find({
        active:true,
        _creator:req.userData._id
    }).then((items) => {
		res.status(200).json({
			count:items.length,
			items:items
		});
	}).catch(err => {
		res.status(500).json({
			error:err
		})
	})
});

router.get('/:id', checkAuth, (req,res)=>{
	var _id = req.params.id;
	if(!ObjectID.isValid(_id)){
		return res.status(404).json({
			message:'Item not found'
		});
	}
	Item.find({
        _id:_id,
        _creator:req.userData._id
    }).then((item)=>{
		if(!item){
			return res.status(404).json({
				message:'item not found'
			});
		}
		res.status(200).json({
			item:item
		});
	}).catch((err) => {
		res.status(500).json({
			error:err
		});
	});
});

router.patch('/:id', checkAuth, upload.single('itemImage'), (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body,['title','description','originCep','sendable','active']);

	if(req.file){
		body.imageName = req.file.filename;
		body.image = url + '/images/'+ req.file.filename;
	}

	if(!ObjectID.isValid(id)){
		return res.status(404).json({
			message:'Item not found'
		});
	}

	Item.findOneAndUpdate({_id:id,_creator:req.userData._id}, {$set:body}, {new:false}).then((itemOld) => {
		if(!itemOld){
			return res.status(404).json({
				message:'item not found'
			});
		}

		Item.findById({_id:id}).then((item) => {
			if(item.imageName !== itemOld.imageName){
				fs.unlinkSync(`./api/images/${itemOld.imageName}`);
			}

			return res.json({
				itemUpdated:item
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
		return res.status(404).json({
			message:'Item not found'
		});
	}

	Item.findOneAndRemove({
		_id:id,
		_creator:req.userData._id
	}).then((item) => {
		if(!item){
			try{
			fs.unlinkSync(`./api/images/${item.imageName}`);
			}catch(e){

			}
			return res.status(404).json({
				message:'Item not found'
			});
		}
		fs.unlinkSync(`./api/images/${item.imageName}`);

		User.findOneAndUpdate({_id:item._creator}, {$pull:{items:item._id}}).then()
		.catch(err => {
			return res.status(500).json({
				error:err
			})
		})
		res.status(200).json({
			itemDeleted:item
		});
	}).catch((err) => {
		res.status(500).json({
			error:err
		});
	})
});

module.exports = router;