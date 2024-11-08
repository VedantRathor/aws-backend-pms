const {getIO} = require('../src/socket');


const { Model, QueryTypes, where } = require('sequelize');
const express = require('express');
const db = require('../models/index')
const { Op } = require('sequelize')
const userinfo = db.userinfo
const project = db.project
const assignment = db.assignment
const task = db.task
const log = db.log
const company = db.company;
const notification = db.notification
const service = require('../services/service')
const jwt = require('jsonwebtoken')
const authIslogin = require('../middlewares/authIslogin');
const { SERIALIZABLE } = require('sequelize/lib/table-hints');


const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require('multer');
const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_KEY,
    },
  });
  

// This Method: Registers the user
const adduser = async (req, res) => {
    try {
        const userdata = res.locals.user ;
        const { user_id, company_id} = userdata ;
        const {  email, password, ucpassword , name } = req.body;
        console.log(req.body)
        // FindUser - finds the user if having email already
        const emailExists = await userinfo.FindUser(email);
        if (emailExists == null) {
            if (password == ucpassword) {
                const token = service.generateToken(email);
                // create user 
                const result = await userinfo.createUser(req.body, token,company_id);
                const allUsers = await userinfo.findAll({where:{company_id:company_id}},{attributes:['user_id']}) ;
                // console.log(allUsers);
                allUsers.map(async(eachUser) =>{
                    await notification.create({
                        user_id : eachUser.user_id,
                        notification : `Welcoming ${name}😍. ${req.body.aboutUser}`,
                        read : 0,
                        company_id:company_id
                    })
                })
                // send full response to the client exluding email password 
                service.successRetrievalResponse(res, 'user registered', result);
            } else {
                service.failRetrievalResponse(res, 'user Password be registered')
            }
        } else {
            service.failRetrievalResponse(res, 'user already exists')
        }
    } catch (error) {
        console.log(error)
        service.serverSideError(res)
    }
}

// This Method: Used for authentication and Login.
const loginUserByEmailPass = async (req, res) => {
    try {
        const { email, password , company_registration_number} = req.body;
        const CompanyId = await company.findOne({where:{company_registration_number:company_registration_number}});
        if( CompanyId){
            const emailExists = await userinfo.FindUser(email,CompanyId.company_id);

        if (emailExists != null) {
            // check for password ! 
            if (password == emailExists.password) {
                // generate token 
                const token = await service.generateToken(email);
                // update it 
                await userinfo.updateUser(token, emailExists.email);
                // let result = await userinfo.FindUser(email,CompanyId.company_id);
                let result = await  userinfo.findOne({ where: { email: email, company_id : CompanyId.company_id},
                    attributes:['name','email','created_at','updated_at','role','user_id','profile','company_id','token'] });
                    let retResponse = {
                        name : result.name,
                        email: result.email,
                        created_at:result.created_at,
                        updated_at : result.updated_at,
                        role : result.role,
                        user_id : result.user_id,
                        profile : result.profile,
                        company_id : result.company_id,
                        token : result.token,
                        company_name: CompanyId.company_name
                    }
                service.successRetrievalResponse(res, 'login succesful', retResponse);

            } else {
                service.failRetrievalResponse(res, 'passwords not matched')
            }
        } else {
            service.failRetrievalResponse(res, 'email doesnot exists')
        }
        }else{
            service.failRetrievalResponse(res,'company id is wrong');
        }
        

    } catch (error) {
        console.log(error)
        service.serverSideError(res)
    }
    
}

async function UpdateDetails(req, res) {
    const profile = req.file ? req.file.path : "No File";
    console.log(profile);
    res.json(profile);
    // const response = await userinfo.update({ name: name, email: email, password: password, updated_at: new Date(), profile: profile }, { where: { user_id: id } });

    // if (response) {
    //     res.status(200).json({ status: "success", message: "Profile Updated", response })
    // }
    // else {
    //     console.log("Error in Updating User Data");
    // }
}


const getNotifications = async(req,res) =>{
    try {
        const userdata = res.locals.user ;
        const {user_id , role , name , company_id} = userdata ;
        // console.log(user_id,role,name)
        const result = await notification.findAll({where : {
            user_id : user_id , company_id : company_id
        },order:[['created_at','DESC']]})
       
        const {view} = req.params
        console.log(view)
        if( view == 'true' ){
            console.log('inside this',view)
          await notification.update({
               read : 1 
          },{
            where : {
              user_id : user_id ,
              company_id : company_id
            }
          })
        }
        
        service.successRetrievalResponse(res,'Notifcations retrieved succesfully',result) 
    } catch (error) {
        console.log(error)
        service.serverSideError(res)
    }
}

const getAllUsers = async(req,res) =>{
 try {
    const userdata = res.locals.user;
    const {company_id} = userdata;
    // const company_id = 1;
   // Destructure the query parameters from req.query
const { userName, userOrder, userRole } = req.query;

// Build the where conditions dynamically
        const userWhereClause = {
            role: { [Op.ne]: 1 }, // Exclude role = 1 (as per your example)
            company_id: company_id
        };

        // If userName is provided, add a name filter
        if (userName) {
            userWhereClause.name = {
                [Op.like]: `%${userName}%`
            };
        }

        // If userRole is provided, add a role filter
        if (userRole) {
            userWhereClause.role = +userRole;
        }

        // Build the order array based on userOrder
        let orderClause = [];
        if (userOrder == 1) {
            // Order by updated_at descending
            orderClause = [['updated_at', 'DESC']];
        } else {
            // Order by updated_at ascending
            orderClause = [['updated_at', 'ASC']];
        }

        // Execute the query
        const result = await userinfo.findAll({
            where: userWhereClause,
            attributes: ['name', 'email', 'created_at', 'updated_at', 'role', 'user_id', 'profile', 'company_id'], // Select specific attributes
            order: orderClause
        });
   
    service.successRetrievalResponse(res,"user data succesfully retrieved",result)
 } catch (error) {
    console.log('error in getAllusers',error)
    service.serverSideError(res)
 }
}

