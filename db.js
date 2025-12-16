// Load mysql library
const mysql = require('mysql2');

const pool = mysql.createPool({  // Create the pool
  host: 'localhost',
  user: 'root',
  password: 'Ines.Bar.21.09', // Write here your MYSQL password!
  database: 'globo',           
});

module.exports = pool.promise(); // Export the pool
