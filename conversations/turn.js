const utils = require('../utils/utils');
const turnUtils = require('../utils/turn_utils');
const models = require('../models');

const TURN_SUCCESS_THREAD = "success";
const TURN_FAIL_THREAD = "fail";
const TURN_THREAD = "turn";
const TURN_ERROR_THREAD = "error";

module.exports = {
    /**
     * Create the converstaion thread where a user can take their turn
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} phoneNumber  Phone number that initial prompt should be sent to.
     */
    initiateTurn: (bot, phoneNumber) => {
        bot.say({text: "Time to take your turn in your game of Emojiphone", channel: phoneNumber}, (err, response) => {
                if (!err) {
                    // Mark next turn as current
                }
            }
        );
    },
    /**
     * Create the converstaion thread where a user can take their turn
     * @param  {object} bot  Botkit bot that can create conversations
     * @param  {object} message  The intial message that was passed into the listener, should be INITIATE_GAME_KEYWORD
     * @param  {object} turn  Database Turn that was just taken.
     */
    // TODO: Send to the correct phone number
    initiateTurnConversation: (bot, previousTurn) => {
        let currentMessageType = turnUtils.oppositeMessageType(previousTurn.messageType);
        models.turn.findOne({where: {userId: previousTurn.nextUserId, gameId: previousTurn.gameId}, include: [{model: models.user, as: "user"}]}).then(currentTurn => {
            currentTurn.update({isCurrent: true});
            module.exports.initiateTurn(bot, currentTurn.user.phoneNumber);
            bot.createConversation(message, function(err, convo) {

                convo.addMessage('Thanks, your turn has been recorded! You will be notified when the game completes.', TURN_SUCCESS_THREAD);
                
                convo.addMessage({
                    text: `Sorry your response was not written in ONLY ${currentMessageType}. Please try again!`,
                    action: TURN_THREAD
                }, TURN_FAIL_THREAD);

                convo.addMessage({
                    text: "Sorry, we encountered an error processing your turn. Please try again or contact our support team at TODO.",
                    action: TURN_THREAD
                }, TURN_ERROR_THREAD)

                convo.addQuestion(`Text your response to the following prompt using ONLY ${currentMessageType}:
    ${previousTurn.message}`, 
                    [
                        {
                            default: true,
                            callback: async (response, convo) => {
                                if (turnUtils.isValidResponse(response.Body, currentMessageType)) {
                                    currentTurn.update({message: response.Body, messageType: currentMessageType, receivedAt: new Date(), isCurrent: false}).then(turn => {
                                        convo.gotoThread(TURN_SUCCESS_THREAD);
                                        module.exports.initiateTurnConversation(bot, currentTurn);
                                    }).catch(err => {
                                        console.log(err);
                                        convo.gotoThread(TURN_ERROR_THREAD);
                                    })

                                } else {
                                    convo.gotoThread(TURN_FAIL_THREAD);
                                }
                            }
                        }
                    ], {}, TURN_THREAD
                );

                convo.activate();

                convo.gotoThread(TURN_THREAD);
            })
        })
    }
}
