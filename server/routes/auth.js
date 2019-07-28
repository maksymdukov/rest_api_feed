const express = require('express');
const {body} = require('express-validator/check');
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please, enter a valid email')
        .custom(async (value, {req}) => {
            const userDoc = await User.findOne({email: value});
            if (userDoc) {
                return Promise.reject('Email is taken');
            }
            return Promise.resolve();
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({min: 5}),
    body('name')
        .trim()
        .not().isEmpty()
], authController.signup);

router.post('/login', authController.login);

module.exports = router;

