
require('dotenv').config(); // Ensure you load your .env file

// development: {
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'mysql'
// }
module.exports = {
    // development: {
    //     username: 'admin',
    //     password: 'Vedant9820',
    //     database: 'projectmanagementsystem',
    //     host: 'projectmanagementsystem.cr24m0sekt9g.ap-south-1.rds.amazonaws.com',
    //     port: 3306,
    //     dialect: 'mysql'
    // },
    development: {
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT,
    dialect: 'mysql'
},
    test: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || 'database_test',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || '3306',
        dialect: 'mysql'
    },
    production: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || 'database_production',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || '3306',
        dialect: 'mysql'
    }
};
