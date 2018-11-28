const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');

const User = require('./../models/user');
const Interest = require('./../models/interest');
const checkAuth = require('./../middleware/checkAuth');


router.post('/signup', (req, res) => {
	bcrypt.hash(req.body.password, 10, (err, hash) => {
		if (err) {
			return res.status(500).json({
				error: err
			});
		} else {
			var body = _.pick(req.body, ['email', 'fullName', 'cpf', 'telephone', 'cellphone', 'useWhatsapp']);
			body.password = hash;
			var user = new User(body);

			User.find({
				email: body.email
			}).then(user => {
				if (user.length > 0) {
					return res.status(409).json({
						message: 'This email already exists'
					})
				}
			})

			user.save().then((user) => {
				const token = jwt.sign({
					_id: user._id,
					email: user.email
				}, process.env.JWT_KEY, {
						expiresIn: "1h"
					});
				res.status(201).json({ 
					user: user,
					token: token,
					expiresIn: 3600
				 });
			}).catch((err) => {
				res.status(500).json({ error: err });
			});
		}
	})
});

router.post('/signin', (req, res, next) => {
	User.findOne({ email: req.body.email }).populate('interests').then((user) => {
		if (!user) {
			return res.status(401).json({
				message: 'Auth failed'
			})
		}
		bcrypt.compare(req.body.password, user.password, (err, result) => {
			if (err) {
				return res.status(401).json({
					message: 'Auth failed'
				});
			}

			if (result) {
				const token = jwt.sign({
					_id: user._id,
					email: user.email
				}, process.env.JWT_KEY, {
						expiresIn: "1h"
				});

				return res.status(200).json({
					user: user,
					token: token,
					expiresIn: 3600
				})
			}

			/*Password errors there
			if (user.AccessTries.time + 180000 < new Date()) {
				User.findOneAndUpdate({ _id: user._id }, {
					$set: {
						AccessTries: {
							time: user.AccessTries.time,
							tries: user.AccessTries.tries + 1
						}
					}
				}).then(updatedUser => {
					if (updatedUser.AccessTries.tries >= 3) {
						console.log('|Send Email');
					}
				})
			} else {
				User.findOneAndUpdate({ _id: user._id }, {
					$set: {
						AccessTries: {
							time: new Date(),
							tries: 1
						}
					}},{$new:true}).then().catch(err => {
						return res.status(500).json({
							message: error
						})
					})
			}
			*/
			res.status(401).json({
				message: 'Auth failed'
			})
		});
	})
})

router.patch('/', checkAuth, (req, res) => {
	var body = _.pick(req.body, ['fullName', 'cpf', 'telephone', 'cellphone', 'useWhatsapp']);

	User.findByIdAndUpdate({ _id: req.userData._id }, { $set: body }, { new: true }).then((user) => {
		res.status(200).json({
			user: user
		});
	}).catch((err) => {
		res.status(500).send(err);
	});
});

/*
router.post('/users/contact', authenticate, (req, res) => {
	var body = _.pick(req.body,['_creator','_interest']);

	Interest.findById({_id:body._interest}).then((interest) => {
		if(_.isEmpty(interest)){
			return res.status(404).send('Interest not found');
		}

		if(!interest._creator.equals(body._creator)){
			return res.status(400).send('The request creator and the interest creator don\'t match');	
		}

		User.findById(body._creator).then((user) =>{
		if(_.isEmpty(user)){
			return res.status(404).send();
		}
		return user;
		}).then((user) => {
			
			if(body._creator === req.user.id){
				res.status(400).send('You can\'t obtain your own contact');
			}else{
				User.findByIdAndUpdate({_id:req.user._id}, {$addToSet:{_contact:body._interest}},{new:true}).then((userMe) => {
				console.log(userMe);
				}).catch((err) => {
					console.log(err);
				});

				var contactInfo = _.pick(user,['email','fullName','telephone','cellphone','useWhatsapp']);
					res.send(contactInfo);
				}
		}).catch((err) => {
				res.send(err);
			});
		});

    });
    */

module.exports = router;