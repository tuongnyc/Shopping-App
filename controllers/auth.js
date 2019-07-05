/*exports.getLogin = (req, res, next) => {
    //const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';
    console.log(req.session.isLoggedIn);
    res.render('auth/login', {
        path: '/login',
        isAuthenticated: isLoggedIn,
        pageTitle: 'Login'
    } );
};

exports.postLogin = (req, res, next) => {
    req.isAuthenticated = true;  // this does not work, since the request will be killed off before 
    // it is being redirected.  So, we need to use cookies.
    //res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age=10')  // key-value pair. Domain - sent to another page.
        // Expires - set the expire date, Max-Age=set the maximum
        // Secure - will only be set for https
        // httpOnly - will using the http and javascript.  Extra security setting.  Cannot
        // be used to read by javascript!!
    req.session.isLoggedIn = true;  // store the isLoggedIn in the session on the server!
    // awsome way to store data that persists across the request by using session!.
    // it still uses the cookie to identify the user!.
    // will be stored on the server, so user can not modify like cookies!
    res.redirect('/');
}
*/

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');  // core module of Node.js.  No need to install!
const { validationResult } = require('express-validator');   // use the subpackage!.
// just need a check function.

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    //   const isLoggedIn = req
    //     .get('Cookie')
    //     .split(';')[1]
    //     .trim()
    //     .split('=')[1] === 'true';
    let message = req.flash('error');  // the messages came in as an array
    if(message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: message, //pull the message error key!
      oldInput: {email: '', password: ''},
      validationErrors: []
    });
  };
  
  exports.postLogin = (req, res, next) => {
    const errors = validationResult(req);
    const email = req.body.email;
    const password = req.body.password;

    console.log('email: ', email);
    console.log('password: ', password);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/login', { // render the same page again!
            path: '/login',
            pageTitle: 'login',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password},
            validationErrors: errors.array()
        } );
    }
    User.findOne({
        email: email
    }).then(user => {
        if(!user) {  
            req.flash('error','Invalid e-mail!');
            // no user
            res.redirect('/login');
        } 
        // validate the password!
        // let bcrypt compare the password with the 
        // hashed password.
        // also return a promise.
        bcrypt.compare(password, user.password).
        then(doMatch => {
            // result will be boolen
            if(doMatch){
                req.session.isLoggedIn = true;
                req.session.user = user;
                // normally you don't need to save, but sometimes, the redirect occur before the save,
                // so when we redirect, we need to save first!
                return req.session.save((error) => {  // save the session now!
                    res.redirect('/');
                })
            }
            else {
               /* req.flash('error','e-mail and password do not match!')
                return res.redirect('/login'); */
                return res.status(422).render('auth/login', { // render the same page again!
                    path: '/login',
                    pageTitle: 'login',
                    errorMessage: 'e-mail and password do not match.',
                    oldInput: { email: email, password: password},
                    validationErrors: [{param: 'email', param: 'password'}] })
            }
        })
        .catch(error => {
            req.flash('error', 'unable to login!')
            res.redirect('/login');
            console.log('Error in bcrypt compare: ', error)
        })
    }).catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    }) 
  };

  exports.postLogout = (req, res, next) => {
    req.session.destroy((error) => {
        console.log(error);
        res.redirect('/');
    });
  }

  exports.postSignup = (req, res, next) => {
    // store the new user in the database!.
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const name = req.body.name;

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/signup', { // render the same page again!
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {name: name, password: password, confirmPassword: confirmPassword, email: email},
            validationErrors: errors.array()
        } );
    }
    // Check that user exist in the mongodb!
    // filter with email!
    User.findOne({email: email}).then(userDoc => {
        if(userDoc) {  // if user exists
            req.flash('error','Email is taken!.');  // send the message to the 
            // redirect..
            // redirect will start a new request!
            return res.redirect('/signup');  
        } 
        // second parameter is the salt value.  Currently is 12 is consider a secure.
        // it return a promise, which can be chain with a then clause.
        // can't decrypt this password!! Not readable.
        return bcrypt.hash(password, 12).then(hashedPassword => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword, 
                cart: { items: [] }
            });
            return user.save();  // save the user in mongodb
        }).then(result => {
            console.log('REsulte: ', result);
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'shop@node-complete.com',
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up!</h1>'
            }).catch(error => {
                console.log('Erro in seding e-mail: ', error);
            })
            
        }).
        catch(error => {
            const err = new Error(error);
            err.httpStatusCode = 500;
            return next(err); 
        })
    }).catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
  }

  exports.getSignup = (req, res, next) => {
    let message = req.flash('error');  // the messages came in as an array
    if(message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
      res.render('auth/signup', {
          path: '/signup',
          pageTitle: 'Signup',
          isAuthenticated: false,
          errorMessage: null,
          oldInput: {name: '', password: '', confirmPassword: ''},
          validationErrors: []
      })
  }

  // just render the resetpassword page!
  exports.getResetPassword = (req, res, next) => {
        let message = req.flash('error');  // the messages came in as an array
        if(message.length > 0) {
            message = message[0];
        }
        else {
            message = null;
        }
        res.render('auth/resetpassword', {
          path: '/reset',
          pageTitle: 'Reset Passwrod',
          isAuthenticated: false,
          errorMessage: message
        })

  }

  exports.postResetPassword = (req, res, next) => {
    const email = req.body.email;
    crypto.randomBytes(32, (error, buffer) => {
        if(error) {
            console.log(error);
            return res.redirect('/reset');
        }
        // now we have valid buffer
        const token = buffer.toString('hex');  // convert hex back to ascii character!
        // now get the token!
        User.findOne({email: email})
        .then(user => {
            if(!user) { // couldn't find the user!
                req.flash('error',`No account with that email ${email} found`);
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000; // expire in one hour.  
            // express in millisecond.  So, need to add 3600000
            return user.save();
        })
        .then(result => {
            res.redirect('/');
            // send the user the e-mail, notifiying the password changes
            transporter.sendMail({
                to: email,
                from: 'tuongnyc@outlook.com',
                subjecct: 'password reset',
                html: `
                <p> You requested a password reset. </p>
                <p> Click this link to set a new password. </p>
                <p> <a href="http://localhost:3000/new-password/${token}">Reset Password </a></p>
                `
            })
        })
        .catch(error => {
            const err = new Error(error);
            err.httpStatusCode = 500;
            return next(err); 
        })
    })
  }

  exports.getNewPasswordReset = (req, res, next) => {
    // retrieve the token
    const token = req.params.token;
    console.log('token: ', token);
    // multiple filter criteria.  use the $gt in curly braces to compare!
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        let message = req.flash('error');  // the messages came in as an array
        if(message.length > 0) {
            message = message[0];
        }
        else {
            message = null;
        }
        console.log('User: ', user);
        res.render('auth/new-password', {
          path: '/new-password',
          pageTitle: 'Update Passwrod',
          errorMessage: message,
          passwordToken: token,
          userId: user._id.toString()
        })
    })
    .catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
  }

  exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const password = req.body.password;
    const passwordToken = req.body.passwordToken;

    console.log(userId);
    console.log(password);
    console.log(passwordToken);

    let resetUser;

    console.log('date: ', Date.now().toString())
    User.findOne({resetToken: passwordToken , resetTokenExpiration: {$gt: Date.now()}, 
    _id: userId})
    .then(user => {
        resetUser = user;
        console.log('resetUser', user);
        return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
        // after save, redirect back to login page!
        res.redirect('/login');
    })
    .catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })


  }