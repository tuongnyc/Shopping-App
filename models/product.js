const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({ // creating a new schema, similar to sequelize
  // key value pair!
  title: { type : String, required: true },  
  price: { type : Number, required: true },
  description: { type : String, required : true },
  imageUrl : { type : String, required: true},
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // the name of the model!!  REfer to the User model.  Now we have a relation
    required: true
  }
});    // mongodb still add _id automatically.

module.exports = mongoose.model('Product', productSchema);  // exporting the model!

/*
class Product {
  constructor(title, price, description, imageUrl, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this.userId = userId;
  }

  save() {  // save to MongoDB.
    const db = getDb();
    // insertOne, just one JSON.  InsertMany will insert an array of JSON.
    // return a new Promise.
    return db.collection('products').insertOne(this).
    then((result) => {
      console.log(result);
    }).
    catch((error) => {
      console.log('Error in inserting: ', error);
    })
     // connect to the product collection!!
  }

  static fetchAll() {
    const db = getDb();
    // find does not return a promise but return a cursor!!
    // so we could go through each element one by one!!  
    return db.collection('products').find().toArray().
    then(products => {
      return products;
    }).
    catch(error => {
      console.log('Error in fetchAll: ', error);
    })
  } 

  static findById(prodId) {
    const db = getDb();
    // still return a cursor with find.
    // the _id in mongo db is stored as an ObjectId(BSON) not a string.
    return db.collection('products').find({_id:new mongodb.ObjectId(prodId)}).next()
    .then((product) => {
      return product;
    })
    .catch((error) => {
      console.log('Error in findById: ', error);
    })
  }

  static deleteById(prodId) {
    const db = getDb();
    return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)})
    .then(result => {
      console.log('deleting: ', prodId);
    })
    .catch((error) => {
      console.log('Error in deleteById', error);
    })
  } */

  /*
  updateProduct(prodId) {
    const db = getDb();
    return db.collection('products').updateOne(
      {_id: new mongodb.ObjectId(prodId)},
     /* {title: this.title,
      price: this.price,
      description: this.description,
      imageUrl: this.imageUrl} 
      {$set: this}
      // or the second argumen! {$set: this}
    ).then(result => {
      console.log(result);
    }).catch(error => {
      console.log('Error in updateProduct: ', error);
    })
  }
} */

//module.exports = Product;