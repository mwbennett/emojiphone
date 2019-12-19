var assert = require('assert');
var should = require('chai').should();
let setupConversation = require('../../conversations/setup');
let testUtils = require('../../utils/testing_utils');

const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const models = require('../../models');
const MessageType = require('../../types/message_type');

const phoneNumbers = ["9198462735", "9198684114", "9198684334"];

const users = [
    {
        firstName: "Blerp",
        lastName: "Person",
        phoneNumber: phoneNumbers[0]
    },
    {
        firstName: "Two",
        lastName: "Cool",
        phoneNumber: phoneNumbers[1]
    },
    {
        firstName: "New",
        lastName: "doo",
        phoneNumber: phoneNumbers[2]
    }
]

describe('Setup conversation', () => {
    describe('setupGame', () => {

        beforeEach(done => {
            done();
        })

        it('it should be add the users to the database', (done) => {
            setupConversation.setupGameForTesting(users).then(() => {
                models.user.findAndCountAll({where: {
                    phoneNumber: {
                        [Sequelize.Op.in]: phoneNumbers
                    }
                }}).then((users) => {
                    users.count.should.equal(phoneNumbers.length);
                    done();
                }).catch(err => {done(err)});
            }).catch(err => {
                done(err)
            });
        });

        it('it should create turns for each player', (done) => {
           setupConversation.setupGameForTesting(users).then(() => {
                models.turn.max('gameId').then(currentGameId => {
                    models.turn.findAndCountAll({
                        where: {
                            gameId: currentGameId
                        }
                    }).then((turns) => {
                        turns.count.should.equal(users.length);
                        done();
                    }).catch(err => {done(err)});
                });
            }).catch(err => {
                done(err)
            }); 
        });

        it('it should create exactly one turn for first player with isCurrent set to true and messageType set to "text"', (done) => {
           setupConversation.setupGameForTesting(users).then(() => {
                models.turn.max('gameId').then(currentGameId => {
                    models.turn.findAll({
                        where: {
                            gameId: currentGameId,
                            isCurrent: true
                        },
                        raw: true
                    }).then((turns) => {
                        turns.length.should.equal(1);
                        turns[0].messageType.should.equal(MessageType.text);
                        done();
                    }).catch(err => {done(err)});
                });
            }).catch(err => {
                done(err)
            }); 
        });

        it('it should create exactly one turn for the last player where nextUserId is null', (done) => {
           setupConversation.setupGameForTesting(users).then(() => {
                models.turn.max('gameId').then(currentGameId => {
                    models.turn.findAndCountAll({
                        where: {
                            gameId: currentGameId,
                            nextUserId: null
                        }
                    }).then((turns) => {
                        turns.count.should.equal(1);
                        done();
                    }).catch(err => {done(err)});
                });
            }).catch(err => {
                done(err)
            }); 
        });
    })

    describe('containsPhoneNumber', () => {

        it('it should return true if a user has that phoneNumber', (done) => {
            setupConversation.containsPhoneNumberForTesting(users, phoneNumbers[0]).should.equal(true);
            done();
        });

        it('it should return false if no user has that phoneNumber', (done) => {
            setupConversation.containsPhoneNumberForTesting(users, "phoneNumbers").should.equal(false);
            done();
        });
    })
})
