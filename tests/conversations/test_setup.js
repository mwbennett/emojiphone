var assert = require('assert');
var should = require('chai').should();
let setupConversation = require('../../conversations/setup');
let testUtils = require('../../utils/testing_utils');


const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const models = require('../../models');

const users = [
    {
        firstName: "Blerp",
        lastName: "Person",
        phoneNumber: "9198462735"
    },
    {
        firstName: "Two",
        lastName: "Cool",
        phoneNumber: "9198684114"
    }
]

describe('Setup conversation', () => {
    describe('setupGame', () => {

        beforeEach(done => {
            done();
        })

        it('it should be able to set up a game given a list of users', (done) => {
            setupConversation.setupGameForTesting(users).then(() => {
                done();
            }).catch(err => {
                done(err)
            });
        });
    })
})
