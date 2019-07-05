//const products = [];

const fs = require('fs');
const path = require('path');

module.exports = class Product {
    constructor(title, imageUrl, price, description) {
        this.title = title;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
    }

    // method without function keyword
    save() {
        //products.push(this);
        this.id = Math.random().toString(); // create an Id.
        const pth = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json');
        fs.readFile(pth, (error, data) => {
            let products = [];

            if(!error) {
                products = JSON.parse(data);
            }

            products.push(this);

            fs.writeFile(pth, JSON.stringify(products), (error) => {
                console.log('Error', error);
            });
        })
    }

    static fetchAll(callback) {
        const pth = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json');
        fs.readFile(pth, (error, data) => {
            if(error) {
                console.log('Error', error);
                callback([]);
            }
           // return JSON.parse(data);
           else {
                callback(JSON.parse(data));
           }
        })
        //return products;
    }

    static findById(id, callback) {
        const pth = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json');
        let myArray = [];
        fs.readFile(pth, (error, data) => {
            if(error) {
                myArray = [];
            }
           // return JSON.parse(data);
           else {
                myArray = JSON.parse(data);
           }
        })
        const product = myArray.find(p => p.id === id);
        callback(product);
    }
}

