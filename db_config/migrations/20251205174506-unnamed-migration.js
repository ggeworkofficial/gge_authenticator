'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_devices', 'device_id');
    await queryInterface.addColumn('user_devices', 'device_id', {
      type: Sequelize.UUID,
      allowNull: false
    });

    await queryInterface.addConstraint('user_devices', {
      fields: ['user_id', 'device_id'],
      type: 'unique',
      name: 'unique_user_device'
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_devices', 'device_id');
    await queryInterface.addColumn('user_devices', 'device_id', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addConstraint('user_devices', {
      fields: ['user_id', 'device_id'],
      type: 'unique',
      name: 'unique_user_device'
    });
  }
};
