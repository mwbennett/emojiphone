'use strict';

const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const Turn = sequelize.define('Turn', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
        deferrable: DataTypes.Deferrable.INITIALLY_IMMEDIATE,
      },
      unique: 'userGameComposite',
    },
    messageType: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['emoji', 'text']],
      },
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
        deferrable: DataTypes.Deferrable.INITIALLY_IMMEDIATE,
      },
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    gameId: {
      type: DataTypes.INTEGER,
      unique: 'userGameComposite',
    },
  }, {});
  Turn.associate = function(models) {
    // associations can be defined here
  };
  return Turn;
};