const updateUserInfo = async(req,res) => {
    try {
        const userdata = res.locals.user;
        const {company_id} = userdata;
        const {name,role,current_password,new_password,email} = req.body ;
        if( role == 0 ){
            service.failRetrievalResponse(res,'Please Select Valid Role') ;
        }else{
            const result = await userinfo.findAll({where:{email:email}}) ;
            if( current_password != null && current_password != undefined ){
                // update name,role and password 
               
                if( result.length == 0 ){
                   service.failRetrievalResponse(res,'User Does not Exists') ;
                }else{
                    if( result[0].password == current_password ){
                        await userinfo.update({
                            name : name,
                            password : new_password,
                            role : role
                        },{
                            where : {
                                user_id : result[0].user_id ,
                                company_id : company_id
                            }
                        })
                        service.successRetrievalResponse(res,'Updation Succesfull') ;
                    }else{
                        service.failRetrievalResponse(res,'Password is not correct!') ;
                    }
                }
            }else{
                // do normal update, only in role and name
                await userinfo.update({
                    name : name,
                    role : role
                },{
                    where : {
                        user_id : result[0].user_id 
                    }
                });
                service.successRetrievalResponse(res,'Updation Succesfull') ; 
            }
        }
    } catch (error) {
        console.log('error in updateUserInfo',error);
        service.serverSideError(res) ;
    }
}

const uploadVideo = async(req,res) => {
    try {
        let videoPathName = req.file ? req.file.filename : null;
        res.json({
            "video path": videoPathName
        });
    } catch (error) {
        console.log('error:' , error);
    }
}


const getFolderPathByMimeType = (mimeType) => {
    if (mimeType.startsWith("image")) {
      return "images";
    } else if (mimeType.startsWith("video")) {
      return "videos";
    } else if (mimeType === "application/pdf") {
      return "pdfs";
    } else if (mimeType === "application/vnd.ms-excel" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      return "excels";
    } else {
      return "other-files";
    }
  };

const uploadToS3 = async (fileBuffer, bucketName, key, mimeType) => {
  const uploadParams = {
    Bucket: 'aws-pms-storage',
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType, // Dynamically set the content type based on file MIME type
    ContentDisposition: 'inline' // Ensure the file is displayed inline in the browser
  };

  try {
    // Using the Upload class to handle large file uploads
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    console.log(`Uploading to S3 with key: ${key} and MIME type: ${mimeType}`);
    await parallelUploads3.done(); // Ensure this completes before proceeding
    console.log("Upload to S3 completed.");
  } catch (error) {
    console.error("Error in uploadToS3:", error);
    throw new Error("File upload to S3 failed");
  }
};

  

const update_user_profile = async (req, res) => {
  try {
    // Validate inputs
    const { companyId, userId } = req.params;
    if (!companyId || !userId || !req.file) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Determine folder based on file MIME type
    const fileCategory = getFolderPathByMimeType(req.file.mimetype);
    const folderPath = `s3-storage/company/${companyId}/users/${userId}/${fileCategory}`;

    // Unique file name with timestamp to avoid overwriting
    const uniqueName = `${Date.now()}-${req.file.originalname}`;
    const fullPath = `${folderPath}/${uniqueName}`;

    // Log file details before uploading
    console.log(`Attempting to upload file to S3 bucket with path: ${fullPath}`);

    // Upload file to S3 with dynamically set MIME type
    await uploadToS3(req.file.buffer, process.env.BUCKET_NAME, fullPath, req.file.mimetype);

    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${fullPath}`;
    console.log("File successfully uploaded, URL:", fileUrl);

    const user = await userinfo.findOne({ where: { company_id: companyId, user_id: userId } });
    if (user) {
      await userinfo.update(
        {
          profile: fileUrl // Save the filename in the database
        },
        {
          where: {
            user_id: user.user_id,
            company_id: companyId
          }
        }
      );
      res.json({
        status: "success",
        message: `${fileUrl} successfully uploaded!`,
        fileUrl,
      });
    } else {
      res.status(500).json({ message: "User not found in database" });
    }
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};


// const update_user_profile = async (req, res) => {
//     try {
//         const userdata = res.locals.user;
//         const { company_id } = userdata;
//         const { role, email } = req.body;

//         // Get the filename from the uploaded file
//         let profileImage = req.file ? req.file.filename : null; // Use req.file.filename instead of req.file.originalname

//         if (role == 0) {
//             service.failRetrievalResponse(res, 'Please Select Valid Role');
//         } else {
//             const result = await userinfo.findAll({ where: { email: email, company_id: company_id } });
//             if (result.length == 0) {
//                 service.failRetrievalResponse(res, 'User Does not Exists');
//             } else {
//                 // Update the profile image and other fields if needed
//                 await userinfo.update({
//                     profile: profileImage // Save the filename in the database
//                 }, {
//                     where: {
//                         user_id: result[0].user_id,
//                         company_id: company_id
//                     }
//                 });
//                 service.successRetrievalResponse(res, 'Updation Successful');
//             }
//         }
//     } catch (error) {
//         console.log('error in updateUserProfile', error);
//         service.serverSideError(res);
//     }
// }

module.exports = {
    adduser,
    loginUserByEmailPass,
    UpdateDetails,
    getNotifications,
    getAllUsers,
    updateUserInfo,
    update_user_profile,
    uploadVideo
}
