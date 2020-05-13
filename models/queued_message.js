'use strict';
module.exports = (sequelize, DataTypes) => {
  const queued_message = sequelize.define('queued_message', {
    userId: DataTypes.INTEGER,
    dialogId: DataTypes.INTEGER,
    turnId: DataTypes.INTEGER,
    sent: DataTypes.BOOLEAN,
    queuedAt: DataTypes.DATE
  }, {});
  queued_message.associate = function(models) {
    // associations can be defined here
  };
  return queued_message;
};