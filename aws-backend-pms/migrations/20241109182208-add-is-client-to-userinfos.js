module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('userinfos', 'is_client', {
      type: Sequelize.TINYINT,
      defaultValue: 0,       // Default to 0
      allowNull: false,      // Ensure column is not nullable
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('userinfos', 'is_client');
  },
};
