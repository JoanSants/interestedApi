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

router.get('/', checkAuth, (req, res) => {
	User.findById(req.userData._id).populate('interests').populate('contacts').then(user => {
		if (!user) {
			return res.status(404).json({
				error: {
					code: '404',
					message: 'USER_NOT_FOUND',
					errors: {
						message: 'USER_NOT_FOUND',
					}
				}
			})
		}
		return res.status(200).json({
			user: user
		});
	}).catch(err => {
		return res.status(500).json({
			error: {
				code: '500',
				message: 'INTERNAL_SERVER_ERROR',
				errors: {
					message: 'INTERNAL_SERVER_ERROR',
				}
			}
		})
	})
})

router.post('/signup', (req, res) => {
	bcrypt.hash(req.body.password, 10, (err, hash) => {
		if (err) {
			return res.status(500).json({
				error: {
					code: '500',
					message: 'INTERNAL_SERVER_ERROR',
					errors: {
						message: 'INTERNAL_SERVER_ERROR',
					}
				}
			});
		} else {
			var body = _.pick(req.body, ['email', 'fullName', 'telephone', 'cellphone', 'useWhatsapp']);
			body.password = hash;
			var user = new User(body);

			User.find({
				email: body.email
			}).then(user => {
				if (user.length > 0) {
					return res.status(409).json({
						error: {
							code: '409',
							message: 'EMAIL_ALREADY_EXISTS',
							errors: {
								message: 'EMAIL_ALREADY_EXISTS',
							}
						}
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
				res.status(500).json({
					error: {
						code: '500',
						message: 'INTERNAL_SERVER_ERROR',
						errors: {
							message: 'INTERNAL_SERVER_ERROR',
						}
					}
				});
			});
		}
	})
});

router.post('/signin', (req, res, next) => {
	User.findOne({ email: req.body.email }).populate('interests').populate('contacts').then((user) => {
		if (!user) {
			return res.status(401).json({
				error: {
					code: '401',
					message: 'AUTHENTICATION_FAILED',
					errors: {
						message: 'AUTHENTICATION_FAILED',
						reason: 'invalid'
					}
				}
			});
		}
		bcrypt.compare(req.body.password, user.password, (err, result) => {
			if (err) {
				return res.status(401).json({
					error: {
						code: '401',
						message: 'AUTHENTICATION_FAILED',
						errors: {
							message: 'AUTHENTICATION_FAILED',
							reason: 'invalid'
						}
					}
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

			return res.status(401).json({
				error: {
					code: '401',
					message: 'AUTHENTICATION_FAILED',
					errors: {
						message: 'AUTHENTICATION_FAILED',
						reason: 'invalid'
					}
				}
			});
		});
	})
});

router.patch('/', checkAuth, (req, res) => {
	var body = _.pick(req.body, ['fullName', 'telephone', 'cellphone', 'useWhatsapp']);

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
		res.status(500).json({
			error: {
				code: '500',
				message: 'INTERNAL_SERVER_ERROR',
				errors: {
					message: 'INTERNAL_SERVER_ERROR',
				}
			}
		});
	});
});

router.post('/contact', checkAuth, (req, res) => {
	Interest.findById(req.body._interest).then((interest) => {

		if (_.isEmpty(interest)) {
			return res.status(404).json({
				error: {
					code: '404',
					message: 'INTEREST_NOT_FOUND',
					errors: {
						message: 'INTEREST_NOT_FOUND',
					}
				}
			});
		}

		if (interest._creator.equals(req.userData._id)) {
			return res.status(400).json({
				error: {
					code: '400',
					message: 'YOU_CAN_NOT_OBTAIN_YOUR_OWN_CONTACT',
					errors: {
						message: 'YOU_CAN_NOT_OBTAIN_YOUR_OWN_CONTACT',
					}
				}
			});
		}

		User.findById(req.userData._id).then(user => {
			const keys = user.keys - 1;
			if (keys <= 0) {
				return res.status(400).json({
					error: {
						code: '400',
						message: 'YOU_DO_NOT_HAVE_KEYS',
						errors: {
							message: 'YOU_DO_NOT_HAVE_KEYS',
						}
					}
				});
			} else {
				User.findByIdAndUpdate(req.userData._id, { $addToSet: { contacts: interest._id } }, { new: false }).then((user) => {
					const hasContact = user.contacts.find(contact => {
						return contact.equals(interest._id);
					});

					if (hasContact) {
						return res.status(400).json({
							error: {
								code: '400',
								message: 'YOU_CAN_NOT_BUY_A_CONTACT_TWICE',
								errors: {
									message: 'YOU_CAN_NOT_BUY_A_CONTACT_TWICE',
								}
							}
						})
					} else {
						User.findByIdAndUpdate(user._id, { $set: { keys: keys } }, { new: true }).then(user => {
							return res.status(200).json({
								user: user
							})
						})
					}
				})
			}
		}).catch((err) => {
			return res.status(500).json({
				error: {
					code: '500',
					message: 'INTERNAL_SERVER_ERROR',
					errors: {
						message: 'INTERNAL_SERVER_ERROR',
					}
				}
			})
		});
	});
});




router.get('/contact/:id', checkAuth, (req, res) => {
	const interestId = req.params.id;

	User.findById(req.userData._id).then(user => {
		const interest = user.contacts.find(interest => {
			return interest.equals(interestId);
		});

		if (!interest) {
			return res.status(400).json({
				error: {
					code: '400',
					message: 'YOU_DO_NOT_HAVE_ACCESS_TO_THIS_CONTACT',
					errors: {
						message: 'YOU_DO_NOT_HAVE_ACCESS_TO_THIS_CONTACT',
					}
				}
			})
		}

		Interest.findById(interest).then(interest => {
			User.findById(interest._creator).then(user => {
				const userContact = _.pick(user, ['_id', 'telephone', 'cellphone', 'useWhatsapp', 'fullName', 'email']);
				return res.status(200).json({
					userContact: userContact
				})
			})
		})

	}).catch((err) => {
		return res.status(500).json({
			error: {
				code: '500',
				message: 'INTERNAL_SERVER_ERROR',
				errors: {
					message: 'INTERNAL_SERVER_ERROR',
				}
			}
		});
	});
});

module.exports = router;