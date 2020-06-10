const phone = require("phone");
const { BotkitConversation } = require('botkit');
const utils = require('../utils/utils');
const turnUtils = require('../utils/turn_utils');
const models = require('../models');
const MessageType = require('../types/message_type');

const TURN_CONVERSATION = 'turn';
const TURN_SUCCESS_THREAD = "success";
const TURN_FAIL_THREAD = "fail";
const TURN_THREAD = "turn";
const TURN_ERROR_THREAD = "error";
const DEFAULT_THREAD = 'default';
const COMPLETE_ACTION = 'complete';

module.exports = {
    /**
     * Create the converstaion template where a user takes their turn
     */
    setupTurnConversation: async () => {
        let convo = new BotkitConversation(TURN_CONVERSATION, utils.controller);
        convo.before(DEFAULT_THREAD, async (inConvo, bot) => {
            await module.exports.setConversationVariables(inConvo);
        });

        convo.addMessage({text: "Time to take your turn in your game of Emojiphone!", action: TURN_THREAD}, DEFAULT_THREAD);

        convo.addMessage({
            text: `Sorry your response was not written in ONLY {{vars.currentMessageType}}. Please try again!`,
            action: TURN_THREAD
        }, TURN_FAIL_THREAD);

        convo.addMessage({
            text: "Sorry, we encountered an error processing your turn. Please contact our support team at TODO.",
            action: COMPLETE_ACTION
        }, TURN_ERROR_THREAD)

        convo.addMessage({text: 'Thanks, your turn has been recorded! You will be notified when the game completes.', action: COMPLETE_ACTION}, TURN_SUCCESS_THREAD);

        module.exports.addTurnQuestion(convo);
        convo.after(async (results, bot) => {
            if (results.currentTurn.nextUserId != null) {
                module.exports.beginNextTurn(results.currentTurn);
            } else {
                module.exports.sendEndGameMessages(results.currentTurn.gameId);
            }
        })
        await utils.controller.addDialog(convo);
    },

    /**
     * Set up the variables that allow each conversation to be unique
     * @param  {object} convo  Botkit conversation that can ask questions
     */
    setConversationVariables: async (convo) => {
        let previousTurn = await turnUtils.getPreviousTurn(convo.vars.currentTurn);
        await convo.setVar("previousTurn", previousTurn);
        if (!previousTurn) {
            await convo.setVar("currentMessageType", MessageType.text);
        } else {
            await convo.setVar("currentMessageType", turnUtils.oppositeMessageType(previousTurn.messageType));
        }
        await convo.setVar("turnPrompt", turnUtils.makeTurnPrompt(previousTurn, convo.vars.currentMessageType));
    },


    /**
     * Create the "question" that a user interacts with to take their turn
     * @param  {object} convo  Botkit conversation that can ask questions
     */
    addTurnQuestion: (convo) => {
        convo.addQuestion("{{vars.turnPrompt}}", 
            [{
                default: true,
                handler: async function(response, inConvo, bot, full_message) {
                    if (turnUtils.isValidResponse(full_message.Body, inConvo.vars.currentMessageType)) {
                        try {
                            await models.turn.update({
                                message: full_message.Body,
                                messageType: inConvo.vars.currentMessageType,
                                receivedAt: new Date(),
                                isCurrent: false
                            }, {where: {id: inConvo.vars.currentTurn.id}});
                            await inConvo.gotoThread(TURN_SUCCESS_THREAD);
                        } catch(err){
                            console.log(err);
                            await inConvo.gotoThread(TURN_ERROR_THREAD);
                        }
                    } else {
                        await inConvo.gotoThread(TURN_FAIL_THREAD);
                    }
                }
            }], 'none', TURN_THREAD
        );
        
    },
    /**
     * Send messages to all participants that the game has ended
     * @param  {integer} gameId   gameId of game that just ended
     */
    sendEndGameMessages: async (gameId) => {
        let messageAndUsers = await turnUtils.getEndGameMessageWithUsers(gameId);
        for (let user of messageAndUsers.users) {
            await utils.sayOrQueueMessage(user, messageAndUsers.message);
        }
    },
    /**
     * Given the turn that was just completed, begin the next turn
     * @param  {object} completedTurn   Database Turn that was just completed.
     */
    beginNextTurn: async (completedTurn) => {
        let nextTurn = await models.turn.findOne({where: {userId: completedTurn.nextUserId, gameId: completedTurn.gameId}, include: [{model: models.user, as: "user"}]})
        nextTurn.update({isCurrent: true});
        await module.exports.takeTurn(nextTurn)
    },
    /**
     * Given the game identifier, start the first turn of the game!
     * @param  {integer} gameId   gameId of game that needs to begin
     */
    takeFirstTurn: async (gameId) => {
        let currentTurn = await turnUtils.getCurrentTurn(gameId);
        await module.exports.takeTurn(currentTurn)
    },
    /**
     * Start a turn conversation with a specific phone number
     * @param  {object} turn   Database Turn to be taken.
     */
    takeTurn: async (turn) => {
        let turnBot = await utils.controller.spawn({});
        await turnBot.startConversationWithUser(turn.user.phoneNumber);
        await turnBot.beginDialog(TURN_CONVERSATION, {currentTurn: turn});
    }

}
