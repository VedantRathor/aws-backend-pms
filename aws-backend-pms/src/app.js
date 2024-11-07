require('dotenv').config();

const express = require('express');

const app = new express();
const http = require('http') ; 
const server = http.createServer(app); 


const socket = require('./socket');
const db = require('../models/index');
const userinfo = db.userinfo
const project = db.project
const assignment = db.assignment
const task = db.tasks   
const log = db.log
const notification = db.notification
const multer = require('multer');
const path = require('path');
const io  = socket.init(server); 
const router = require('../routes/router')
const bodyParser = require('body-parser')
const cors = require('cors')

// const { Server } = require('socket.io')



// const io = new Server(server, {
//     cors: {
//         origin: 'http://localhost:5173',
//         methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     }
// })
// Initialize Socket.IO with the server



app.use(cors({
    origin: 'https://project-managementt-system.netlify.app', // Adjust to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));


app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.urlencoded({ extended: false }))

app.use("/uploaded-image", express.static(path.join(__dirname, "../storage/uploads")));
;
app.use(router);



// console.log(process.env.PORT);
server.listen(process.env.PORT, () => {
    console.log('Listening OK at 8080')
})