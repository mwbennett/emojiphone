var assert = require('assert');
var should = require('chai').should();
let turnUtils = require('../../utils/turn_utils');
let testUtils = require('../../utils/testing_utils');

const MessageType = require('../../types/message_type');

const invalidGameId = 9999;

describe('Turn conversation utils', () => {
    describe('oppositeMessageType', () => {

        it('it should return emoji when text is input', (done) => {
            turnUtils.oppositeMessageType(MessageType.text).should.equal(MessageType.emoji);
            done();
        })

        it('it should return text when emoji is input', (done) => {
            turnUtils.oppositeMessageType(MessageType.emoji).should.equal(MessageType.text);
            done();
        })
    })

    describe('getCurrentTurn', () => {
        beforeEach(done => {
            testUtils.seedDatabase().then(() => {
                done()
            });
        })

        it('it should get the current turn given a game id', async () => {
            let turn = await turnUtils.getCurrentTurn(testUtils.variables.gameId);
            turn.user.id.should.equal(testUtils.variables.userIdOne);
        });

        it('it should return an empty result if game id is invalid', async () => {
            let turn = await turnUtils.getCurrentTurn(invalidGameId);
            should.not.exist(turn);
        });
    })
    describe('isValidResponse', () => {
        it('it should return false if type is text and message contains emoji characters', (done) => {
            turnUtils.isValidResponse("Here's some good stuff, but then 👮👳🏄🧟👩‍🍳🧓🚑🚔🎒🅾️Hey it's me.", MessageType.text).should.equal(false);
            done();
        });
        it('it should return true if type is text and message contains only alphanumeric characters', (done) => {
            turnUtils.isValidResponse("Here's a normal sentence; it has cool punctuation!@**#(!).", MessageType.text).should.equal(true);
            done();
        });
        it('it should return true if type is text and message contains only alphanumeric characters and spaces/newlines', (done) => {
            turnUtils.isValidResponse(`Neat! Oh    <message_type>   </message_type> burrito

                b;ajpowk`, MessageType.text).should.equal(true);
            done();
        });
        it('it should allow all the weird characters', (done) => {
            let weirdies = "•√π÷×¶∆£¢€¥^°={}\][✓%<>%/*-+0çxzlkjhgfdßàáâäæãåāèéēêë456ûúùüūîìïíīóøœōôöõòñ";
            turnUtils.isValidResponse(weirdies, MessageType.text).should.equal(true);
            done();
        });
        it('it should return false if type is emoji and message contains string characters', (done) => {
            turnUtils.isValidResponse("Here's some good stuff, but then 👮👳🏄🧟👩‍🍳🧓🚑🚔🎒🅾️Hey it's me.", MessageType.emoji).should.equal(false);
            done();
        });
        it('it should return true if type is emoji and message contains only emoji characters', (done) => {
            turnUtils.isValidResponse("👮👳🏄🧟👩‍🍳🧓🚑🚔🎒", MessageType.emoji).should.equal(true);
            done();
        });
        it('it should return true if type is emoji and message contains only emoji characters and spaces/newlines', (done) => {
            turnUtils.isValidResponse(`👮👳🏄🧟  👩‍🍳🧓 

                🚑🚔🎒`, MessageType.emoji).should.equal(true);
            done();
        });
        it('it should return false for a weird character', (done) => {
            let weirdies = "👮👳🏄🧟  👩‍🍳🧓€";
            turnUtils.isValidResponse(weirdies, MessageType.text).should.equal(false);
            done();
        });
    })
    describe('getUsersAndMessagesFromGameId', () => {

        beforeEach(done => {
            testUtils.seedDatabase().then(() => {
                done()
            });
        })

        it("it should return a list of users' names and their messages based on a gameId", async () => {
            let usersAndMessages = await turnUtils.getUsersAndMessagesFromGameId(testUtils.variables.completedGameId);

            usersAndMessages.should.be.a("array");
            usersAndMessages[0].should.have.property("message");
            usersAndMessages[0].should.have.property("user");
            usersAndMessages[0].user.should.have.property("firstName");
            usersAndMessages[0].user.should.have.property("lastName");
        });
        it('it should ignore any turns that were skipped', async () => {
            let usersAndMessages = await turnUtils.getUsersAndMessagesFromGameId(testUtils.variables.completedGameId);

            // Live game includes one skipped turn
            usersAndMessages.length.should.equal(testUtils.variables.liveGameTurns.length - 1);
            
        });
        it('it should return the turns in the correct order', async () => {
            let usersAndMessages = await turnUtils.getUsersAndMessagesFromGameId(testUtils.variables.completedGameId);

            usersAndMessages[0].message.should.equal(testUtils.variables.firstMessage);
            usersAndMessages[1].message.should.equal(testUtils.variables.secondMessage);
            usersAndMessages[2].message.should.equal(testUtils.variables.thirdMessage);
        });
    })
});