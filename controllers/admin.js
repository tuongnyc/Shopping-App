const fileHelper = require('../util/file');
const Product = require('../models/product');
const { validationResult } = require('express-validator/check');


exports.getAddProduct = (req, res, next) => {
  /*  if(!req.session.isLoggedIn) {
        // user is not login
        return res.redirect('/login');
    }*/
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      isAuthenticated: req.session.isLoggedIn,
      editing: false,
      formsCSS: true,
      productCSS: true,
      activeAddProduct: true,
      hasError: false,
      product: {title: '', price: '', imageUrl: '', description: ''},
      errorMessage: null
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;  // edit query parameter edit=true, it is a string.
    if(!editMode) {
        return res.redirect('/');
    }
    // get the product information.
    const prodId = req.params.productId;

    // once relationship set up, we could use req.user sequelize object.  
    // we could find all products that are based on product id and user id.
    /*req.user.getProducts({where: {id: prodId}}) */
    Product.findById(prodId)  //findById provided by Mongoose!
    .then(product => {
        // note findByPk, return an actual object (one), while getProducts
        // return an array of products.
        if(!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            isAuthenticated: req.session.isLoggedIn,
            formsCSS: true,
            productCSS: true,
            activeAddProduct: true,
            errorMessage: null
        });
    }).catch((error) => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
};

exports.postAddProduct = (req, res, next) => {
    const image = req.file;
    console.log(image);
    console.log('Post Add Product');

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        console.log('errors is empty!!')
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Products',
            path: '/admin/add-products',
            editing: false,
            product: {
                title: req.body.title,
                price: req.body.price,
                //imageUrl: req.file,
                description: req.body.description
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
          })
    }
    //products.push({ title: req.body.title });

    if(!req.file) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Products',
            path: '/admin/add-products',
            editing: false,
            product: {
                title: req.body.title,
                price: req.body.price,
                description: req.body.description
            },
            hasError: true,
            errorMessage: 'Attached file is not an image',
            validationErrors: []
        })
    }

    const imageUrl = req.file.path;  // path
    const product = new Product({
        title: req.body.title, 
        price: req.body.price, 
        description: req.body.description, 
        imageUrl: imageUrl,
        userId: req.user._id  // or just userId: req.user.  Mongoose will automatically picked just the _id.
    });

    console.log('Before saving:', product);

    product.save()  // this save method is from mongoose!!
    .then(result => {
        console.log(result);
        res.redirect('/admin/products');
    }).catch((error) => {
        // an error has occured.
        console.log('ERror: postAddProduct', error);
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
  }

  
exports.postEditProduct = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-products',
            editing: true,
            product: {
                title: req.body.title,
                price: req.body.price,
                description: req.body.description,
                _id: req.body.productId
            },
            errorMessage: 'Database operation failed.  Please try again.',
            hasError: true,
            validationErrors: []
          }) 
    }
    const prodId = req.body.productId;
    const title = req.body.title;
    const price = req.body.price;
    const image = req.file;
    const description = req.body.description;
    // Product.findByPk(prodId).then(product => {
   Product.findById(prodId).then(product => {
       if(!product) {
            return res.redirect('/admin/products');
        } else
        {
            if(product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = title,
            product.price = price,
            product.description = description;
            product.imageUrl = imageUrl; 
            if(image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product.save().then(result => {
                console.log(result); 
                res.redirect('/admin/products') });
       }
    }).catch((error) => { // catch for both promisese
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err);  // let middleware will skip all other method and set an error.
    }) 
}

exports.getDeleteProduct = (req, res, next) => {
    //const prodId = req.params.productId;
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(prod => {
        if(!prod) {
            const err = new Error(error);
            err.httpStatusCode = 500;
            return next(new Error('Product not Found')); 
        }
        fileHelper.deleteFile(prod.imageUrl);
        return Product.deleteOne({_id:prodId, userId: req.user._id})
    }).then(result => {
        console.log(result);
        res.redirect('/admin/products');
    }).catch(error => {
        const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); 
    })
} 

exports.getProducts = (req, res, next) => {
    // find all products based on the user
    Product.find({userId: req.user._id})
    //.select('title price -_id')  // tell which fields to get only.  Exclude the _id with the minus sign.
    //.populate('userId') // tell mongoose to populate all the fields including the cart and items!.
    .then(products => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
            hasError: false,
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

  exports.deleteProduct = (req, res, next) => {
    //const prodId = req.params.productId;
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(prod => {
        if(!prod) {
            const err = new Error(error);
            err.httpStatusCode = 500;
            return next(new Error('Product not Found')); 
        }
        fileHelper.deleteFile(prod.imageUrl);
        return Product.deleteOne({_id:prodId, userId: req.user._id})
    }).then(result => {
        console.log(result);
        // send back to javascript.  JSON data
        // since we are not redirect, so we need to set the status code.
        res.status(200).json({ // pass the JSON
            message: 'Deleting successfully.'
        })
    }).catch(error => {
        /*const err = new Error(error);
        err.httpStatusCode = 500;
        return next(err); */
        res.status(500).json({ message: 'Deleting product failed.'});
    })
} 
