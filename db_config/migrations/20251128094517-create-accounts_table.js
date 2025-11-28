'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('linked_accounts', {
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
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false       // e.g., 'google', 'facebook'
      },
      provider_user_id: {
        type: Sequelize.STRING,
        allowNull: false       // ID given by provider
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false
      }
    });

    // Ensure a user can have only one linked account per provider
    await queryInterface.addConstraint('linked_accounts', {
      fields: ['user_id', 'provider'],
      type: 'unique',
      name: 'unique_user_provider'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('linked_accounts');
  }
};
