'use strict';
module.exports = (sequelize, DataTypes) => {
  const game = sequelize.define('game', {
    restarted: DataTypes.BOOLEAN,
    token: DataTypes.STRING,
    tokenExpiry: DataTypes.DATE
  }, {});
  game.associate = function(models) {
    // associations can be defined here
  };
  return game;
};