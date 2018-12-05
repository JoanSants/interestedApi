const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('./../models/user');
const Interest = require('../models/interest');
const checkAuth = require('./../middleware/checkAuth');

const transporter = nodemailer.createTransport(sendgridTransport({
	auth: {
		api_key: process.env.EMAIL_KEY
	}
}));


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
	User.findOne({ email: req.body.email }).populate('interests').populate('contacts').then((user) => {
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

				transporter.sendMail({
					to: user.email,
					from: 'interested@marketplace.com',
					subject: 'Login Realizado',
					html: '<h1>Novo login realizado</h1>'
				})

				return res.status(200).json({
					user: user,
					token: token,
					expiresIn: 3600
				})
			}

			res.status(401).json({
				message: 'Auth failed'
			})
		});
	})
})

router.patch('/', checkAuth, (req, res) => {
	var body = _.pick(req.body, ['fullName', 'cpf', 'telephone', 'cellphone', 'useWhatsapp']);

	User.findByIdAndUpdate({ _id: req.userData._id }, { $set: body }, { new: true }).then((user) => {
		transporter.sendMail({
			to: user.email,
			from: 'interested@marketplace.com',
			subject: 'Alteração de cadatro',
			html: '<h1>Seus dados de cadastro foram alterados</h1>'
		})
		return res.status(200).json({
			user: user
		});
	}).catch((err) => {
		res.status(500).send(err);
	});
});

router.post('/contact', checkAuth, (req, res) => {

	Interest.findById(req.body._interest).then((interest) => {
		if (_.isEmpty(interest)) {
			return res.status(404).send('Interest not found');
		}

		if (interest._creator.equals(req.userData._id)) {
			return res.status(400).json({
				message: 'You can\'t obtain your own contact'
			});
		} else {
			User.findByIdAndUpdate(req.userData._id, { $addToSet: { contacts: interest._id } }, { new: true }).then((user) => {
				return res.status(200).json({
					user: user
				})
			}).catch((err) => {
				return res.status(500).json({
					error: err
				})
			});
		}
	}).catch((err) => {
		res.send(err);
	});
});

router.get('/contact/:id', checkAuth, (req, res) => {
	const interestId = req.params.id;

	User.findById(req.userData._id).then(user => {
		const interest = user.contacts.find(interest => {
			return interest.equals(interestId);
		});

		if (!interest) {
			return res.status(404).json({
				message: 'You don\'t have access to this contact'
			})
		}

		Interest.findById(interest).then(interest => {
			User.findById(interest._creator).then(user => {
				const userContact = _.pick(user, ['telephone', 'cellphone', 'useWhatsapp', 'fullName']);
				return res.status(200).json({
					userContact: userContact
				})
			})
		})
	}).catch((err) => {
		return res.status(500).json({
			error: err
		});
	});
});

module.exports = router;