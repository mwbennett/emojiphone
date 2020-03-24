'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint(
      'turns',
      ['gameId'],
      {
        type: 'foreign key',
        name: 'gameId_fk',
        references: {
          table: 'games',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint(
      'turns',
      ['gameId']
    )
  }
};
