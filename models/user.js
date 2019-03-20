'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      unique: true,
    },
  }, {});
  user.associate = function(models) {
    // associations can be defined here
  };
  return user;
};