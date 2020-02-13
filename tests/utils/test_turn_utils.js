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
        it('it should block for a weird character', (done) => {
            let weirdies = "👮👳🏄🧟  👩‍🍳🧓€";
            turnUtils.isValidResponse(weirdies, MessageType.text).should.equal(false);
            done();
        });
    })
});