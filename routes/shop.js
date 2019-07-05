const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop')
const isAuth = require('../middleware/is-auth');

const router = express.Router();


router.get('/', shopController.getIndex);
router.get('/products', shopController.getShopList);
router.get('/products/:productId', shopController.getProductDetail)
router.get('/cart', isAuth, shopController.getCart); 
router.post('/cart', isAuth, shopController.postCart);
router.get('/orders', isAuth, shopController.getOrders); 
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteItem);
// stripe has its own security, so can't use our csrf token in the create order!
//put it in the main app.js
//router.post('/create-order', isAuth, shopController.postOrder) 

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get('/checkout', isAuth, shopController.getCheckout);

module.exports = router;
