const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema( {
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,  // not required!
    resetTokenExpiration: Date,
    email: {
        type: String,
        required: true
    },
    cart: {
        items: [{productId: {type: Schema.Types.ObjectId, required: true, ref: 'Product' }, 
                quantity: { type: Number, required: true} } ]
    }
})

userSchema.methods.emptyCart = function() {
    this.cart.items = [];  // or this.cart = {items: []};
    return this.save()
}

userSchema.methods.deleteItemInCart = function(productId) {
        // Or use filter function of the array!!!  It keeps all product that 
        // does not satisfy the condition!!
        
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString()
        }) ;

        this.cart.items = updatedCartItems;
        return this.save();
}

// define the function for the user schema.  Will call on the real instance of the user schema
userSchema.methods.addToCart = function(product) {
    let newQuantity = 1;
    let updatedCartItems = [];

    // embedded all the products the user!
    if(!this.cart) {  // user doesn't have a cart yet.
        // then update the cart with the product and return!
        updatedCartItems.push({productId: product._id, quantity: newQuantity});
        
        this.cart.items = updatedCartItems
        return this.save();

    }

    // find whether the element was in the cart or not!
    const cartProductIndex = this.cart.items.findIndex(cp => {
       
        return cp.productId.toString() === product._id.toString();  // this product already exist in the cart. 
    });

    updatedCartItems = [...this.cart.items];  // copy all items to the array.

    if(cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else {
        updatedCartItems.push({productId: product._id, quantity: newQuantity});
    }
    
    const updatedCart = updatedCartItems;
    this.cart.items = updatedCart;
    return this.save();
}

module.exports = mongoose.model('User', userSchema);

//const mongodb = require('mongodb');

//const getDb = require('../util/mongoDb').getDb;

/*
class User {
    constructor(username, email, cart, id) {
        this.name = username;
        this.email = email;
        this.cart = cart; // { items: []}
        this._id = id
    }

    save() {
        const db = getDb()
        return db.collection('users').insertOne(this)
        .then(result => {
            console.log('Insert user successfully');
            console.log(result);
        }).catch(error => {
            console.log('Error in saving user: ', error);
        })
    }

    getCart() {

    } 


    deleteItemInCart(productId) {
        // Or use filter function of the array!!!  It keeps all product that 
        // does not satisfy the condition!!
        /*
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString()
        }) 

        const index = this.cart.items.findIndex(pId => {
            return pId.productId.toString() === productId.toString();
        })

        console.log('Index of finding the string ', index)
        if(index >= 0) {
            // splice it out.
            this.cart.items.splice(index,1);
            // now connect to the database!
            const db = getDb();
            return db.collection('users').updateOne({_id: new mongodb.ObjectId(this._id)}, {
                $set : this }).then(result => {
                    console.log(result)
                }).catch(error => {
                    console.log('deleteItemInCart: ', error)
                })
        }
    }

    static findById(userId) {
        const db = getDb();
        return db.collection('users').findOne({_id : new mongodb.ObjectId(userId)})
        .then((user) => {
            return user;
        }).catch(error => {
            console.log('Error in findById: ', error);
        })
    }

    // add order to user relation
    addOrder() {
        const db = getDb();
        return this.getCart()
        .then(products => {
            // data doesn't need to change, so embeded data is best!
            const order = {
                items: products,
                user: {
                    _id: new mongodb.ObjectId(this._id),
                    name: this.name
                }
            };

            return db.collection('orders').insertOne(order)
        })
        .then(result => {
            this.cart = { items: [] }  // move all the cart to the order database and empty the cart!
            return db.collection('users').updateOne({_id: new mongodb.ObjectId(this._id)},
                {$set: {cart : {items: []} } } )
        }).catch(error => {
            console.log('Error: addOrder', error);
        })
    }

    getOrders() {
        const db = getDb();
        return db.collection('orders').find({'user._id' : new mongodb.ObjectId(this._id)})
        .toArray()
    }
} */

//module.exports = User;
