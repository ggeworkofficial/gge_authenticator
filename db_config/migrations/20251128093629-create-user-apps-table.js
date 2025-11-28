'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_apps', {
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
      app_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'apps',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false
      }
    });

    // Ensure a user can only have one entry per app
    await queryInterface.addConstraint('user_apps', {
      fields: ['user_id', 'app_id'],
      type: 'unique',
      name: 'unique_user_app'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_apps');
    
  }
};
