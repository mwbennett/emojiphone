'use strict';

const User = require('./user');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const turn = sequelize.define('turn', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
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
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
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
  turn.associate = function(models) {
    turn.belongsTo(models.user, {as: "user"});
    turn.belongsTo(models.user, {foreign_key: "nextUserId", as: "nextUser"});
  };
  return turn;
};