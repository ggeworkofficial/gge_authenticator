'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_devices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      device_name: {
        type: Sequelize.STRING,
        allowNull: true      // optional, e.g., "Chrome on Windows"
      },
      device_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'browser' // default to browser, later desktop/mobile
      },
      device_id: {
        type: Sequelize.STRING,
        allowNull: false      // unique identifier for this device/session
      },
      last_active_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false
      }
    });

    // Optional: unique constraint per user + device_id
    await queryInterface.addConstraint('user_devices', {
      fields: ['user_id', 'device_id'],
      type: 'unique',
      name: 'unique_user_device'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_devices');
  }
};
