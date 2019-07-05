// Using Sequelize.  Require to install mysql2 package
// npm i --save sequelize.
const path = require('path');
const session = require('express-session');   
const csrf = require('csurf');
const flash = require('connect-flash');
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');


// session will be stored in mongodb.
const mongodbConnectSession = require('connect-mongodb-session')(session);

const express = require('express');
const bodyParser = require('body-parser');
const pageNotFoundController = require('./controllers/404')
//const mongoConnect = require('./util/mongoDb').mongoConnect;

const mongoose = require('mongoose');

const User = require('./models/user');
const multer = require('multer');  // this allow to parse binary data!
const fs = require('fs');

const app = express();

//const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),
//{flags: 'a'});

app.use(helmet());   // set up secure headers
app.use(compression());
///app.use(morgan('combined', {stream: accessLogStream}));  // allow for logging to the file.

const MONGODB_URI =
`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-krvu5.mongodb.net/${process.env.MONGO_DEFAULT_DB}`

const store = new mongodbConnectSession({
    uri: MONGODB_URI, //'mongodb+srv://shopapp:shopapp@cluster0-krvu5.mongodb.net/test?retryWrites=true&w=majority',
    collection: 'sessions'
});

// use to secure your forms!
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => { 
        callback(null, 'images')  // first argument is error.
    },
    filename: (req, file, callback) => {
        // the file.filename is an random generated filename by multer.
        //Date().toISOString().replace(/:/g, '-')
        callback(null,new Date().toISOString().replace(/:/g,'-') + '-' + file.originalname);
    }
});

const fileFilter = (req, file, callback) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        callback(null, true);
    } else {
        callback(null, false);
    }
}

app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
//app.use(multer({dest: 'images'}).single('image'));  // the name
// on the form!!  Single, expect only single file name.!
// the dest option on multer, tell to store the image file into folder images!!

// you can serve multiple folder!
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));

app.use(  // setting up a session.
    session({secret: 'my secret', resave: false, saveUninitialized: false, store: store})
);  

app.use(flash());  // register flash to use through out express!

app.use((req, res, next) => {
    if(!req.session.user) {
        return next();
    }
   User.findById(req.session.user._id).then(user => {
       if(!user) {
           return next();
       }
        req.user = user;
        next();
    }).catch(error => {
        //console.log('Find user in app.js: ', error);
        // or can call next();
        throw new Error(error);
    }) 
})

app.use((req, res, next) => {
    // set local variables that passed in the views.
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
})

// disable csrf token! By using it it before csrfProtection call!.
app.post('/create-order', isAuth, shopController.postOrder) 

app.use(csrfProtection);  // csurf is enable.  Now, added to the views.
// for any non-get requrest.  It will look for any existing
// csurf token.

app.use((req, res, next) => {
    // set local variables that passed in the views.
    res.locals.csrfToken =  req.csrfToken();
    next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

//app.get('/500',pageNotFoundController.get500);
app.use(pageNotFoundController.pageNotFound);

// error handler with Express!

app.use((error, req, res, next) => {
    console.log('Error: app.js ', error);
    res.redirect('/500');
}) 


/*
mongoConnect(() => {
    app.listen(3000);
}) */

// mongoose connect. return a promise!
//mongoose.connect('mongodb+srv://shopapp:shopapp@cluster0-krvu5.mongodb.net/shop?retryWrites=true&w=majority')
mongoose.connect(MONGODB_URI)
.then(result => {
/*    User.findOne().then(user => {
        if(!user) {
            const user = new User({
                name: 'Tuong',
                email: 'tuong@example.com',
                cart: {
                    items: []
                }
            });
            user.save();
        }
    })*/

    app.listen(process.env.PORT || 3000);
})
.catch(error => {
    console.log('Mongoose error: ', error);
})
