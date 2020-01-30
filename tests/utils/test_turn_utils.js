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
});