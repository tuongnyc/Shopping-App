const path = require('path');
const auth = require('../controllers/auth')

const express = require('express');

const rootDir = require('../util/path');
const User = require('../models/user');

const { check, body } = require('express-validator');   // use the subpackage!.
// just need a check function.


const router = express.Router();

router.get('/login', auth.getLogin);

router.post('/login', 
[
    body('email','Please enter a valid e-mail.').isEmail().custom((value, {req}) => {
        if(value === 'test@test.com') {
            throw new Error('This email address is forbidden');
        }
        return User.findOne({email: value}).then(userDoc => {
            if(!userDoc)   // if user exists
                return Promise.reject('E-mail does not exist!');
            } ); 
    }).normalizeEmail(),
    body('password','Please enter password with length of 5 alphanumeric characters.').
    isLength({min: 5}).isAlphanumeric().trim()
], 
auth.postLogin);


router.post('/logout', auth.postLogout); 
// the check name must match with the field name! i.e: name="email" in the form.
// go through the body, header, etc to look for field name.
// custom function is for developer to develope their own validator!
// note putting the check functions into an array is optional!.  
// this is to check for password field.
router.post('/signup',
[ check('email').isEmail().withMessage('Please enter valid email.').custom((value, {req}) => {
    if(value === 'test@test.com') {
        throw new Error('This email address is forbidden');
    }
    // we can remove the findOne in the controller.postSignup function!
    return User.findOne({email: value}).then(userDoc => {
        if(userDoc)   // if user exists
            return Promise.reject('Email is taken!');
        } ); 
    // asynchrounous.
}).normalizeEmail(), 
// second parameter in body or check function is the error message that will be used in all
// chaining function.
body('password', 'Please enter a password with only numbers and text and at least 5 characters').isLength({min: 5}).isAlphanumeric().trim(),
// no need to check length since it is already done with the password check.
body('confirmPassword', 'Passwords must match!').trim().custom((value, { req }) => {
    if(value !== req.body.password) {
        throw new Error('Passwords have to match!');
    }
    return true;
})
]
, auth.postSignup);
router.get('/signup', auth.getSignup);
router.get('/reset', auth.getResetPassword);
router.post('/reset', auth.postResetPassword);
router.get('/new-password/:token',auth.getNewPasswordReset);
router.post('/new-password',auth.postNewPassword);

module.exports = router;