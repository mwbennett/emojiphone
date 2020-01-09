const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const models = require('../models');

module.exports = {
    truncateDatabase: () => {
        let promises = [];
        Object.values(models).map(function(model) {
            if (model.destroy) {
                promises.push(model.destroy({ truncate: {cascade: true} }));
            }
        });
        return Promise.all(promises);
    }
}