'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('turns', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
          deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
        },
        unique: 'userGameComposite',
      },
      messageType: {
        type: Sequelize.STRING,
        validate: {
          isIn: [['emoji', 'text']],
        },
      },
      message: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receivedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextUserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
          deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      isCurrent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      gameId: {
        type: Sequelize.INTEGER,
        unique: 'userGameComposite',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('turns');
  }
};