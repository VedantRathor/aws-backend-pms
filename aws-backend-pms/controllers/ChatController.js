const { Model, QueryTypes, where } = require('sequelize')
const express = require('express');
const db = require('../models/index')
const { Op } = require('sequelize')
const userinfo = db.userinfo
const project = db.project
const assignment = db.assignment
const task = db.task
const log = db.log
const notification = db.notification;
const chat = db.chat;
const service = require('../services/service')
const jwt = require('jsonwebtoken')
const authIslogin = require('../middlewares/authIslogin');
const { SERIALIZABLE } = require('sequelize/lib/table-hints');


const getChatsByProjectIdAndCompanyId = async (req,res) => {
    try {
         const { project_id , company_id } = req.params ;
         const result = await chat.getChatsByCompanyAndProjectId(project_id,company_id) ;
         service.successRetrievalResponse(res, 'all chats retrieved',result) ;

    } catch (error) {
        console.log('error : ' , error ) ;
    }

}

module.exports = {
    getChatsByProjectIdAndCompanyId
}
