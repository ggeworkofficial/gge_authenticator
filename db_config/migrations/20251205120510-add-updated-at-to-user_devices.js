'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('user_devices', 'updated_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_devices', 'updated_at');
  }
};
