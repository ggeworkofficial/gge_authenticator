'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "is_admin", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("users", "date_of_birth", {
      type: Sequelize.DATEONLY,
      allowNull: true, // allow until later validations
    });

    await queryInterface.addColumn("users", "is_verified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "is_admin");
    await queryInterface.removeColumn("users", "date_of_birth");
    await queryInterface.removeColumn("users", "is_verified");
  }
};
