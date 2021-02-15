'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('games', 'completed', { type: Sequelize.BOOLEAN });
    return queryInterface.bulkUpdate('games', {
      completed: true
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('games', 'completed');
  }
};
