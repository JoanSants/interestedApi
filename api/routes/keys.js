const express = require('express');
const router = express.Router();
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const Key = require('./../models/key');
const checkAuth = require('./../middleware/checkAuth');
const User = require('../models/user');

router.post('/', checkAuth, (req, res) => {
	var body = _.pick(req.body, ['name', 'description', 'price', 'quantity']);
	body._creator = req.userData._id;
	var key = new Key(body);

	key.save(body).then((key) => {
		return res.status(201).json({ key: key });
	}).catch(err => {
		res.status(500).json({
			error: err
		});
	});
});

router.post('/buy', checkAuth, (req, res) => {
	const key = req.body.key;

	Key.findById(key).then(key => {
		if (!key) {
			return res.status(404).json({
				message: 'Key not found'
			})
		}

		User.findById(req.userData._id).then(user => {
			User.findByIdAndUpdate(req.userData._id, { $set: {keys: user.keys + key.quantity } }, { new: true }).then(updatedUser => {
				return res.status(200).json({
					user: updatedUser
				})
			})
		}).catch(error => {
			return res.status(500).json({
				error: error
			})
		})

	}).catch(err => {
		return res.status.json({
			error: err
		});
	})
});

router.get('/', (req, res) => {
	Key.find().then((keys) => {
		res.status(200).json({
			count: keys.length,
			keys: keys
		});
	}).catch(err => {
		res.status(500).json({
			error: err
		})
	});
});

router.patch('/:id', checkAuth, (req, res) => {
	var id = req.params.id;
	if (!ObjectID.isValid(id)) {
		return res.status.send(404);
	}
	var body = _.pick(req.body, ['name', 'description', 'price', 'quantity']);

	Key.findOneAndUpdate({ _id: id, _creator: req.userData._id }, { $set: body }, { new: true })
		.then((key) => {
			res.json({ key: key });
		}).catch((err) => {
			res.status(500).json({
				error: err
			});
		});
});

module.exports = router;