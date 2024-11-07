const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { Model, QueryTypes, where } = require('sequelize');
const db = require('../models/index')
const userinfo = db.userinfo
const project = db.project
const assignment = db.assignment
const task = db.task
const log = db.log
const notification = db.notification
const company = db.company;
const chat = db.chat ;


let io;


const performEntryInDatabase = async(data) => {
    try {
        const result = await chat.createUser(data);
        if( result ) return true ;
        else return false ;
    } catch (error) {
        console.log('error: ',error);
    }
}

module.exports = {
    init: (server) => {
        io = socketIO(server, {
            cors: {
                origin: 'https://project-managementt-system.netlify.app', // Change this based on your frontend URL
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
            }
        });

        io.on('connection', (socket) => {
            // console.log('A user connected:');

            // Listening for 'chat-message' from any client
            socket.on('chat-message',(data)=>{
                // console.log('listened from io io ', data);
                
                //perform entry in db:
               if( performEntryInDatabase(data) ){
                data.msg = 'success';
                socket.broadcast.emit(`receive-chat-message/${data.project_id}/${data.userdata.company_id}`,data);
               }else{
                data.msg = 'unsuccess';
                socket.broadcast.emit(`receive-chat-message/${data.project_id}/${data.userdata.company_id}`,data);
               }
                
            })

            socket.on('disconnect', () => {
                // console.log('A user disconnected:');
            });
        });

        return io;
    },

    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
