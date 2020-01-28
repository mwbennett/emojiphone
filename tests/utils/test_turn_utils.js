var assert = require('assert');
var should = require('chai').should();
let turnUtils = require('../../utils/turn_utils');
let testUtils = require('../../utils/testing_utils');

const MessageType = require('../../types/message_type');

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

        it('it should get the first turn given a game id', async () => {
            let turn = await turnUtils.getCurrentTurn(testUtils.variables.gameId);
            turn.userId.should.equal(testUtils.variables.userIdOne);
        });
    })
});