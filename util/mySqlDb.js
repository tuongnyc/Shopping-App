// sequelize uses mysql2 behind the scene.
const Sequelize = require('sequelize');

const sequelize = new Sequelize('shopping-app', 'root', 'Tuong123!', 
    {dialect: 'mysql', host: 'localhost'});


module.exports = sequelize;

/*const mysql = require('mysql2');  

// set up a connection pool.
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'shopping-app',
    password: 'Tuong123!'
});

module.exports = pool.promise(); */