'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add hashed_secret column to apps table
    await queryInterface.addColumn('apps', 'hashed_secret', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove hashed_secret column
    await queryInterface.removeColumn('apps', 'hashed_secret');
  },
};
