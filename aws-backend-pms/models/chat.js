'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class chat extends Model {
     static async createUser(data){
      return await  chat.create({
        company_id : data.userdata.company_id,
        project_id : data.project_id,
        user_id : data.userdata.user_id,
        message: data.message,
        type: 1,
        deleted_at : null,
    })  
     }

    static async getChatsByCompanyAndProjectId(project_id, company_id) {
      const query = `
        SELECT ch.*, ui.user_id, ui.name, ui.role, ui.profile
        FROM chats ch 
        INNER JOIN userinfos ui ON ch.user_id = ui.user_id 
        WHERE ch.project_id = :projectId AND ui.company_id = :companyId;
      `;

      const replacements = {
        projectId: project_id,
        companyId: company_id,
      };

      try {
        const result = await sequelize.query(query, {
          replacements: replacements,
          type: sequelize.QueryTypes.SELECT // Specify that we're selecting
        });
        return result; // This will be an array of chat objects with user info
      } catch (error) {
        console.error('Error executing query:', error);
        throw error; // Rethrow the error for handling in the calling function
      }
    }
    
  }
  chat.init({
    company_id:{type: DataTypes.INTEGER,  allowNull : false },
    project_id: {type: DataTypes.INTEGER,allowNull : false },
    user_id:{type: DataTypes.INTEGER, allowNull:false},
    message: {type:DataTypes.TEXT,allowNull:false},
    type: DataTypes.INTEGER,
    deleted_at: {type:DataTypes.DATE,allowNull:true},
    created_at : {type : DataTypes.DATE,allowNull:false},
    updated_at: {type : DataTypes.DATE,allowNull:false}
  }, {
    createdAt: 'created_at',  // Override Sequelize default field names
    updatedAt: 'updated_at',
    sequelize,
    modelName: 'chat',
  });
  return chat;
};