const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth')

const { check, body } = require('express-validator');   // use the subpackage!.

const router = express.Router();


// /admin/add-product => GET
// this will parsed from left to right.
router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct); 

// /admin/add-product => POST
router.post('/add-product', 
// adding validationg!
[ body('title', 'Invalid Title').trim().isLength({min: 3}),
body('price', 'Invalid Price').isFloat(),
//body('imageUrl', 'Invalid Image URL').isURL(),
body('description','').trim().isLength({min: 5, max: 400})
],
isAuth, adminController.postAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/edit-product',
// adding validationg!
[ check('title').trim().isLength({min: 3}).withMessage('Invalid title'),
check('price').isFloat().withMessage('Invalid price.'),
//check('imageUrl').isURL().withMessage('invalid url.'),
check('description','').trim().isLength({min: 5, max: 400}).withMessage('Invalid description.')
], isAuth, adminController.postEditProduct);

//router.get('/delete-product/:productId',adminController.getDeleteProduct);
router.post('/delete-product', isAuth, adminController.getDeleteProduct);

/*exports.routes = router;
exports.products = products; */

router.delete('/product/:productId', isAuth, adminController.deleteProduct);
module.exports = router;
