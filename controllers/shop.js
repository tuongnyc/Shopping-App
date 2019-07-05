const Product = require('../models/product');
const Order = require('../models/order');

const pPDFDocument = require('pdfkit');

const fs = require('fs');
const path = require('path');

// stripe payment system!
const stripe = require('stripe')(process.env.STRIPE_KEY)//'sk_test_0b6gHR00ju4adzV3Oejn0iiF00vx2PDmwM')

const ITEMS_PER_PAGE = 1;  // how many items per page you are setting.

exports.getShopList = (req, res, next) => {
    const page = +req.query.page || 1;  // get the page query parameter.
    // the req.query.page return a string.  If we put a + sign infront, it'll convert to number!!!
    // the pipes say that if there is no query(undefine), default to 1. 
    let totalItems;

    Product.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        // skip is from mongoose!
        // set pagination!
        return Product.find().skip((page - 1) * ITEMS_PER_PAGE) 
        .limit(ITEMS_PER_PAGE);
    }).then((products) => {
        // find from mongoose, does not return a cursor like mongo db!.
        // render the page.
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products',
            totalProducts: totalItems,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems/ ITEMS_PER_PAGE),
            isAuthenticated: req.session.isLoggedIn,
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true
        })
    }).catch((error) => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    });
  }

  exports.getProductDetail = (req, res, next) => {
      const prodId = req.params.productId;

      // findById is provided by Mongoose!!, use a string a parameter!
      Product.findById(prodId)
      .then(product => {
        res.render('shop/product-detail', 
        {pageTitle: product.title, path: '/products', product: product,
        isAuthenticated: req.session.isLoggedIn
        })
      })
      .catch((error) => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
      })
 
  }

  exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;  // get the page query parameter.
    // the req.query.page return a string.  If we put a + sign infront, it'll convert to number!!!
    // the pipes say that if there is no query(undefine), default to 1. 
    let totalItems;
    
    Product.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        // skip is from mongoose!
        // set pagination!
        return Product.find().skip((page - 1) * ITEMS_PER_PAGE)  
        .limit(ITEMS_PER_PAGE)
    }).then((products) => {
        // render the page.
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            totalProducts: totalItems,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems/ ITEMS_PER_PAGE),
           // hasProducts: products.length > 0,
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true
        })
    }).catch((error) => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    });
  }

  exports.getCart = (req, res, next) => {
      req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(user => {
        products = user.cart.items;
        res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            isAuthenticated: req.session.isLoggedIn,
            products: products
        })  
      }).catch((error) => {

        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
      })
  }

  exports.postCart = (req, res, next) => {
      const prodId = req.body.productId;  // name in the hidden in the views.

      Product.findById(prodId).then(product => {
        return req.user.addToCart(product);
      }).then(result => {
        console.log('RESULT FROM ADDING CART: ', result);  
        res.redirect('/cart');
        
      }).catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
      })
 
  }

  exports.postCartDeleteItem = (req, res, next) => {
      const prodId = req.body.productId;
      req.user.deleteItemInCart(prodId).then(result => {
          res.redirect('/cart');
      }).catch((error) => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
      })
      
  }

  exports.getOrders = (req, res, next) => {
    // find with where clause in mongoose!
    Order.find({"user.userId": req.user._id})
    .then(orders => {
        res.render('shop/orders', {
            path: '/orders',
            pageTitle: 'Your Orders',
            isAuthenticated: req.session.isLoggedIn,
            orders: orders
        })       
    })
    .catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
}

exports.postOrder = (req, res, next) => {
    // implement payment system through stripe!!
    // extract the stripe incoming token from the body!
    const token = req.body.stripeToken;   
    let totalSum = 0;

    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {

        user.cart.items.forEach(p => {
            totalSum += p.quantity * p.productId.price;
        })

        const products = user.cart.items.map(i => {
            // the ._doc return the document.  the spread (...) operator copy all the fields.
            return {quantity: i.quantity, product: { ...i.productId._doc } };
        });
        const order = new Order({
            user: {
                name: req.user.name,
                email: req.user.email,
                userId: req.user
            },
            products: products
        })
        return order.save();

    }).then(result => {
        const charge = stripe.charges.create({
            amount: totalSum * 100,  // it will be in cents in stripe!
            currency: 'usd',
            description: 'Demo Order', 
            source: token,
            metadata: {order_id: result._id.toString()}
        });
        req.user.emptyCart();
    }).
    then(result => {
        res.redirect('/orders');
    }).catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    });
}

exports.getInvoice = (req, res, next) => {
    // check if the order is valid for the user.
    const orderId = req.params.orderId;

    Order.findById(orderId).then(order => {
        if(!order) {
            return next(new Error('No order found'));
        }
        if(order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'))
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data','invoices', invoiceName);

        //creating pdf using PDFKit by creating pdf on NodeJs server!
        const pdfDoc = new pPDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
            //attachment option will allow it to download automatically.
            //res.setHeader('Content-Disposition','attachment; filename="' + invoiceName + '"'); 
            //inline will allow user to view it through browser.
        res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');

        pdfDoc.pipe(fs.createWriteStream(invoicePath));  // write to server
        pdfDoc.pipe(res);  // write to browser to user.

        //pdfDoc.text('Hellow World');  // write to pdf.
        pdfDoc.fontSize(26).text('Invoice', {
            underline: true
        });

        let totalPrice = 0;

        pdfDoc.text('----------------------');


        order.products.forEach(prod => {
            totalPrice += + prod.quantity * prod.product.price;
            pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        }) 

        pdfDoc.text('----------');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
        pdfDoc.end();  // MUST end it!!!!
    
        // readFile is good for small file, big file will take memory on the server!
        /*fs.readFile(invoicePath, (error, data) => {
            // data in the format of buffer.
            if(error) {
                return next(error);
            }
            res.setHeader('Content-Type', 'application/pdf');
            //attachment option will allow it to download automatically.
            //res.setHeader('Content-Disposition','attachment; filename="' + invoiceName + '"'); 
            //inline will allow user to view it through browser.
            res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');
            
            // data should be my file
            res.send(data);
        }) */
        /*
        // streaming the data!
        const file = fs.createReadStream(invoicePath);  // read it step by step with chunks.
        res.setHeader('Content-Type', 'application/pdf');
            //attachment option will allow it to download automatically.
            //res.setHeader('Content-Disposition','attachment; filename="' + invoiceName + '"'); 
            //inline will allow user to view it through browser.
        res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');
        file.pipe(res);  // res is a writable stream!! 
        // pipe our readable stream to writable stream!..  Node doesn't have to put in the memory!
        // stream to directly to the browser.  Then the browser concatentate the buffer stream. */
    }).catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
}

exports.getCheckout = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      let total = 0;
      products.forEach(p => {
          total += p.quantity * p.productId.price;
      })
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Your Checkout',
        products: products,
        totalSum: total
    })
    }).catch((error) => {
      const err = new Error(error);
      err.httpStatusCode = 500;
      return next(err); 
    })
}
